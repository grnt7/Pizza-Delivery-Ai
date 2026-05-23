"use node";

import { v } from "convex/values";
import Stripe from "stripe";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";

import { checkoutCartArgsValidator } from "./stripeInternal";

function requireStripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.trim()) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set on this Convex deployment (Dashboard → Env).",
    );
  }
  return key.trim();
}

function stripe(): Stripe {
  return new Stripe(requireStripeSecret(), {
    typescript: true,
  });
}

/**
 * Payment Sheet (native): create Stripe PaymentIntent for the validated cart.
 */
export const createPaymentIntentForCheckout = action({
  args: checkoutCartArgsValidator,
  handler: async (
    ctx,
    args,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Not authenticated");
    }

    const computed = await ctx.runQuery(
      internal.stripeInternal.computeCheckoutSnapshot,
      args,
    );

    const amount = computed.totalCents;
    if (amount < 50) {
      throw new Error("Order total is below Stripe minimum ($0.50)");
    }

    const pi = await stripe().paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      capture_method: "automatic_async",
      metadata: {
        clerkUserId: computed.userId,
        totalCents: String(amount),
      },
      description: "Pinnochio's Pizza mobile order",
    });

    const clientSecret = pi.client_secret;
    if (!clientSecret) {
      throw new Error("Stripe did not return a client secret");
    }

    return { clientSecret, paymentIntentId: pi.id };
  },
});

/**
 * After Payment Sheet success: verify PI on Stripe and insert the order once.
 */
export const finalizeNativePaidOrder = action({
  args: v.object({
    paymentIntentId: v.string(),
    cart: checkoutCartArgsValidator,
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ orderId: string; totalCents: number }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Not authenticated");
    }

    const computed = await ctx.runQuery(
      internal.stripeInternal.computeCheckoutSnapshot,
      args.cart,
    );

    if (computed.userId !== identity.subject) {
      throw new Error("Session mismatch");
    }

    const pi = await stripe().paymentIntents.retrieve(args.paymentIntentId);

    if (pi.metadata.clerkUserId !== identity.subject) {
      throw new Error("Payment belongs to another user");
    }

    if (parseInt(pi.metadata.totalCents ?? "0", 10) !== computed.totalCents) {
      throw new Error("Payment amount mismatch — reopen checkout.");
    }

    const paidUsdCents =
      typeof pi.amount_received === "number" && pi.amount_received > 0
        ? pi.amount_received
        : typeof pi.amount === "number"
          ? pi.amount
          : 0;

    if (
      pi.status !== "succeeded" ||
      paidUsdCents !== computed.totalCents ||
      pi.currency !== "usd"
    ) {
      throw new Error(
        `Payment not completed (${pi.status}). Please try again.`,
      );
    }

    const orderId = await ctx.runMutation(
      internal.stripeInternal.insertValidatedPaidOrder,
      {
        userId: identity.subject,
        snapshot: args.cart,
        stripePaymentIntentId: args.paymentIntentId,
      },
    );

    return { orderId: String(orderId), totalCents: computed.totalCents };
  },
});

export const createCheckoutSessionForWeb = action({
  args: checkoutCartArgsValidator,
  handler: async (ctx, args): Promise<{ url: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Not authenticated");
    }

    const computed = await ctx.runQuery(
      internal.stripeInternal.computeCheckoutSnapshot,
      args,
    );

    const successUrlTpl = process.env.STRIPE_CHECKOUT_SUCCESS_URL;
    const cancelUrlTpl = process.env.STRIPE_CHECKOUT_CANCEL_URL;
    if (!successUrlTpl?.trim() || !cancelUrlTpl?.trim()) {
      throw new Error(
        'Set STRIPE_CHECKOUT_SUCCESS_URL and STRIPE_CHECKOUT_CANCEL_URL on Convex as absolute HTTPS URLs. Success URL must include {CHECKOUT_SESSION_ID} placeholder (Stripe replaces it). Example: https://YOUR_HOST/checkout/success?session_id={CHECKOUT_SESSION_ID}',
      );
    }

    const amount = computed.totalCents;
    if (amount < 50) {
      throw new Error("Order total is below Stripe minimum ($0.50)");
    }

    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      client_reference_id: computed.userId,
      success_url: successUrlTpl.trim(),
      cancel_url: cancelUrlTpl.trim(),
      currency: "usd",
      metadata: {
        clerkUserId: computed.userId,
        totalCents: String(amount),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: `Pinnochio's Pizza · order total`,
              description: "Food + delivery snapshot at checkout time",
            },
          },
        },
      ],
    });

    const url = session.url;
    if (!url || !session.id) {
      throw new Error("Stripe Checkout did not return a session URL");
    }

    await ctx.runMutation(internal.stripeInternal.persistStripePendingCheckout, {
      checkoutSessionId: session.id,
      userId: computed.userId,
      snapshot: args,
    });

    return { url };
  },
});
