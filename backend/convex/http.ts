import { Webhook } from "svix";
import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: { email_address: string }[];
    primary_email_address_id?: string | null;
    public_metadata?: { role?: string };
  };
};

const http = httpRouter();

http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return new Response("Webhook not configured", { status: 500 });
    }

    const svix_id = request.headers.get("svix-id");
    const svix_timestamp = request.headers.get("svix-timestamp");
    const svix_signature = request.headers.get("svix-signature");
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    const rawBody = await request.text();

    try {
      new Webhook(webhookSecret).verify(rawBody, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch {
      return new Response("Invalid signature", { status: 400 });
    }

    const evt = JSON.parse(rawBody) as ClerkWebhookEvent;

    const allowed = new Set(["user.created", "user.updated"]);
    if (!allowed.has(evt.type)) {
      return new Response("ignored", { status: 204 });
    }

    const data = evt.data;
    let email: string | undefined = data.email_addresses?.[0]?.email_address;

    if (data.primary_email_address_id && data.email_addresses) {
      const match = data.email_addresses.find((e) => e.email_address);
      if (match) email = match.email_address;
    }

    const roleRaw = data.public_metadata?.role;
    const role =
      roleRaw === "admin" ? ("admin" as const) : ("customer" as const);

    await ctx.runMutation(internal.users.syncFromClerkWebhook, {
      clerkId: data.id,
      email,
      role,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }),
});

http.route({
  path: "/webhooks/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return new Response("Missing stripe-signature", { status: 400 });
    }

    const rawBody = await request.text();

    try {
      await ctx.runAction(
        internal.stripeWebhook.processStripeCheckoutWebhookRequest,
        {
          signature: sig,
          rawBody,
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stripe webhook failed";
      const lower = message.toLowerCase();
      const status =
        lower.includes("signature") || lower.includes("webhook payload")
          ? 400
          : 500;
      console.error("[stripe webhook http]", message);
      return new Response(message, { status });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }),
});

export default http;
