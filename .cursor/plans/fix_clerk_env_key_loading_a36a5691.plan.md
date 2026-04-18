---
name: Fix Clerk Env Key Loading
overview: Fix Clerk publishable key loading by placing the env file where Expo actually reads it and refreshing Metro so runtime env vars are reloaded.
todos:
  - id: move-env-to-root
    content: Put EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in project-root .env
    status: completed
  - id: restart-metro
    content: Restart Expo with cache clear to reload env variables
    status: completed
  - id: verify-clerk-provider
    content: Confirm ClerkProvider receives a non-empty publishableKey
    status: completed
isProject: false
---

# Fix Clerk Env Key Loading

## Root cause
The app reads `process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in [c:\Users\DaGra\Builds\Pizza-Delivery-Ai\Pinnochios-Pizza\src\app\_layout.tsx](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\Pinnochios-Pizza\src\app\_layout.tsx), but your only env file is [c:\Users\DaGra\Builds\Pizza-Delivery-Ai\Pinnochios-Pizza\src\app\.env](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\Pinnochios-Pizza\src\app\.env).

Expo loads `.env` from the project root, not `src/app`, so the variable is undefined at runtime.

## Plan
- Create/move env file to project root: [c:\Users\DaGra\Builds\Pizza-Delivery-Ai\Pinnochios-Pizza\.env](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\Pinnochios-Pizza\.env).
- Keep the key name exactly `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=...`.
- Remove or ignore `src/app/.env` to avoid confusion.
- Fully restart Metro with cache clear (`npx expo start -c`) so env changes are picked up.
- Re-run app and confirm the startup error no longer appears.

## Verification
- Optional quick check in `_layout.tsx`: temporarily log `!!process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and verify it is `true` after restart.