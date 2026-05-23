"use node";

import Stripe from "stripe";
import { v } from "convex/values";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

export const processStripeCheckoutWebhookRequest = internalAction({
  args: {
    signature: v.string(),
    rawBody: v.string(),
  },
  handler: async (ctx, args) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!webhookSecret?.trim() || !stripeKey?.trim()) {
      throw new Error("Stripe webhook is not configured for this Convex deployment.");
    }

    const stripe = new Stripe(stripeKey.trim(), {
      typescript: true,
    });

    const event = stripe.webhooks.constructEvent(
      args.rawBody,
      args.signature,
      webhookSecret.trim(),
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== "paid") {
          return { ok: true as const };
        }

        if (!session.id) {
          return { ok: true as const };
        }

        const piField = session.payment_intent;
        const paymentIntentId =
          typeof piField === "string"
            ? piField
            : piField && typeof piField === "object" && "id" in piField
              ? (piField as Stripe.PaymentIntent).id
              : undefined;

        await ctx.runMutation(
          internal.stripeInternal.finalizeStripeCheckoutFromWebhook,
          {
            checkoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            ...(typeof session.amount_total === "number"
              ? { paidAmountTotal: session.amount_total }
              : {}),
            clientReferenceId: session.client_reference_id ?? undefined,
            metadataClerkUserId:
              typeof session.metadata?.clerkUserId === "string"
                ? session.metadata.clerkUserId
                : undefined,
            metadataTotalCents:
              typeof session.metadata?.totalCents === "string"
                ? session.metadata.totalCents
                : undefined,
          },
        );

        return { ok: true as const };
      }

      default: {
        return { ok: true as const };
      }
    }
  },
});
