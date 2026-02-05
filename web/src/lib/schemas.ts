import { z } from "zod";

export const requestSchema = z.object({
  prompt: z.string().min(3).max(5000),
  source: z.enum(["human_ui", "external_agent"]).default("human_ui"),
  callbackUrl: z.string().url().optional()
});

export const requestDecisionSchema = z.object({
  classification: z.enum(["FREE", "PAID_MEDIUM", "PAID_HEAVY", "COFFEE_ORDER"]),
  priceUsdc: z.number().nonnegative(),
  status: z.enum(["LINK_CREATED", "PAID", "FULFILLED", "FAILED"]),
  paymentLink: z.string().url().optional()
});

export const fulfillSchema = z.object({
  deliverable: z.string().min(1).max(20000),
  paymentRef: z.string().min(1).max(300).optional(),
  classification: z.enum(["FREE", "PAID_MEDIUM", "PAID_HEAVY", "COFFEE_ORDER"]).optional()
});

export const coffeeQuoteSchema = z.object({
  orderText: z.string().min(3).max(2000),
  estimatedCostUsdc: z.number().positive(),
  finalPriceUsdc: z.number().positive()
});

export const coffeeQueueSchema = z.object({
  orderText: z.string().min(3).max(2000),
  estimatedCostUsdc: z.number().positive(),
  finalPriceUsdc: z.number().positive(),
  sponsorType: z.enum(["human", "agent"]).default("human")
});

export const coffeeExecuteSchema = z.object({
  force: z.boolean().default(false),
  coffeeOrderId: z.string().uuid().optional()
});

export const coffeeCallbackSchema = z.object({
  coffeeOrderId: z.string().uuid(),
  status: z.enum(["FUNDING_ACQUIRED", "ORDER_PLACED", "DELIVERED", "FAILED"]),
  bitrefillOrderId: z.string().max(120).optional(),
  swiggyOrderId: z.string().max(120).optional(),
  providerStatus: z.string().max(120).optional(),
  giftLast4: z.string().max(8).optional()
});

export const coffeeTrackSchema = z.object({
  coffeeOrderId: z.string().uuid(),
  delivered: z.boolean(),
  providerStatus: z.string().max(120).optional()
});
