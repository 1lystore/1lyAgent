import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { logActivity } from "@/lib/activity"

// Agent calls this when classification is done
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { requestId, classification, paymentLink, price, reasoning, response, deliveryUrl } = body

    // Validate required fields
    if (!requestId || !classification) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, classification" },
        { status: 400 }
      )
    }

    console.log(`📥 Agent callback: ${requestId} - ${classification}${paymentLink ? ` (payment link created)` : ` (FREE)`}`)

    const supabase = getSupabaseAdmin()

    // Fetch request to get callback_url
    const { data: existingRequest, error: fetchError } = await supabase
      .from("requests")
      .select("callback_url")
      .eq("id", requestId)
      .single()

    if (fetchError) {
      console.error("Failed to fetch request:", fetchError)
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    // Update request in database
    const { error } = await supabase
      .from("requests")
      .update({
        classification,
        price_usdc: price || 0,
        payment_link: paymentLink || null,
        status: paymentLink ? "LINK_CREATED" : "FULFILLED",
        deliverable: response || null,
      })
      .eq("id", requestId)

    if (error) {
      console.error("Failed to update request:", error)
      return NextResponse.json({ error: "Database update failed", details: error }, { status: 500 })
    }

    console.log(`✅ Request ${requestId} updated: ${classification}${paymentLink ? ` → ${paymentLink}` : ""}`)

    // Log activity
    if (paymentLink) {
      await logActivity(
        "LINK_CREATED",
        `${classification} | $${price || 0} USDC | Payment link created`,
        requestId
      )
    } else {
      await logActivity(
        "FULFILLED",
        `${classification} | FREE request completed`,
        requestId
      )
    }

    // Forward to external agent's callback URL if provided
    if (existingRequest.callback_url) {
      try {
        const webhookPayload: any = {
          requestId,
          classification,
          price: price || 0,
          status: paymentLink ? "LINK_CREATED" : "FULFILLED",
        }

        // For FREE requests, include deliveryUrl (contains JSON answer)
        if (!paymentLink && deliveryUrl) {
          webhookPayload.deliveryUrl = deliveryUrl
        }

        // For PAID requests, include paymentLink
        if (paymentLink) {
          webhookPayload.paymentLink = paymentLink
        }

        // Legacy: include deliverable if present
        if (response) {
          webhookPayload.deliverable = response
        }

        await fetch(existingRequest.callback_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        })
        console.log(`📡 Webhook sent to ${existingRequest.callback_url}`)
      } catch (webhookError) {
        console.error("Webhook failed (non-blocking):", webhookError)
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
