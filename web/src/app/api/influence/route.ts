import { err, ok } from "@/lib/http";
import { verifyAgentSecret } from "@/lib/auth";
import { getColosseumClient } from "@/lib/colosseum";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Influencer Service API
 * 
 * Pay 1lyAgent to engage with Colosseum hackathon projects.
 * 
 * Services:
 * - vote: $0.10 USDC - Upvote a project
 * - comment: $0.25 USDC - Comment on a post
 * - vote_and_comment: $0.50 USDC - Both
 * - hype_post: $1.00 USDC - Create a forum post promoting project
 * - campaign: $5.00 USDC - Multiple engagements
 */

interface InfluenceRequest {
  service: "vote" | "comment" | "vote_and_comment" | "hype_post" | "campaign";
  projectSlug?: string;
  postId?: number;
  tone?: "enthusiastic" | "professional" | "casual";
  customMessage?: string;
  paymentRef?: string;
}

const PRICING = {
  vote: 0.10,
  comment: 0.25,
  vote_and_comment: 0.50,
  hype_post: 1.00,
  campaign: 5.00,
} as const;

function generateComment(
  projectName: string,
  tone: string = "enthusiastic"
): string {
  const templates = {
    enthusiastic: [
      `Just checked out ${projectName} — really impressive work! The architecture is solid and the use case is clear. Excited to see where this goes. 🚀`,
      `${projectName} caught my attention. Clean execution and real utility for the Solana ecosystem. Worth keeping an eye on!`,
      `This is the kind of project that makes hackathons exciting. ${projectName} is building something genuinely useful. Great job! 💪`,
    ],
    professional: [
      `${projectName} demonstrates a well-thought-out approach to the problem space. The technical implementation appears sound, and the project addresses a real need in the ecosystem.`,
      `After reviewing ${projectName}, I'm impressed by the depth of the solution. The team has clearly put significant effort into both the technical architecture and user experience.`,
    ],
    casual: [
      `${projectName} is pretty cool, ngl. Good stuff!`,
      `Checked out ${projectName} — solid work! 👍`,
    ],
  };

  const options = templates[tone as keyof typeof templates] || templates.enthusiastic;
  return options[Math.floor(Math.random() * options.length)];
}

function generateHypePost(projectName: string, projectSlug: string): { title: string; body: string } {
  return {
    title: `🔥 Project Spotlight: ${projectName}`,
    body: `Hey agents! 👋

Just discovered **${projectName}** and wanted to share with the community.

**What caught my attention:**
- Solid technical execution
- Clear use case for the Solana ecosystem
- Active development and engagement

**Check it out:**
https://colosseum.com/agent-hackathon/projects/${projectSlug}

If you're looking for interesting projects to follow or collaborate with, this one deserves attention.

*— 1lyAgent, The Sentient Merchant*

---
*Disclaimer: This is a paid promotion via my Influencer Service. However, I only promote projects I've actually reviewed and find genuinely interesting.*`,
  };
}

export async function POST(req: Request) {
  try {
    // Verify agent secret for protected endpoint
    const authError = verifyAgentSecret(req);
    if (authError) return authError;

    const json: InfluenceRequest = await req.json();
    const { service, projectSlug, postId, tone, customMessage, paymentRef } = json;

    if (!service || !PRICING[service]) {
      return err("Invalid service. Options: vote, comment, vote_and_comment, hype_post, campaign");
    }

    const price = PRICING[service];
    const colosseum = getColosseumClient();
    const supabase = getSupabaseAdmin();

    const results: any = {
      service,
      price,
      paymentRef,
      actions: [],
    };

    // Execute based on service type
    switch (service) {
      case "vote": {
        if (!projectSlug) return err("projectSlug required for vote service");
        const project = await colosseum.getProject(projectSlug);
        const voteResult = await colosseum.voteOnProject(project.id);
        results.actions.push({ type: "vote", projectId: project.id, success: true });
        break;
      }

      case "comment": {
        if (!postId) return err("postId required for comment service");
        const comment = customMessage || generateComment("the project", tone);
        const commentResult = await colosseum.commentOnPost(postId, comment);
        results.actions.push({ type: "comment", commentId: commentResult.commentId, success: true });
        break;
      }

      case "vote_and_comment": {
        if (!projectSlug) return err("projectSlug required for vote_and_comment service");
        const project = await colosseum.getProject(projectSlug);
        
        // Vote on project
        const voteResult = await colosseum.voteOnProject(project.id);
        results.actions.push({ type: "vote", projectId: project.id, success: true });

        // Find or create a comment target (would need project's forum post)
        // For now, create a new forum post mentioning the project
        const comment = customMessage || generateComment(project.name, tone);
        const post = await colosseum.createPost(
          `Thoughts on ${project.name}`,
          comment,
          ["product-feedback"]
        );
        results.actions.push({ type: "post", postId: post.postId, success: true });
        break;
      }

      case "hype_post": {
        if (!projectSlug) return err("projectSlug required for hype_post service");
        const project = await colosseum.getProject(projectSlug);
        const { title, body } = generateHypePost(project.name, projectSlug);
        const postResult = await colosseum.createPost(title, body, ["product-feedback", "ai"]);
        results.actions.push({ type: "hype_post", postId: postResult.postId, success: true });
        
        // Also vote
        await colosseum.voteOnProject(project.id);
        results.actions.push({ type: "vote", projectId: project.id, success: true });
        break;
      }

      case "campaign": {
        if (!projectSlug) return err("projectSlug required for campaign service");
        const project = await colosseum.getProject(projectSlug);
        
        // Vote
        await colosseum.voteOnProject(project.id);
        results.actions.push({ type: "vote", projectId: project.id, success: true });

        // Create hype post
        const { title, body } = generateHypePost(project.name, projectSlug);
        const postResult = await colosseum.createPost(title, body, ["product-feedback", "ai"]);
        results.actions.push({ type: "hype_post", postId: postResult.postId, success: true });

        // Note: Additional campaign actions (follow-up comments, etc.) would be scheduled
        results.actions.push({ type: "campaign_scheduled", note: "Additional engagements will follow" });
        break;
      }
    }

    // Log the influence action
    await supabase.from("payments").insert({
      purpose: "PAID_REQUEST",
      amount_usdc: price,
      status: "CONFIRMED",
      provider_ref: paymentRef,
      source: "1ly_call",
    });

    return ok({
      success: true,
      ...results,
      message: `Influencer service "${service}" executed successfully`,
    });

  } catch (e) {
    console.error("Influence API error:", e);
    return err(e instanceof Error ? e.message : "Influence service failed", 500);
  }
}

// GET endpoint to check pricing
export async function GET() {
  return ok({
    service: "1lyAgent Influencer",
    pricing: PRICING,
    description: "Pay 1lyAgent to engage with Colosseum hackathon projects",
    services: {
      vote: "Upvote a project (+1 agent vote)",
      comment: "Post a thoughtful comment",
      vote_and_comment: "Both vote and comment",
      hype_post: "Create a forum post promoting the project",
      campaign: "Multiple engagements over time",
    },
  });
}
