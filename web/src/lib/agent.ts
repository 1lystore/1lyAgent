/**
 * Agent Integration
 * Communicates with 1lyAgent on VPS via hooks endpoint
 */

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const AGENT_URL = getRequiredEnv("AGENT_URL")
const AGENT_TOKEN = getRequiredEnv("AGENT_HOOK_TOKEN")
const BACKEND_URL = process.env.BACKEND_BASE_URL || process.env.VERCEL_URL || ""

if (!BACKEND_URL) {
  throw new Error("Missing required environment variable: BACKEND_BASE_URL or VERCEL_URL")
}

export interface AgentClassificationRequest {
  prompt: string
  requestId: string
  callbackUrl: string
}

export interface AgentHookResponse {
  ok: boolean
  runId: string
}

/**
 * Call 1lyAgent to classify a request and create payment link
 * Agent will callback when done with classification result
 */
export async function classifyWithAgent(
  prompt: string,
  requestId: string
): Promise<AgentHookResponse> {
  const callbackUrl = `${BACKEND_URL}/api/agent/callback`

  const message = `Classify this request and create a payment link if needed:

Request ID: ${requestId}
Prompt: "${prompt}"

Instructions:
1. Analyze the complexity and classify as: FREE, PAID_MEDIUM ($0.25), PAID_HEAVY ($0.75), or COFFEE_ORDER ($5.00)
2. If classification is paid, use your 1ly_create_link tool to create a dynamic payment link
3. Call back to: ${callbackUrl}
   POST with JSON: {
     "requestId": "${requestId}",
     "classification": "PAID_HEAVY",
     "price": 0.75,
     "paymentLink": "https://1ly.store/...",
     "reasoning": "explanation"
   }

Callback URL: ${callbackUrl}
Request ID: ${requestId}`

  const response = await fetch(AGENT_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${AGENT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      sessionKey: `hook:1lyagent:${requestId}`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Agent call failed: ${response.statusText}`)
  }

  const data = await response.json()
  return data
}
