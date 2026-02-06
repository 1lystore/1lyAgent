import { getSupabaseAdmin } from "./supabase"

// Activity log events
export type ActivityEvent =
  | "AGENT_ONLINE"
  | "STORE_VERIFIED"
  | "REQUEST_RECEIVED"
  | "CLASSIFICATION"
  | "LINK_CREATED"
  | "PAYMENT_CONFIRMED"
  | "FULFILLED"
  | "COFFEE_TIP"
  | "COFFEE_QUEUED"
  | "COFFEE_EXECUTED"
  | "CREDIT_SPONSORED"
  | "CREDIT_AUTO_PURCHASE"
  | "CREDIT_LOW"
  | "ERROR"

/**
 * Log activity to public feed
 * Truncates prompts to 50 chars for privacy
 */
export async function logActivity(
  event: ActivityEvent,
  data: string,
  requestId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    await supabase.from("activity_log").insert({
      event,
      data,
      request_id: requestId || null,
    })
  } catch (error) {
    // Don't throw - activity logging is non-critical
    console.error("Failed to log activity:", error)
  }
}

/**
 * Truncate prompt for public display (privacy)
 */
export function truncatePrompt(prompt: string, maxLength = 50): string {
  if (prompt.length <= maxLength) return prompt
  return prompt.substring(0, maxLength) + "..."
}
