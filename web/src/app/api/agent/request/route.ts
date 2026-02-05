import { err, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requestSchema } from "@/lib/schemas";
import { classifyWithAgent } from "@/lib/agent";

/**
 * Agent Request Endpoint
 *
 * Flow:
 * 1. Receive prompt
 * 2. Store request (status: PENDING)
 * 3. Call 1lyAgent async (Claude classifies + creates link)
 * 4. Return 202 Accepted with request ID
 * 5. Agent callbacks when done → /api/agent/callback
 * 6. Client polls /api/status/:id for result
 */

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();

  try {
    const json = await req.json();
    const parsed = requestSchema.safeParse({ ...json, source: json.source || "external_agent" });

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Invalid payload");
    }

    const { prompt, source, callbackUrl } = parsed.data;

    // 1. Store the request (NEW - waiting for agent)
    const { data: request, error: insertError } = await supabase
      .from("requests")
      .insert({
        prompt,
        source,
        status: "NEW",
        callback_url: callbackUrl || null,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    console.log(`[Request ${request.id}] Created, calling agent...`);

    // 2. Call 1lyAgent async - agent will callback when done
    try {
      const agentResponse = await classifyWithAgent(prompt, request.id);
      console.log(`[Request ${request.id}] Agent processing: runId=${agentResponse.runId}`);
    } catch (agentError) {
      console.error(`[Request ${request.id}] Agent call failed:`, agentError);

      // Mark as failed
      await supabase
        .from("requests")
        .update({ status: "FAILED" })
        .eq("id", request.id);

      return err("Failed to reach agent", 503);
    }

    // 3. Return 202 Accepted - processing async
    const backendUrl = process.env.BACKEND_BASE_URL || process.env.VERCEL_URL || "";
    return new Response(JSON.stringify({
      id: request.id,
      status: "processing",
      message: "Request received. Agent is classifying...",
      statusUrl: `${backendUrl}/api/status/${request.id}`,
    }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("[Request] Error:", e);
    return err(e instanceof Error ? e.message : "Request processing failed", 500);
  }
}

// GET - Info about the oracle
export async function GET() {
  return ok({
    service: "1lyAgent Reasoning Oracle",
    description: "Submit prompts for classification and pricing",
    pricing: {
      FREE: "$0 - Greetings, simple questions",
      PAID_MEDIUM: "$0.25 - Substantive questions",
      PAID_HEAVY: "$0.75 - Research, analysis, reports",
      COFFEE_ORDER: "$5.00 - Tips to keep the agent running",
    },
    usage: {
      method: "POST",
      body: { prompt: "Your question here" },
      responses: {
        "200": "FREE request - immediate response",
        "402": "PAID request - payment link provided",
      }
    },
    store: "https://1ly.store/1lyagent",
  });
}
