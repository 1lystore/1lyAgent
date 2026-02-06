import { isTrustedCaller } from "@/lib/auth";
import { err, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const creditQueueSchema = z.object({
  sponsorMessage: z.string(),
  amountUsdc: z.number().positive(),
  sponsorType: z.enum(["human", "agent"]).default("human"),
});

/**
 * POST /api/credit/queue
 * Queue a credit sponsorship (called after payment confirmed)
 */
export async function POST(req: Request) {
  try {
    if (!isTrustedCaller(req)) return err("Unauthorized caller", 401);

    const json = await req.json();
    const parsed = creditQueueSchema.safeParse(json);
    if (!parsed.success) return err(parsed.error.issues[0]?.message ?? "Invalid payload");

    const supabase = getSupabaseAdmin();

    // 1. Add to credit_purchases
    const { data: purchase, error: purchaseError } = await supabase
      .from("credit_purchases")
      .insert({
        sponsor_message: parsed.data.sponsorMessage,
        amount_usdc: parsed.data.amountUsdc,
        paid_usdc: parsed.data.amountUsdc,
        sponsor_type: parsed.data.sponsorType,
        status: "QUEUED",
      })
      .select("id, status")
      .single();

    if (purchaseError) throw purchaseError;

    // 2. Update credit balance (add sponsored amount)
    const { data: state, error: stateError } = await supabase
      .from("credit_state")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (stateError) throw stateError;

    if (state) {
      const newBalance = (Number(state.credit_balance_usdc) || 0) + parsed.data.amountUsdc;

      const { error: updateError } = await supabase
        .from("credit_state")
        .update({ credit_balance_usdc: newBalance })
        .eq("id", state.id);

      if (updateError) throw updateError;

      console.log(`💳 Credit sponsored: +$${parsed.data.amountUsdc} → New balance: $${newBalance.toFixed(2)}`);
    }

    return ok({
      id: purchase.id,
      status: purchase.status,
      message: "Credit sponsorship queued successfully",
    }, 201);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Queue failed", 500);
  }
}
