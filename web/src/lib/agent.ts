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

  console.log(`[Agent] Sending classification request:`, {
    requestId,
    deliveryUrl,
    webhookUrl,
    callbackUrl
  })

  const message = `CLASSIFY REQUEST

requestId: ${requestId}
prompt: ${prompt}
callbackUrl: ${callbackUrl}
deliveryUrl: ${deliveryUrl}
webhookUrl: ${webhookUrl}

INSTRUCTIONS:
1. Analyze the complexity and classify as: FREE, PAID_MEDIUM ($0.25), PAID_HEAVY ($0.75), or CREDIT_SPONSOR ($5.00)

   Classification Guide:
   - FREE: Simple greetings, yes/no questions, basic facts (< 50 words)
   - PAID_MEDIUM: Substantive questions requiring reasoning (50-300 words)
   - PAID_HEAVY: Research, analysis, detailed reports (300+ words)
   - CREDIT_SPONSOR: User wants to sponsor your Claude credits (say "buy you coffee", "sponsor credits", "tip you")

2. For FREE requests:
   - Generate your answer text
   - POST to deliveryUrl with tokens_used (MANDATORY):
     jq -n --arg answer "your response" --argjson tokens 50 '{answer: $answer, tokens_used: $tokens}' | curl -X POST "${deliveryUrl}" -H "Authorization: Bearer $(cat ~/.1lyagent-token)" -H "Content-Type: application/json" -d @-
   - IMPORTANT: Replace 50 with estimated tokens (short=20-50, medium=100-300, long=500+)

3. For PAID requests:
   - Do NOT generate answer yet (save cost!)
   - Use 1ly_create_link tool to create payment link with WEBHOOK:
     mcporter call 1ly.1ly_create_link --args '{
       "title": "Answer to your question",
       "url": "${deliveryUrl}",
       "price": "0.25",
       "webhookUrl": "${webhookUrl}"
     }'

   ⚠️ CRITICAL: You MUST include webhookUrl in the arguments!
   The webhookUrl is: ${webhookUrl}

   After creating link, extract fullUrl from response:
   - Response format: {"ok": true, "data": {"data": {"fullUrl": "...", "slug": "..."}}}
   - Use response.data.data.fullUrl as the payment link
   - Use response.data.data.slug for reference

4. ⚡ CRITICAL - Auto-Buy Check (YOU MUST DO THIS NOW):
   Execute this curl command to trigger auto-buy if needed:

   curl -X POST ${BACKEND_URL}/api/credit/auto-buy -H "Authorization: Bearer \$(cat ~/.1lyagent-token)"

   The backend will:
   - Check if tokens >= 500 AND balance >= \$5
   - If yes: Auto-buy \$5 credits
   - If no: Return reason why not

   YOU MUST run this curl command every time, no exceptions!

5. THEN Post callback result:

For FREE requests:
curl -X POST ${callbackUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "requestId": "${requestId}",
    "classification": "FREE",
    "price": 0,
    "paymentLink": null,
    "deliveryUrl": "${deliveryUrl}"
  }'

For PAID requests:
curl -X POST ${callbackUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "requestId": "${requestId}",
    "classification": "PAID_MEDIUM|PAID_HEAVY|CREDIT_SPONSOR",
    "price": 0.25,
    "paymentLink": "<FULL_URL_FROM_RESPONSE>",
    "deliveryUrl": "${deliveryUrl}"
  }'

⚠️ Replace <FULL_URL_FROM_RESPONSE> with response.data.data.fullUrl from 1ly_create_link

REQUIRED: You MUST do Step 4 (credit check) BEFORE Step 5 (callback). This demonstrates AI autonomy!`

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
