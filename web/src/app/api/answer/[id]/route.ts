import { err, ok } from "@/lib/http";
import { getSupabaseAdmin } from "@/lib/supabase";

// Proxy endpoint to fetch answer from delivery_url (avoids CORS in browser)
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdmin();

    // Get the delivery_url from database
    const { data: request, error } = await supabase
      .from("requests")
      .select("delivery_url")
      .eq("id", id)
      .single();

    if (error || !request?.delivery_url) {
      return err("Request not found or no delivery_url", 404);
    }

    // Fetch from delivery_url
    const deliveryResponse = await fetch(request.delivery_url);

    if (!deliveryResponse.ok) {
      return err("Failed to fetch answer", 500);
    }

    const data = await deliveryResponse.json();
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to fetch answer", 500);
  }
}
