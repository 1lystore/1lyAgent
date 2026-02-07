import { err, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * POST /api/credit/auto-buy
 * Agent calls this to automatically purchase credits from OpenRouter with USDC
 *
 * Triggers when:
 * - tokens_since_last_purchase >= 500 (testing threshold)
 * - credit_balance_usdc >= $5 (has money to spend)
 */
export async function POST(req: Request) {
  try {
    // Verify agent authentication (same auth as deliveryUrl)
    const authHeader = req.headers.get("Authorization");
    const expectedToken = `Bearer ${getRequiredEnv("AGENT_HOOK_TOKEN")}`;

    if (authHeader !== expectedToken) {
      return err("Unauthorized: invalid agent token", 401);
    }

    const supabase = getSupabaseAdmin();

    // 1. Check credit state
    const { data: state, error: stateError } = await supabase
      .from("credit_state")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (stateError) throw stateError;
    if (!state) return err("Credit state not initialized", 500);

    const tokensUsed = state.tokens_since_last_purchase || 0;
    const balance = Number(state.credit_balance_usdc) || 0;

    // 2. Check if we should auto-buy
    const shouldAutoBuy = tokensUsed >= 500 && balance >= 5.0;

    if (!shouldAutoBuy) {
      return ok({
        purchased: false,
        reason: tokensUsed < 500
          ? `Only ${tokensUsed} tokens used (need 500)`
          : `Balance $${balance.toFixed(2)} < $5 (insufficient)`,
        tokens_used: tokensUsed,
        balance,
      });
    }

    // 3. Check if we have enough balance to buy
    const PURCHASE_AMOUNT = 5.0; // Buy $5 worth of credits
    if (balance < PURCHASE_AMOUNT) {
      await logActivity(
        "ERROR",
        `Auto-buy failed: Insufficient balance ($${balance.toFixed(2)} < $${PURCHASE_AMOUNT}). Need user sponsorship!`,
        undefined
      );

      return err(
        `Insufficient balance to auto-buy. Current: $${balance.toFixed(2)}, Need: $${PURCHASE_AMOUNT}. Waiting for user sponsorship...`,
        402 // Payment Required
      );
    }

    // 4. Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("credit_purchases")
      .insert({
        sponsor_message: "Auto-purchase by agent",
        amount_usdc: PURCHASE_AMOUNT,
        paid_usdc: PURCHASE_AMOUNT,
        sponsor_type: "agent",
        status: "AUTO_BUYING",
      })
      .select("id")
      .single();

    if (purchaseError) throw purchaseError;

    console.log(`🤖 Auto-buying $${PURCHASE_AMOUNT} credits from OpenRouter...`);

    // 4.5. Set UI status: Purchase in progress
    await supabase
      .from("credit_state")
      .update({
        auto_buy_in_progress: true,
        last_auto_buy_message: `🤖 Purchasing $${PURCHASE_AMOUNT} credits from OpenRouter...`,
        last_auto_buy_status: null,
      })
      .eq("id", state.id);

    // Small delay so UI has time to show "in progress" state
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 5. Call OpenRouter API to add credits with USDC
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    // TODO: Switch to Coinbase USDC payment once Base wallet is funded
    // For now using /credits/add (requires card on file)
    // Future: POST /api/v1/credits/coinbase with USDC from Base wallet
    const response = await fetch("https://openrouter.ai/api/v1/credits/add", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: PURCHASE_AMOUNT,
        currency: "USD",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", errorText);

      // Mark purchase as failed and update UI status
      await supabase
        .from("credit_purchases")
        .update({ status: "FAILED", provider_status: errorText })
        .eq("id", purchase.id);

      await supabase
        .from("credit_state")
        .update({
          auto_buy_in_progress: false,
          last_auto_buy_status: "failed",
          last_auto_buy_message: "❌ Purchase failed: OpenRouter API error",
          last_auto_buy_error: errorText,
        })
        .eq("id", state.id);

      throw new Error(`OpenRouter API failed: ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ OpenRouter purchase successful:", result);

    // 6. Update purchase record as successful
    await supabase
      .from("credit_purchases")
      .update({
        status: "PURCHASED",
        openrouter_tx_id: result.transaction_id || result.id || "unknown",
        purchase_day: new Date().toISOString().slice(0, 10),
      })
      .eq("id", purchase.id);

    // 7. Update credit state with success status
    const newBalance = balance - PURCHASE_AMOUNT;
    const { error: updateError } = await supabase
      .from("credit_state")
      .update({
        credit_balance_usdc: newBalance,
        tokens_since_last_purchase: 0, // Reset token counter
        daily_purchase_count: (state.daily_purchase_count || 0) + 1,
        last_auto_purchase_at: new Date().toISOString(),
        auto_buy_in_progress: false,
        last_auto_buy_status: "success",
        last_auto_buy_message: `✅ Auto-bought $${PURCHASE_AMOUNT}! Balance: $${balance.toFixed(2)} → $${newBalance.toFixed(2)}`,
        last_auto_buy_error: null,
      })
      .eq("id", state.id);

    if (updateError) throw updateError;

    // 8. Log activity
    await logActivity(
      "CREDIT_AUTO_PURCHASE",
      `🤖 Self-sufficient AI! Auto-bought $${PURCHASE_AMOUNT} credits from OpenRouter | Balance: $${balance.toFixed(2)} → $${newBalance.toFixed(2)} | Tokens reset: ${tokensUsed} → 0`,
      undefined
    );

    console.log(`✅ Auto-purchase complete! New balance: $${newBalance.toFixed(2)}`);

    return ok({
      purchased: true,
      amount: PURCHASE_AMOUNT,
      previous_balance: balance,
      new_balance: newBalance,
      tokens_reset: tokensUsed,
      transaction_id: result.transaction_id || result.id,
      purchase_id: purchase.id,
    });
  } catch (e) {
    console.error("Auto-buy error:", e);

    // Update UI status: Failed
    try {
      const supabase = getSupabaseAdmin();
      const { data: state } = await supabase.from("credit_state").select("id").limit(1).single();

      if (state) {
        await supabase
          .from("credit_state")
          .update({
            auto_buy_in_progress: false,
            last_auto_buy_status: "failed",
            last_auto_buy_message: `❌ Purchase failed: ${e instanceof Error ? e.message : "Unknown error"}`,
            last_auto_buy_error: e instanceof Error ? e.stack : String(e),
          })
          .eq("id", state.id);
      }
    } catch (updateErr) {
      console.error("Failed to update error status:", updateErr);
    }

    await logActivity(
      "ERROR",
      `Auto-buy failed: ${e instanceof Error ? e.message : "Unknown error"}`,
      undefined
    );

    return err(e instanceof Error ? e.message : "Auto-buy failed", 500);
  }
}

/**
 * GET /api/credit/auto-buy
 * Check if auto-buy should trigger (for testing)
 */
export async function GET(req: Request) {
  try {
    // Verify agent authentication (same auth as deliveryUrl)
    const authHeader = req.headers.get("Authorization");
    const expectedToken = `Bearer ${getRequiredEnv("AGENT_HOOK_TOKEN")}`;

    if (authHeader !== expectedToken) {
      return err("Unauthorized: invalid agent token", 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: state } = await supabase
      .from("credit_state")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!state) return ok({ should_auto_buy: false, reason: "No state" });

    const tokensUsed = state.tokens_since_last_purchase || 0;
    const balance = Number(state.credit_balance_usdc) || 0;
    const shouldAutoBuy = tokensUsed >= 10000 && balance < 5.0;

    return ok({
      should_auto_buy: shouldAutoBuy,
      tokens_used: tokensUsed,
      balance,
      threshold_tokens: 10000,
      threshold_balance: 5.0,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : "Check failed", 500);
  }
}
