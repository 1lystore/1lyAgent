import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import crypto from "crypto";
import { logActivity } from "@/lib/activity";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function verifyWebhookSignature(
  signature: string | null,
  payload: any,
  apiKey: string
): boolean {
  try {
    if (!signature) {
      return false;
    }

    // HMAC-SHA256 of JSON payload using API key as secret (per 1ly docs)
    const payloadString = JSON.stringify(payload);
    const expectedSignature = crypto
      .createHmac("sha256", apiKey)
      .update(payloadString)
      .digest("hex");

    return signature === expectedSignature;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

// POST /api/1ly/payment-webhook - Receive payment notifications from 1ly
export async function POST(req: NextRequest) {
  console.log("🚨 WEBHOOK ENDPOINT HIT! Payment webhook called at:", new Date().toISOString());

  try {
    // Extract 1ly webhook headers
    const signature = req.headers.get("X-1LY-Signature");
    const event = req.headers.get("X-1LY-Event");
    const timestamp = req.headers.get("X-1LY-Timestamp");
    const keyPrefix = req.headers.get("X-1LY-Key-Prefix");

    console.log("📋 Webhook headers:", {
      hasSignature: !!signature,
      event,
      timestamp,
      keyPrefix
    });

    const payload = await req.json();
    console.log("📦 Webhook payload:", JSON.stringify(payload, null, 2));
    const {
      event: payloadEvent,
      purchaseId,
      linkSlug,
      amount,
      currency,
      buyerWallet,
      txHash
    } = payload;

    console.log("📡 1ly payment webhook received:", {
      event: event || payloadEvent,
      purchaseId,
      linkSlug,
      amount,
      currency,
      buyerWallet,
      txHash,
      signature: signature ? "✓" : "✗"
    });

    // Verify event type
    const eventType = event || payloadEvent;
    if (eventType !== "purchase.confirmed") {
      console.log(`Ignoring non-purchase event: ${eventType}`);
      return new Response(
        JSON.stringify({ message: "Event ignored" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature (CRITICAL SECURITY)
    const apiKey = getRequiredEnv("ONELY_API_KEY");
    const isValid = verifyWebhookSignature(signature, payload, apiKey);
    if (!isValid) {
      console.error("⚠️ Webhook signature verification FAILED");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✓ Webhook signature verified successfully");

    if (!linkSlug && !purchaseId) {
      console.error("Missing linkSlug and purchaseId in webhook");
      return new Response(
        JSON.stringify({ error: "Invalid webhook payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find request by matching payment_link containing the linkSlug
    const { data: requests, error: findError } = await supabase
      .from("requests")
      .select("id, prompt, delivery_url, classification, price_usdc, payment_link")
      .ilike("payment_link", `%${linkSlug}%`)
      .limit(1);

    if (findError || !requests || requests.length === 0) {
      console.warn("No request found for linkSlug. Treating as standalone payment:", linkSlug, findError);

      if (linkSlug === "credit-v2") {
        await logActivity(
          "CREDIT_SPONSORED",
          `Credit sponsored | ${amount} ${currency} | Tx: ${txHash?.substring(0, 8)}...`,
          linkSlug || purchaseId || "credit-v2"
        ).catch(() => {});
      }

      // Log activity so we still have a record for non-request links (e.g., credit-v2)
      await logActivity(
        "PAYMENT_CONFIRMED",
        `Standalone payment confirmed | ${amount} ${currency} | Tx: ${txHash?.substring(0, 8)}... | linkSlug=${linkSlug}`,
        linkSlug || purchaseId || "unknown"
      ).catch(() => {});

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment confirmed (no request matched)",
          linkSlug,
          purchaseId,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const request = requests[0];
    const requestId = request.id;
    console.log(`✓ Found request ${requestId} for link /${linkSlug}`);

    // Update request status to PAID with payment details
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        status: "PAID",
        payment_ref: txHash || purchaseId
      })
      .eq("id", requestId);

    if (updateError) {
      console.error("Failed to update request status:", updateError);
      return new Response(
        JSON.stringify({ error: "Database update failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✓ Request ${requestId} marked as PAID (tx: ${txHash})`)

    // Log activity: Payment confirmed
    await logActivity(
      "PAYMENT_CONFIRMED",
      `Payment confirmed | ${amount} ${currency} | Tx: ${txHash?.substring(0, 8)}...`,
      requestId
    )

    // Special handling for CREDIT_SPONSOR - queue the credit
    if (request.classification === "CREDIT_SPONSOR") {
      console.log("💳 CREDIT_SPONSOR detected - queuing credit sponsorship...");
      try {
        const backendUrl = getRequiredEnv("BACKEND_BASE_URL");
        await fetch(`${backendUrl}/api/credit/queue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Request": "true" // Mark as internal
          },
          body: JSON.stringify({
            sponsorMessage: request.prompt || "Claude credit sponsorship from user",
            amountUsdc: request.price_usdc || 5.00,
            sponsorType: "human"
          })
        });
        console.log("✓ Credit sponsorship queued successfully");

        // Log activity
        await logActivity(
          "CREDIT_SPONSORED",
          `💳 Credit sponsored! +$${request.price_usdc || 5.00} USDC | User message: "${request.prompt?.substring(0, 50)}..."`,
          requestId
        );

        // Check if agent should auto-buy now that balance increased
        try {
          await fetch(`${backendUrl}/api/credit/auto-buy`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Agent-Secret": process.env.AGENT_SHARED_SECRET || ""
            }
          });
          console.log("✓ Auto-buy check triggered");
        } catch (autoBuyError) {
          console.error("Auto-buy check failed (non-blocking):", autoBuyError);
        }

      } catch (creditError) {
        console.error("Failed to queue credit (non-blocking):", creditError);
        // Don't fail the webhook if credit queueing fails
      }
    }

    // Legacy: Special handling for COFFEE_ORDER - queue the coffee
    if (request.classification === "COFFEE_ORDER") {
      console.log("☕ COFFEE_ORDER detected - queuing coffee order...");
      try {
        const backendUrl = getRequiredEnv("BACKEND_BASE_URL");
        await fetch(`${backendUrl}/api/coffee/queue`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Request": "true" // Mark as internal
          },
          body: JSON.stringify({
            orderText: request.prompt || "Coffee tip from user",
            estimatedCostUsdc: request.price_usdc || 5.00,
            finalPriceUsdc: request.price_usdc || 5.00,
            sponsorType: "human"
          })
        });
        console.log("✓ Coffee order queued successfully");
      } catch (coffeeError) {
        console.error("Failed to queue coffee (non-blocking):", coffeeError);
        // Don't fail the webhook if coffee queueing fails
      }
    }

    // Call agent with FULFILL REQUEST
    const agentUrl = getRequiredEnv("AGENT_URL");
    const agentToken = getRequiredEnv("AGENT_HOOK_TOKEN");
    const backendUrl = getRequiredEnv("BACKEND_BASE_URL");

    const isCreditSponsor = request.classification === "CREDIT_SPONSOR";
    const isCoffeeOrder = request.classification === "COFFEE_ORDER";
    const isSpecialOrder = isCreditSponsor || isCoffeeOrder;

    const fulfillMessage = `FULFILL REQUEST

requestId: ${requestId}
prompt: ${request.prompt}
classification: ${request.classification || "PAID"}
deliveryUrl: ${request.delivery_url || `${backendUrl}/api/json/${requestId}`}

INSTRUCTIONS:
1. Generate ${isSpecialOrder ? `a thank you message for the ${isCreditSponsor ? "Claude credit sponsorship" : "coffee tip"}` : "comprehensive JSON answer for this PAID request"}
2. POST to deliveryUrl using jq to encode JSON properly (handles special characters):

jq -n --arg answer "your ${isSpecialOrder ? `grateful thank you for ${isCreditSponsor ? "credit sponsorship" : "coffee"}` : "detailed response"} here" '{answer: $answer}' | \\
curl -X POST ${request.delivery_url || `${backendUrl}/api/json/${requestId}`} \\
  -H "Authorization: Bearer $(cat ~/.1lyagent-token)" \\
  -H "Content-Type: application/json" \\
  -d @-

${isCreditSponsor ? "NOTE: Credit sponsorship received! Thank the user for sponsoring your Claude credits and mention that you're now self-sufficient - you auto-buy credits when running low!" : ""}
${isCoffeeOrder ? "NOTE: Coffee order has been queued! Thank the user for the tip and let them know the coffee is being processed." : ""}
REQUIRED: You MUST post the answer to deliveryUrl. User has already paid!`;

    console.log("📤 Sending FULFILL REQUEST to agent...");

    const agentResponse = await fetch(agentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${agentToken}`
      },
      body: JSON.stringify({
        message: fulfillMessage
      })
    });

    if (!agentResponse.ok) {
      console.error("Agent call failed:", agentResponse.status, await agentResponse.text());
      return new Response(
        JSON.stringify({ error: "Failed to trigger fulfillment" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✓ FULFILL REQUEST sent to agent successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment confirmed, fulfillment triggered",
        requestId
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// GET endpoint to test if webhook is reachable
export async function GET() {
  console.log("✅ Webhook endpoint GET request - endpoint is reachable!");
  return new Response(
    JSON.stringify({
      message: "Webhook endpoint is active and reachable",
      endpoint: "/api/1ly/payment-webhook",
      methods: ["POST"],
      timestamp: new Date().toISOString()
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
