import { ok, err } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/credit/state
 * Returns current credit balance and token usage stats
 */
export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    // Fetch credit state
    const { data: state, error } = await supabase
      .from("credit_state")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    // If no state exists, return default
    if (!state) {
      return ok({
        credit_balance_usdc: 0,
        tokens_used_total: 0,
        tokens_since_last_purchase: 0,
        daily_purchase_count: 0,
        last_auto_purchase_at: null,
        is_low_on_credit: false,
      });
    }

    // Check if low on credit: tokens >= 500 AND balance < $5
    const tokens = Number(state.tokens_since_last_purchase || 0);
    const balance = Number(state.credit_balance_usdc || 0);
    const isLowOnCredit = tokens >= 500 && balance < 5.0;

    console.log(`[Credit State] tokens=${tokens}, balance=${balance}, isLow=${isLowOnCredit}`);

    return ok({
      credit_balance_usdc: Number(state.credit_balance_usdc) || 0,
      tokens_used_total: Number(state.tokens_used_total) || 0,
      tokens_since_last_purchase: Number(state.tokens_since_last_purchase) || 0,
      daily_purchase_count: state.daily_purchase_count || 0,
      last_auto_purchase_at: state.last_auto_purchase_at || null,
      next_purchase_window: state.next_purchase_window || null,
      is_low_on_credit: isLowOnCredit,
      // Live status for UI feedback
      auto_buy_in_progress: state.auto_buy_in_progress || false,
      last_auto_buy_status: state.last_auto_buy_status || null,
      last_auto_buy_message: state.last_auto_buy_message || null,
    });
  } catch (e) {
    console.error("Failed to fetch credit state:", e);
    return err(e instanceof Error ? e.message : "Failed to fetch credit state", 500);
  }
}
