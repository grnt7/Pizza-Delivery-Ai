import { AuthConfig } from "convex/server";

/**
 * Clerk via OIDC discovery ({domain} + applicationID). Convex fetches
 * `/.well-known/openid-configuration` and validates JWTs (no fixed RS256/ES256 pin).
 *
 * Env (Convex dashboard + `backend/.env.local`): `CLERK_JWT_ISSUER_DOMAIN`
 * (recommended) or `CLERK_FRONTEND_API_URL` — same value as Clerk Frontend API URL.
 *
 * @see https://docs.convex.dev/auth/clerk
 * Clerk Convex integration + JWT template named `convex` (audience `convex`).
 */
const domainRaw =
  process.env.CLERK_JWT_ISSUER_DOMAIN ?? process.env.CLERK_FRONTEND_API_URL;

if (!domainRaw?.trim()) {
  throw new Error(
    'Set CLERK_JWT_ISSUER_DOMAIN or CLERK_FRONTEND_API_URL to your Clerk Frontend API URL on this Convex deployment and in backend/.env.local (e.g. "https://fine-bluejay-73.clerk.accounts.dev").',
  );
}

const domain = domainRaw.trim().replace(/\/$/, "");

export default {
  providers: [
    {
      domain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
