import { err, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("requests")
      .select("id,prompt,classification,price_usdc,status,payment_link,payment_ref,deliverable,delivery_url,created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return err("Not found", 404);
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Status failed", 500);
  }
}
