import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"

// Agent calls this when classification is done
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { requestId, classification, paymentLink, price, reasoning, response } = body

    // Validate required fields
    if (!requestId || !classification) {
      return NextResponse.json(
        { error: "Missing required fields: requestId, classification" },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Update request in database
    const { error } = await supabase
      .from("requests")
      .update({
        classification,
        price_usdc: price || 0,
        payment_link: paymentLink || null,
        status: paymentLink ? "LINK_CREATED" : "FULFILLED",
        deliverable: response || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) {
      console.error("Failed to update request:", error)
      return NextResponse.json({ error: "Database update failed" }, { status: 500 })
    }

    console.log(`✅ Request ${requestId} updated: ${classification}${paymentLink ? ` → ${paymentLink}` : ""}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
