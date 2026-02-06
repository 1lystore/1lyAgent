import { ok, err } from "@/lib/http"
import { getSupabaseAdmin } from "@/lib/supabase"

/**
 * GET /api/activity
 * Fetch recent activity log entries for public feed
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from("activity_log")
      .select("id, event, data, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    return ok(data || [])
  } catch (e) {
    return err(e instanceof Error ? e.message : "Failed to fetch activity", 500)
  }
}
