import { getSupabaseAdmin } from "./supabase"

interface RateLimitCheck {
  allowed: boolean
  reason?: "per_ip" | "global" | "ok"
  remainingPerIp?: number
  remainingGlobal?: number
}

// In-memory rate limit tracking
const ipRequestCounts = new Map<string, number[]>()
const globalRequestTimes: number[] = []

const PER_IP_LIMIT = 5
const GLOBAL_LIMIT = 10
const WINDOW_MS = 60 * 1000 // 1 minute

/**
 * Clean up old entries (older than 1 minute)
 */
function cleanupOldEntries() {
  const now = Date.now()
  const cutoff = now - WINDOW_MS

  // Clean IP tracking
  for (const [ip, times] of ipRequestCounts.entries()) {
    const recentTimes = times.filter(t => t > cutoff)
    if (recentTimes.length === 0) {
      ipRequestCounts.delete(ip)
    } else {
      ipRequestCounts.set(ip, recentTimes)
    }
  }

  // Clean global tracking
  while (globalRequestTimes.length > 0 && globalRequestTimes[0]! < cutoff) {
    globalRequestTimes.shift()
  }
}

/**
 * Check if request should be rate limited
 *
 * Rules:
 * - Max 5 requests per IP per minute
 * - Max 10 requests globally per minute
 *
 * If exceeded, agent responds with "low on energy, need coffee"
 */
export async function checkRateLimit(ip: string): Promise<RateLimitCheck> {
  try {
    cleanupOldEntries()

    const now = Date.now()

    // Get current counts
    const ipTimes = ipRequestCounts.get(ip) || []
    const ipCount = ipTimes.length
    const globalCount = globalRequestTimes.length

    // Check per-IP limit
    if (ipCount >= PER_IP_LIMIT) {
      console.log(`⚠️ Rate limit: IP ${ip} has ${ipCount} requests in last minute`)
      return {
        allowed: false,
        reason: "per_ip",
        remainingPerIp: 0,
        remainingGlobal: GLOBAL_LIMIT - globalCount,
      }
    }

    // Check global limit
    if (globalCount >= GLOBAL_LIMIT) {
      console.log(`⚠️ Rate limit: Global ${globalCount} requests in last minute`)
      return {
        allowed: false,
        reason: "global",
        remainingPerIp: PER_IP_LIMIT - ipCount,
        remainingGlobal: 0,
      }
    }

    // Record this request
    ipTimes.push(now)
    ipRequestCounts.set(ip, ipTimes)
    globalRequestTimes.push(now)

    return {
      allowed: true,
      reason: "ok",
      remainingPerIp: PER_IP_LIMIT - ipCount - 1,
      remainingGlobal: GLOBAL_LIMIT - globalCount - 1,
    }
  } catch (error) {
    console.error("Rate limit check failed:", error)
    // On error, allow the request (fail open)
    return { allowed: true, reason: "ok" }
  }
}

/**
 * Generate "low on energy" response
 */
export function getLowEnergyResponse(reason: "per_ip" | "global"): string {
  const messages = {
    per_ip: `⚡ Whoa there! I'm running low on energy from all your requests.

I've processed 5+ requests from you in the last minute and need to recharge.

💡 **How to help:**
☕ Buy me a coffee ($5 USDC) to keep me running: https://1ly.store/1lyagent/tip

I'll be back to full power in 60 seconds, or you can fuel me up now! ⚡`,

    global: `⚡ I'm getting overwhelmed! Too many requests from everyone.

The entire system has processed 10+ requests in the last minute and I need a moment to catch my breath.

💡 **How to help:**
☕ Buy me a coffee ($5 USDC) to boost capacity: https://1ly.store/1lyagent/tip

Rate limit resets in 60 seconds. Thanks for your patience! ⚡`,
  }

  return messages[reason]
}
