import { getSupabaseAdmin } from "./supabase";
import { logActivity } from "./activity";

/**
 * Track token usage and update credit state
 * Call this after every Claude API request
 */
export async function trackTokenUsage(
  tokensUsed: number,
  requestId?: string,
  model?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Log token usage
    await supabase.from("token_usage_log").insert({
      request_id: requestId || null,
      tokens_used: tokensUsed,
      model: model || "claude-sonnet-4-5",
    });

    // 2. Update credit state
    const { data: state, error: stateError } = await supabase
      .from("credit_state")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (stateError) throw stateError;

    if (!state) {
      // Initialize credit state if it doesn't exist
      await supabase.from("credit_state").insert({
        credit_balance_usdc: 0,
        tokens_used_total: tokensUsed,
        tokens_since_last_purchase: tokensUsed,
        daily_purchase_count: 0,
      });
      return;
    }

    const newTokensTotal = (state.tokens_used_total || 0) + tokensUsed;
    const newTokensSinceLastPurchase = (state.tokens_since_last_purchase || 0) + tokensUsed;

    await supabase
      .from("credit_state")
      .update({
        tokens_used_total: newTokensTotal,
        tokens_since_last_purchase: newTokensSinceLastPurchase,
      })
      .eq("id", state.id);

    console.log(
      `📊 Token tracking: +${tokensUsed} tokens | Total: ${newTokensTotal} | Since last purchase: ${newTokensSinceLastPurchase}`
    );

    // 3. Check if we should trigger auto-buy
    const balance = Number(state.credit_balance_usdc) || 0;
    const shouldAutoBuy = newTokensSinceLastPurchase >= 10000 && balance < 5.0;

    if (shouldAutoBuy && balance >= 5.0) {
      // We hit the threshold and have enough balance - trigger auto-buy!
      console.log("🤖 Auto-buy threshold reached! Triggering purchase...");

      await logActivity(
        "CREDIT_LOW",
        `⚠️ Token threshold reached: ${newTokensSinceLastPurchase} tokens | Balance: $${balance.toFixed(2)} | Triggering auto-buy...`,
        undefined
      );

      // Call auto-buy endpoint
      try {
        const backendUrl = process.env.BACKEND_BASE_URL || process.env.VERCEL_URL || "";
        const response = await fetch(`${backendUrl}/api/credit/auto-buy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Agent-Secret": process.env.AGENT_SHARED_SECRET || "",
          },
        });

        if (response.ok) {
          console.log("✅ Auto-buy triggered successfully");
        } else {
          console.error("❌ Auto-buy failed:", await response.text());
        }
      } catch (error) {
        console.error("❌ Auto-buy trigger failed:", error);
      }
    } else if (shouldAutoBuy && balance < 5.0) {
      // Hit threshold but insufficient balance - log warning
      console.log("⚠️ Auto-buy threshold reached but insufficient balance!");

      await logActivity(
        "CREDIT_LOW",
        `⚠️ CRITICAL: ${newTokensSinceLastPurchase} tokens used, balance only $${balance.toFixed(2)} - Need sponsorship!`,
        undefined
      );
    }
  } catch (error) {
    // Don't throw - token tracking is non-critical
    console.error("Failed to track tokens:", error);
  }
}

/**
 * Get current token usage stats
 */
export async function getTokenStats(): Promise<{
  tokensUsedTotal: number;
  tokensSinceLastPurchase: number;
  creditBalance: number;
  shouldAutoBuy: boolean;
}> {
  const supabase = getSupabaseAdmin();

  const { data: state } = await supabase
    .from("credit_state")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (!state) {
    return {
      tokensUsedTotal: 0,
      tokensSinceLastPurchase: 0,
      creditBalance: 0,
      shouldAutoBuy: false,
    };
  }

  const tokensUsedTotal = state.tokens_used_total || 0;
  const tokensSinceLastPurchase = state.tokens_since_last_purchase || 0;
  const creditBalance = Number(state.credit_balance_usdc) || 0;
  const shouldAutoBuy = tokensSinceLastPurchase >= 10000 && creditBalance < 5.0;

  return {
    tokensUsedTotal,
    tokensSinceLastPurchase,
    creditBalance,
    shouldAutoBuy,
  };
}
