---
name: Monorepo dev reference
overview: A single reference for installing dependencies, running admin + Expo together or separately, Convex alignment, and common fixes (Turborepo, Next/Turbopack, npm workspaces, TypeScript/IDE).
todos:
  - id: ref-install
    content: Use root `npm install`; clean all `node_modules` if ENOTEMPTY; rely on `.npmrc` for peer deps
    status: pending
  - id: ref-dev
    content: "Default: `npm run dev` at repo root; single-app: turbo `--filter` or `cd apps/<app>`"
    status: pending
  - id: ref-convex-env
    content: Align Convex URL + Clerk; seed catalog or admin when menu is empty
    status: pending
  - id: ref-troubleshoot
    content: "Admin Next: `next.config` turbopack root; Expo: Metro + `expo start -c`; TS: admin tsconfig + workspace TS SDK"
    status: pending
isProject: false
---

# Monorepo development reference (Pizza-Delivery-Ai)

Use this as the operational checklist for the repo at [`Pizza-Delivery-Ai`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai): root workspace with [`apps/admin`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin) (Next + Convex) and [`apps/Pinnochios-Pizza`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza) (Expo).

## 1. Install dependencies

- From **repo root**: `npm install` (not from `apps/` alone; there is no `apps/package.json`).
- Workspace config: root [`package.json`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\package.json) (`workspaces: ["apps/*"]`), [`turbo.json`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\turbo.json), [`packageManager`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\package.json) for Turborepo.
- Peer-resolution noise on Windows: root [`.npmrc`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\.npmrc) uses `legacy-peer-deps=true` for mixed Next + Expo trees.
- If install fails with **ENOTEMPTY** on `node_modules`: stop all Node processes (Expo, Next, Turbo), delete `node_modules` at **root**, **`apps/admin`**, and **`apps/Pinnochios-Pizza`**, then run `npm install` again from the root.

## 2. Run dev servers (default)

**One command — both apps:**

```bash
cd <repo-root>
npm run dev
```

This runs `turbo run dev`, which starts:

- **admin**: [`npm run dev`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\package.json) → `npm-run-all --parallel dev:frontend dev:backend` (Next + Convex). `predev` runs Convex until ready and may open the dashboard.
- **Pinnochios-Pizza**: `expo start`.

You do **not** need a second Expo command when using root `npm run dev`.

## 3. Run one app only

- **Admin only:** `cd apps/admin && npm run dev`, or from root: `npx turbo run dev --filter=admin`.
- **Expo only:** `cd apps/Pinnochios-Pizza && npx expo start`, or `npx turbo run dev --filter=pinnochios-pizza`.

## 4. Next.js + npm workspaces (admin)

Hoisted `next` lives under **repo root** `node_modules`. Turbopack must resolve from the monorepo root: see [`apps/admin/next.config.ts`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\next.config.ts) (`turbopack.root` → monorepo root). If `next dev` / `next build` errors about not finding `next/package.json` from `apps/admin/app`, this config is the intended fix.

## 5. Convex + mobile alignment

- Run **`npx convex dev`** from **`apps/admin`** (or rely on admin’s `dev:backend`) so [`convex/_generated`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\convex\_generated) stays in sync.
- **Same deployment URL** on admin ([`NEXT_PUBLIC_CONVEX_URL`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin)) and Expo ([`EXPO_PUBLIC_CONVEX_URL`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\components\ConvexClientProvider.tsx) / `.env`).
- **Menu data:** run the dev seed from `apps/admin` when needed: `npx convex run seed:seedDevCatalogInternal` (see [`convex/seed.ts`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\convex\seed.ts)), or create pizzas in admin with **available** checked.

## 6. Expo Metro (Pinnochios-Pizza)

- [`metro.config.js`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\metro.config.js): maps `@pizza/convex` to generated Convex API, `watchFolders` for `_generated`, `extraNodeModules.convex` so `convex/server` resolves from the hoisted package.
- After changing `.env` in the Expo app: `npx expo start -c`.

## 7. TypeScript / IDE (admin)

- [`apps/admin/tsconfig.json`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\tsconfig.json): `types` + `typeRoots` so DOM JSX resolves with hoisted `@types` (avoids React Native–style JSX in the Next app).
- Root [`.vscode/settings.json`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\.vscode\settings.json): `typescript.tsdk` → workspace TypeScript; accept **Use Workspace Version** if prompted.
- [`AppLink`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\components\app-link.tsx) wraps `next/link` for React 19 + Radix `Button asChild` on the home page.

## 8. Other useful commands

- Lint all workspace packages: `npm run lint` (root).
- Build: `npm run build` (runs `turbo run build` — admin `next build`, Expo web export per [`apps/Pinnochios-Pizza/package.json`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\package.json)).

## 9. Optional: operational QA

- Broader deploy/auth/seed/smoke steps: see [`.cursor/plans/mvp_operational_runbook_65f3d889.plan.md`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\.cursor\plans\mvp_operational_runbook_65f3d889.plan.md) if you keep it as the longer runbook.
