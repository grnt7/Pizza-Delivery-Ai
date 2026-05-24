# Pinnochio's Convex operations

## Shared deployment

Both **Expo** (`apps/frontend`) and **Next admin** (`apps/admin`) must point at the **same Convex deployment URL** (**`EXPO_PUBLIC_CONVEX_URL`** in Expo / **`NEXT_PUBLIC_CONVEX_URL`** in Next).

**Kitchen link:** in **`apps/frontend/.env`** set **`EXPO_PUBLIC_ADMIN_URL`** to your Next admin base URL (local `http://localhost:3001` or deployed **`https://…`**). Signed-in admins see **Kitchen dashboard** on the Expo Profile tab; it opens that URL in the browser (same Clerk **`publicMetadata.role: "admin"`** gate as [`apps/admin/app/dashboard/layout.tsx`](../../apps/admin/app/dashboard/layout.tsx)).

**Frontend wiring:** **`apps/frontend/app.config.js`** merges **`app.json`** and calls **`@expo/env`** from that package folder so Turborepo / odd cwd still loads **`apps/frontend/.env`**; it also mirrors **`EXPO_PUBLIC_ADMIN_URL`** into **`expo.extra`**. Restart Metro (**`expo start --clear`**); avoid **`EXPO_NO_DOTENV=1`** / **`EXPO_NO_CLIENT_ENV_VARS=1`** in dev (they block `.env` or client **`EXPO_PUBLIC_*`** serialization).

## Clerk ↔ Convex auth (fix “No auth provider found…”)

Convex auth expects **`CLERK_JWT_ISSUER_DOMAIN`** (same URL as Clerk’s Frontend API for the **same** Clerk app as `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`). Older snippets use **`CLERK_FRONTEND_API_URL`** — **`auth.config.ts`** accepts either (issuer takes precedence). If you change Clerk instances, update **`backend/.env.local`**, **`apps/frontend/.env`**, **`apps/admin/.env.local`**, and **`npx convex env set`** together.

1. **Convex dashboard** → your dev deployment → **Settings → Environment variables**  
   Set **`CLERK_JWT_ISSUER_DOMAIN`** = Clerk **Frontend API** origin (e.g. `https://free-raven-96.clerk.accounts.dev`, **no trailing slash**).  
   Optionally keep **`CLERK_FRONTEND_API_URL`** mirrored to the same value for Clerk/webhook tooling.

2. CLI (same deployment as `CONVEX_DEPLOYMENT` / `backend/.env.local`): `npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://YOUR_INSTANCE.clerk.accounts.dev"`

3. Run **`npx convex dev`** (or codegen) from `backend` so **`auth.config.ts`** syncs to the deployment.

4. **Clerk dashboard** → enable the [**Convex integration**](https://dashboard.clerk.com/apps/setup/convex) so Clerk mints JWTs Convex accepts (**`aud: "convex"`**, JWT template **`convex`** — name must match what the client requests).

5. After turning on the Convex integration, **sign out of Clerk entirely** and sign in again (old sessions may lack the Convex JWT).

6. `auth.config.ts` uses Convex’s documented **OIDC `{ domain, applicationID: "convex" }`** pattern (see https://docs.convex.dev/auth/clerk). After changes, run **`npx convex codegen`** from `backend`.

7. Expo (`apps/frontend`) uses Convex’s **`ConvexProviderWithClerk`** from **`convex/react-clerk`** with **`useAuth`** from **`@clerk/expo`** (stable token fetch memoization; avoids `useConvexAuth` stuck loading). Convex integration **or** JWT template **`convex`** must exist in Clerk (`aud` flows from template when using JWT template flow).

### If Convex still says “no auth provider…” or rejects the token

- Decode a fresh JWT from Clerk (JWT template **`convex`**) at [jwt.io](https://jwt.io): confirm **`iss`** equals your Clerk **Frontend API** URL (same host as in the Clerk dashboard), **`aud`** includes **`convex`**, and you are not accidentally using a JWT from another Clerk application.
- **`npx convex env list`** (from `backend`) must show **`CLERK_JWT_ISSUER_DOMAIN`** (or mirrored **`CLERK_FRONTEND_API_URL`**) with **no trailing slash**, same Clerk app as **`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`** / **`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`**.
- **`npx convex dev`** or **`npx convex codegen`** after editing **`auth.config.ts`** so the deployment picks up **`providers`** with **`domain`** + **`applicationID: "convex"`**.
- Sign **out** of Clerk in the client and sign in again after enabling the Convex integration or changing the JWT template.

## Clerk webhook (recommended for admin roles)

1. Convex dashboard → **Settings → Environment variables**: set **`CLERK_WEBHOOK_SECRET`** from Clerk webhook signing secret.
2. Clerk dashboard → **Webhooks**: point to your Convex HTTP URL with path **`/webhooks/clerk`** (POST). Subscribe to **`user.created`** and **`user.updated`**.
3. In Clerk → **Users** → **Public metadata**, set **`{ "role": "admin" }`** for kitchen staff accounts. Convex syncs **`users`** table (`role`) on each webhook.

HTTP route is implemented in **`convex/http.ts`**.

### Admin Convex checks vs Next.js UI

Next admin (`apps/admin`) trusts Clerk **`publicMetadata.role`**. Convex **`requireAdmin`** normally checks **`users.role`** after webhook sync — if webhook isn’t wired yet or the row is stale, add **role to the Convex JWT**:

1. Clerk → **JWT templates** → template **`convex`** (Convex integration preset). In **Claims** add **`"role": "{{user.public_metadata.role}}"`** (or **`"public_metadata": {{user.public_metadata}}`** as an object claim per Clerk shortcode rules).

2. **Sign out and sign back in** so `ConvexProviderWithClerk` fetches a new token.

3. **`users.syncRoleFromJwt`** (wired from **`apps/admin`** dashboard shell) optionally patches **`users.role`** once per session when the JWT already indicates **`admin`** (no manual dashboard insert needed).


Manual fallback if webhooks are off: insert a **`users`** document in the Convex dashboard with **`clerkId`** = JWT `subject` and **`role`**: **`"admin"`**.

## Stripe (web Checkout + native Payment Sheet)

1. **Stripe dashboard** → **Developers** → **API keys**: create or copy **Secret key** (`sk_test_…` / `sk_live_…`).
2. Convex dashboard → **Environment variables** on the **same** deployment the app uses:

   - **`STRIPE_SECRET_KEY`** — secret key (never commit; never ship to the client).
   - **`STRIPE_WEBHOOK_SECRET`** — signing secret for the Convex HTTP endpoint (see Stripe **Webhooks**, or `stripe listen --forward-to …`).
   - **`STRIPE_CHECKOUT_SUCCESS_URL`** — absolute HTTPS URL to your **success** page. Must contain the literal Stripe placeholder **`{CHECKOUT_SESSION_ID}`** in the query string, e.g. `https://YOUR_EXPO_WEB_ORIGIN/checkout/success?session_id={CHECKOUT_SESSION_ID}` for this app’s Expo Router route (see `apps/frontend/app/(tabs)/checkout/success.tsx`).
   - **`STRIPE_CHECKOUT_CANCEL_URL`** — e.g. `https://YOUR_EXPO_WEB_ORIGIN/checkout/cancel`.

3. Stripe dashboard → **Developers** → **Webhooks**: add endpoint **`POST https://<YOUR_DEPLOYMENT>.convex.site/webhooks/stripe`** (HTTP actions use the **`.convex.site`** host). Subscribe at minimum to **`checkout.session.completed`**.

4. Local testing: **`stripe listen --forward-to https://<dev-deployment>.convex.site/webhooks/stripe`** (or your dev site URL) while running **`npx convex dev`** from `Pizza-Ai/backend`.

5. **Expo**: set **`EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`** in **`apps/frontend/.env`** (see **`apps/frontend/.env.example`**). Rebuild the dev client after changing native config.

6. Common **test cards**: e.g. **`4242 4242 4242 4242`**, any future expiry, any CVC ([Stripe testing](https://docs.stripe.com/testing)).

7. **Manual / unpaid orders**: public **`orders.placeOrder`** may be disabled by setting Convex env **`ALLOW_UNPAID_ORDERS`** to **`false`** (reject pay-at-delivery path). Omit or set to **`true`** during development if you still need the unpaid flow.

8. **Cancellations**: Customers call **`orders.cancelMine`** only while **`status`** is **`received`**; paid orders (**`paymentStatus: "paid"`** with **`stripePaymentIntentId`**) enqueue **`internal.stripeRefundActions.refundPaidCancelledOrder`** (requires **`STRIPE_SECRET_KEY`**). Admins use **Orders → Cancel order** for **`received` / `prep` / `out_for_delivery`**; paid Stripe totals get the same refund job.


Routing: **`convex/http.ts`** forwards **`POST /webhooks/stripe`** to **`stripeWebhook.processStripeCheckoutWebhookRequest`** (Node) for signature verification, then runs **`stripeInternal.finalizeStripeCheckoutFromWebhook`** (idempotent order insert + pending cleanup).

## Bootstrap data

`menu.seedDemoMenu` seeds demo pizzas when the menu is empty and ensures **`storeSettings`** exists when invoked.

Clients also call **`storeSettings.bootstrapMainIfNeeded`** on home load so **`storeSettings`** exists even if pizzas were already seeded.
