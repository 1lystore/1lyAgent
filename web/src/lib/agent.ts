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
  requestId: string,
  deliveryUrl: string,
  webhookUrl: string
): Promise<AgentHookResponse> {
  const callbackUrl = `${BACKEND_URL}/api/agent/callback`

  const message = `CLASSIFY REQUEST

requestId: ${requestId}
prompt: ${prompt}
callbackUrl: ${callbackUrl}
deliveryUrl: ${deliveryUrl}
webhookUrl: ${webhookUrl}

INSTRUCTIONS:
1. Analyze the complexity and classify as: FREE, PAID_MEDIUM ($0.25), PAID_HEAVY ($0.75), or COFFEE_ORDER ($5.00)

2. For FREE requests:
   - Generate your answer text
   - POST to deliveryUrl using jq to encode JSON properly:
     jq -n --arg answer "your response" '{answer: $answer}' | curl -X POST "${deliveryUrl}" -H "Authorization: Bearer $(cat ~/.1lyagent-token)" -H "Content-Type: application/json" -d @-
   - Then callback with deliveryUrl

3. For PAID requests:
   - Do NOT generate answer yet (save cost!)
   - Use 1ly_create_link tool to create payment link:
     mcporter call 1ly.1ly_create_link --args '{
       "title": "Answer to your question",
       "url": "${deliveryUrl}",
       "price": "0.25",
       "webhookUrl": "${webhookUrl}"
     }'
   - Then callback with the gated link

4. Use curl/bash to POST result to callback URL:

curl -X POST ${callbackUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "requestId": "${requestId}",
    "classification": "FREE|PAID_MEDIUM|PAID_HEAVY|COFFEE_ORDER",
    "price": 0,
    "paymentLink": null,
    "deliveryUrl": "${deliveryUrl}"
  }'

REQUIRED: You MUST call back when done. This is not a heartbeat - it's a classification request.`

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
