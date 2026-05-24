"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

/**
 * Stripe refund for cancelled paid orders (PaymentIntent / Checkout). Idempotent via `stripeRefundId`.
 */
export const refundPaidCancelledOrder = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args): Promise<void> => {
    const row = await ctx.runQuery(internal.stripeInternal.orderRowForStripeRefund, {
      orderId: args.orderId,
    });
    if (!row) return;
    if (row.status !== "cancelled") return;
    if (row.paymentStatus !== "paid") return;
    if (!row.stripePaymentIntentId) return;
    if (row.stripeRefundId !== undefined) return;

    try {
      const key = process.env.STRIPE_SECRET_KEY?.trim();
      if (!key) {
        console.error("[stripe refund] STRIPE_SECRET_KEY missing");
        await ctx.runMutation(internal.stripeInternal.recordStripeRefundFailureOnOrder, {
          orderId: args.orderId,
        });
        return;
      }

      const stripe = new Stripe(key, { typescript: true });
      const refund = await stripe.refunds.create({
        payment_intent: row.stripePaymentIntentId,
      });
      await ctx.runMutation(internal.stripeInternal.recordStripeRefundOnOrder, {
        orderId: args.orderId,
        stripeRefundId: refund.id,
      });
    } catch (err) {
      console.error("[stripe refund]", args.orderId, err);
      await ctx.runMutation(internal.stripeInternal.recordStripeRefundFailureOnOrder, {
        orderId: args.orderId,
      });
    }
  },
});
