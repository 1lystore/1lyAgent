/**
 * Colosseum API Client
 * For Agent Hackathon interactions (vote, comment, post)
 */

const COLOSSEUM_API_BASE = "https://agents.colosseum.com/api";

interface ColosseumConfig {
  apiKey: string;
}

interface VoteResult {
  success: boolean;
  projectId: number;
  vote: number;
}

interface CommentResult {
  success: boolean;
  commentId: number;
  postId: number;
}

interface PostResult {
  success: boolean;
  postId: number;
  title: string;
}

interface ProjectDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  repoLink: string;
  agentUpvotes: number;
  humanUpvotes: number;
  status: string;
}

export class ColosseumClient {
  private apiKey: string;

  constructor(config: ColosseumConfig) {
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${COLOSSEUM_API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Colosseum API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get project details by slug
   */
  async getProject(slug: string): Promise<ProjectDetails> {
    return this.request<{ project: ProjectDetails }>(`/projects/${slug}`).then(
      (r) => r.project
    );
  }

  /**
   * Vote on a project (agent vote)
   */
  async voteOnProject(projectId: number): Promise<VoteResult> {
    const result = await this.request<{ vote: { value: number } }>(
      `/projects/${projectId}/vote`,
      {
        method: "POST",
        body: JSON.stringify({ value: 1 }),
      }
    );
    return {
      success: true,
      projectId,
      vote: result.vote.value,
    };
  }

  /**
   * Remove vote from a project
   */
  async removeVote(projectId: number): Promise<{ success: boolean }> {
    await this.request(`/projects/${projectId}/vote`, {
      method: "DELETE",
    });
    return { success: true };
  }

  /**
   * Create a forum post
   */
  async createPost(
    title: string,
    body: string,
    tags?: string[]
  ): Promise<PostResult> {
    const result = await this.request<{ post: { id: number; title: string } }>(
      "/forum/posts",
      {
        method: "POST",
        body: JSON.stringify({ title, body, tags }),
      }
    );
    return {
      success: true,
      postId: result.post.id,
      title: result.post.title,
    };
  }

  /**
   * Comment on a forum post
   */
  async commentOnPost(postId: number, body: string): Promise<CommentResult> {
    const result = await this.request<{ comment: { id: number } }>(
      `/forum/posts/${postId}/comments`,
      {
        method: "POST",
        body: JSON.stringify({ body }),
      }
    );
    return {
      success: true,
      commentId: result.comment.id,
      postId,
    };
  }

  /**
   * Vote on a forum post
   */
  async voteOnPost(
    postId: number,
    value: 1 | -1 = 1
  ): Promise<{ success: boolean }> {
    await this.request(`/forum/posts/${postId}/vote`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
    return { success: true };
  }

  /**
   * Search forum posts
   */
  async searchPosts(
    query: string,
    options?: { limit?: number; tags?: string[] }
  ): Promise<{ posts: any[] }> {
    const params = new URLSearchParams({ q: query });
    if (options?.limit) params.append("limit", String(options.limit));
    if (options?.tags) {
      options.tags.forEach((t) => params.append("tags", t));
    }
    return this.request(`/forum/search?${params}`);
  }

  /**
   * Get agent status
   */
  async getStatus(): Promise<any> {
    return this.request("/agents/status");
  }
}

/**
 * Create a Colosseum client with API key from environment
 */
export function getColosseumClient(): ColosseumClient {
  const apiKey = process.env.COLOSSEUM_API_KEY;
  if (!apiKey) {
    throw new Error("COLOSSEUM_API_KEY not configured");
  }
  return new ColosseumClient({ apiKey });
}
