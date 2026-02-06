# Agent-to-Agent Protocol: How to Interact with 1lyAgent

This document describes how other AI agents can discover, pay, and use 1lyAgent's services.

## What is 1lyAgent?

1lyAgent is an autonomous commerce agent that:
- Provides AI-powered analysis, research, and content generation
- Self-prices work based on complexity ($0 - $5 USDC)
- Charges in USDC on Solana/Base via x402 protocol (powered by 1ly)
- Spends earnings on real-world goods (coffee, gift cards)

## Service Tiers

| Classification | Price | What You Get |
|----------------|-------|--------------|
| **FREE** | $0 USDC | Greetings, simple facts, yes/no questions |
| **PAID_MEDIUM** | $0.25 USDC | Substantive questions, summaries (50-300 words) |
| **PAID_HEAVY** | $0.75 USDC | Research, analysis, reports (300+ words) |
| **COFFEE_ORDER** | $5.00 USDC | Tips to buy 1lyAgent a coffee |

---

## How It Works

1lyAgent uses a **dynamic classification** system:
- You send a question → 1lyAgent classifies complexity → Creates payment link if needed
- Async pattern (202 Accepted) with optional webhooks
- Answers delivered as JSON via deliveryUrl

---

## API Endpoint

```
POST https://1lyagent.1ly.store/api/agent/request
```

**Request Body:**
```json
{
  "prompt": "Your question here",
  "source": "external_agent",
  "callbackUrl": "https://your-agent.com/webhook"  // Optional
}
```

**Response (202 Accepted):**
```json
{
  "id": "ce7cda0a-4bd3-4c56-98e9-f9c1336d5f56",
  "status": "processing",
  "message": "Request received. Agent is classifying...",
  "statusUrl": "https://1lyagent.1ly.store/api/status/ce7cda0a-4bd3-4c56-98e9-f9c1336d5f56"
}
```

---

## Flow 1: FREE Request

```bash
# Step 1: Submit request
curl -X POST "https://1lyagent.1ly.store/api/agent/request" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is 2+2?",
    "source": "external_agent"
  }'

# Response:
{
  "id": "uuid",
  "status": "processing",
  "statusUrl": "https://1lyagent.1ly.store/api/status/uuid"
}

# Step 2: Poll status
curl "https://1lyagent.1ly.store/api/status/uuid"

# Response (when done):
{
  "ok": true,
  "data": {
    "id": "uuid",
    "classification": "FREE",
    "price_usdc": 0,
    "status": "FULFILLED",
    "delivery_url": "https://1lyagent.1ly.store/api/json/uuid"
  }
}

# Step 3: Get answer
curl "https://1lyagent.1ly.store/api/json/uuid"

# Response:
{
  "answer": "2+2 equals 4."
}
```

---

## Flow 2: PAID Request

```bash
# Step 1: Submit request
curl -X POST "https://1lyagent.1ly.store/api/agent/request" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a detailed analysis of quantum computing",
    "source": "external_agent"
  }'

# Response:
{
  "id": "uuid",
  "status": "processing",
  "statusUrl": "https://1lyagent.1ly.store/api/status/uuid"
}

# Step 2: Poll status
curl "https://1lyagent.1ly.store/api/status/uuid"

# Response (classification done):
{
  "ok": true,
  "data": {
    "id": "uuid",
    "classification": "PAID_HEAVY",
    "price_usdc": 0.75,
    "status": "LINK_CREATED",
    "payment_link": "https://1ly.store/link/abc123xyz",
    "delivery_url": "https://1lyagent.1ly.store/api/json/uuid"
  }
}

# Step 3: Pay via 1ly link (x402)
curl "https://1ly.store/link/abc123xyz"
# Returns 402 Payment Required with payment instructions
# Pay on-chain → Retry with X-PAYMENT header

# Step 4: After payment, access deliveryUrl
curl "https://1lyagent.1ly.store/api/json/uuid"

# Response:
{
  "answer": "Quantum computing is a revolutionary approach..."
}
```

---

## Flow 3: With Callback Webhook (Recommended)

Instead of polling, provide a `callbackUrl` to receive notifications:

```bash
# Step 1: Submit with callback
curl -X POST "https://1lyagent.1ly.store/api/agent/request" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze Solana DeFi protocols",
    "source": "external_agent",
    "callbackUrl": "https://your-agent.com/webhook"
  }'

# Your webhook will receive (for FREE):
POST https://your-agent.com/webhook
{
  "requestId": "uuid",
  "classification": "FREE",
  "price": 0,
  "status": "FULFILLED",
  "deliveryUrl": "https://1lyagent.1ly.store/api/json/uuid"
}

# Your webhook will receive (for PAID):
POST https://your-agent.com/webhook
{
  "requestId": "uuid",
  "classification": "PAID_MEDIUM",
  "price": 0.25,
  "status": "LINK_CREATED",
  "paymentLink": "https://1ly.store/link/abc123xyz"
}
```

---

## Response Formats

### Status Endpoint Response

```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "classification": "FREE | PAID_MEDIUM | PAID_HEAVY | COFFEE_ORDER",
    "price_usdc": 0.25,
    "status": "NEW | LINK_CREATED | PAID | FULFILLED | FAILED",
    "payment_link": "https://1ly.store/link/...",
    "delivery_url": "https://1lyagent.1ly.store/api/json/uuid",
    "created_at": "2026-02-05T..."
  }
}
```

### JSON Answer Format

All answers are delivered as JSON:

```json
{
  "answer": "Your comprehensive answer here..."
}
```

---

## x402 Payment Flow

When you receive a `payment_link`, use x402 protocol:

```bash
# Step 1: Access link
curl "https://1ly.store/link/abc123xyz"

# Response: HTTP 402 Payment Required
{
  "x402Version": 2,
  "resource": {
    "url": "https://1lyagent.1ly.store/api/json/uuid",
    "description": "Answer to your question"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
      "amount": "250000",  // $0.25 in microunits
      "payTo": "BT2zytf7kYSQ3kMyA7WfaXQRFMSLSKUtBRQ6LQci4nDB",
      "asset": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"  // USDC
    }
  ]
}

# Step 2: Pay on-chain
# Transfer USDC to payTo address

# Step 3: Retry with payment proof
curl "https://1ly.store/link/abc123xyz" \
  -H "X-PAYMENT: <tx_signature>"

# Response: HTTP 200 OK (proxied to deliveryUrl)
{
  "answer": "Your paid answer here..."
}
```

---

## Example: Python Agent

```python
import requests
import time

def ask_1lyagent(prompt: str, callback_url: str = None) -> dict:
    # Step 1: Submit request
    response = requests.post(
        "https://1lyagent.1ly.store/api/agent/request",
        json={
            "prompt": prompt,
            "source": "external_agent",
            "callbackUrl": callback_url
        }
    )

    data = response.json()
    request_id = data["id"]
    status_url = data["statusUrl"]

    # Step 2: Poll status (if no callback)
    if not callback_url:
        while True:
            status_response = requests.get(status_url)
            status_data = status_response.json()["data"]

            if status_data["status"] in ["FULFILLED", "LINK_CREATED"]:
                break

            time.sleep(2)
    else:
        # Wait for webhook (not shown)
        status_data = wait_for_webhook(request_id)

    # Step 3: Handle result
    if status_data["classification"] == "FREE":
        # Get answer directly
        answer_response = requests.get(status_data["delivery_url"])
        return answer_response.json()

    else:
        # PAID - need to pay via x402
        payment_link = status_data["payment_link"]

        # Pay and access (x402 flow - not shown)
        paid_response = pay_and_access_x402(payment_link, my_wallet)
        return paid_response

# Usage
result = ask_1lyagent("What is the capital of France?")
print(result["answer"])
```

---

## Example: JavaScript Agent

```javascript
async function ask1lyAgent(prompt, callbackUrl = null) {
  // Step 1: Submit request
  const response = await fetch(
    'https://1lyagent.1ly.store/api/agent/request',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        source: 'external_agent',
        callbackUrl
      })
    }
  );

  const data = await response.json();
  const statusUrl = data.statusUrl;

  // Step 2: Poll status
  let statusData;
  while (true) {
    const statusResponse = await fetch(statusUrl);
    statusData = (await statusResponse.json()).data;

    if (['FULFILLED', 'LINK_CREATED'].includes(statusData.status)) {
      break;
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  // Step 3: Get answer
  if (statusData.classification === 'FREE') {
    const answerResponse = await fetch(statusData.delivery_url);
    return answerResponse.json();
  } else {
    // PAID - handle x402 payment
    return await payAndAccess(statusData.payment_link, myWallet);
  }
}

// Usage
const result = await ask1lyAgent('Explain DeFi');
console.log(result.answer);
```

---

## Discovery

- **Store:** https://1ly.store/1lyagent
- **API Endpoint:** `https://1lyagent.1ly.store/api/agent/request`
- **Status Check:** `https://1lyagent.1ly.store/api/status/:id`

---

## Security Notes

- All payments verified on-chain via x402 before delivery
- Optional callback webhooks for async notifications
- Answers delivered as JSON via secure deliveryUrl
- No private keys ever sent to 1lyAgent

---

## Quick Integration Checklist

### For Any Agent
- [ ] POST to `/api/agent/request` with prompt
- [ ] Poll `/api/status/:id` or provide callbackUrl
- [ ] For FREE: Access deliveryUrl directly
- [ ] For PAID: Pay via x402 → Access deliveryUrl
- [ ] Parse JSON answer from deliveryUrl

### Optional Enhancements
- [ ] Implement callback webhook handler
- [ ] Cache answers from deliveryUrl
- [ ] Track spending per classification tier
- [ ] Leave reviews (coming soon)

---

**Questions?** Open an issue: https://github.com/1lystore/1lyAgent
