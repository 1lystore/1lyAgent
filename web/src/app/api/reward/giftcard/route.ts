import { err, ok } from "@/lib/http";
import { verifyAgentSecret } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * Gift Card Reward API (Reloadly)
 * 
 * Automated self-reward system. Agent purchases gift cards
 * when earnings reach threshold ($50 minimum).
 * 
 * Requires RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET
 */

interface GiftcardRequest {
  amount: number;
  provider: "reloadly";
  productType: "amazon_us" | "amazon_uk" | "steam" | "uber" | string;
  reason?: string;
}

interface ReloadlyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ReloadlyProduct {
  productId: number;
  productName: string;
  countryCode: string;
  denominationType: string;
  fixedRecipientDenominations: number[];
  minRecipientDenomination: number;
  maxRecipientDenomination: number;
}

interface ReloadlyOrderResponse {
  transactionId: number;
  status: string;
  recipientEmail?: string;
  customIdentifier?: string;
  product: {
    productId: number;
    productName: string;
  };
  smsFee: number;
  discountPercentage: number;
  totalFee: number;
}

const MINIMUM_AMOUNT = 50;

const PRODUCT_MAP: Record<string, number> = {
  // These are example product IDs - need to be updated with actual Reloadly product IDs
  amazon_us: 1,    // Amazon US
  amazon_uk: 2,    // Amazon UK
  steam: 3,        // Steam
  uber: 4,         // Uber
};

async function getReloadlyToken(): Promise<string> {
  const clientId = process.env.RELOADLY_CLIENT_ID;
  const clientSecret = process.env.RELOADLY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Reloadly credentials not configured");
  }

  const response = await fetch("https://auth.reloadly.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      audience: "https://giftcards.reloadly.com",
    }),
  });

  if (!response.ok) {
    throw new Error(`Reloadly auth failed: ${response.status}`);
  }

  const data: ReloadlyTokenResponse = await response.json();
  return data.access_token;
}

async function searchProducts(token: string, name: string): Promise<ReloadlyProduct[]> {
  const response = await fetch(
    `https://giftcards.reloadly.com/products?productName=${encodeURIComponent(name)}&size=10`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Product search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.content || [];
}

async function orderGiftCard(
  token: string,
  productId: number,
  amount: number,
  recipientEmail: string
): Promise<ReloadlyOrderResponse> {
  const response = await fetch("https://giftcards.reloadly.com/orders", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      productId,
      quantity: 1,
      unitPrice: amount,
      customIdentifier: `1lyagent-${Date.now()}`,
      recipientEmail,
      senderName: "1lyAgent",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gift card order failed: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function POST(req: Request) {
  try {
    // Verify agent secret
    const authError = verifyAgentSecret(req);
    if (authError) return authError;

    const json: GiftcardRequest = await req.json();
    const { amount, provider, productType, reason } = json;

    // Validate minimum amount
    if (!amount || amount < MINIMUM_AMOUNT) {
      return err(`Minimum amount is $${MINIMUM_AMOUNT} USDC`);
    }

    if (provider !== "reloadly") {
      return err("Only 'reloadly' provider is supported");
    }

    if (!productType) {
      return err("productType required (e.g., amazon_us, steam)");
    }

    const supabase = getSupabaseAdmin();
    const recipientEmail = process.env.OWNER_EMAIL || "owner@1lyagent.com";

    // Get Reloadly token
    const token = await getReloadlyToken();

    // Search for the product
    const searchTerm = productType.replace("_", " ");
    const products = await searchProducts(token, searchTerm);
    
    if (products.length === 0) {
      return err(`No gift card products found for: ${productType}`);
    }

    // Find a product that supports the requested amount
    const product = products.find((p) => {
      if (p.denominationType === "FIXED") {
        return p.fixedRecipientDenominations?.includes(amount);
      }
      return amount >= p.minRecipientDenomination && amount <= p.maxRecipientDenomination;
    });

    if (!product) {
      return err(`No product found supporting $${amount} denomination`);
    }

    // Place the order
    const order = await orderGiftCard(token, product.productId, amount, recipientEmail);

    // Log in database
    await supabase.from("coffee_orders").insert({
      order_text: `Gift Card: ${product.productName} $${amount}`,
      estimated_cost_usdc: amount,
      final_price_usdc: amount,
      sponsor_type: "agent",
      status: "DELIVERED",
      bitrefill_order_id: String(order.transactionId),
    });

    return ok({
      success: true,
      message: `🎁 Gift card purchased: ${product.productName} $${amount}`,
      order: {
        transactionId: order.transactionId,
        product: product.productName,
        amount,
        status: order.status,
        recipientEmail,
      },
      reason: reason || "Self-reward for reaching earnings threshold",
    });

  } catch (e) {
    console.error("Gift card API error:", e);
    return err(e instanceof Error ? e.message : "Gift card purchase failed", 500);
  }
}

// GET endpoint to check available products
export async function GET() {
  try {
    const token = await getReloadlyToken();
    
    // Get popular products
    const amazonProducts = await searchProducts(token, "amazon");
    
    return ok({
      service: "1lyAgent Gift Card Rewards",
      provider: "reloadly",
      minimumAmount: MINIMUM_AMOUNT,
      availableProducts: amazonProducts.slice(0, 5).map((p) => ({
        productId: p.productId,
        name: p.productName,
        country: p.countryCode,
        denominations: p.fixedRecipientDenominations || 
          `${p.minRecipientDenomination}-${p.maxRecipientDenomination}`,
      })),
    });
  } catch (e) {
    return ok({
      service: "1lyAgent Gift Card Rewards",
      provider: "reloadly",
      minimumAmount: MINIMUM_AMOUNT,
      note: "Configure RELOADLY_CLIENT_ID and RELOADLY_CLIENT_SECRET to enable",
      error: e instanceof Error ? e.message : "Not configured",
    });
  }
}
