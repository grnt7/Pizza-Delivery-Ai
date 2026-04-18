---
name: Restructure Repo Layout
overview: Move frontend apps into `apps/` and Convex backend into `backend/convex` with a safe, low-breakage migration sequence.
todos:
  - id: stop-servers
    content: Stop all active dev servers before file moves
    status: pending
  - id: move-folders
    content: Move app folders into apps/ and convex into backend/convex
    status: pending
  - id: fix-imports-scripts
    content: Update import paths and admin backend scripts for new Convex location
    status: pending
  - id: regenerate-and-verify
    content: Run convex dev in new location and verify admin/mobile startup
    status: pending
isProject: false
---

# Restructure Repo Layout

## Target structure
- `apps/admin`
- `apps/Pinnochios-Pizza`
- `backend/convex`

## Migration steps
- Stop all running dev servers (`next dev`, `convex dev`, `expo start`).
- Create `apps/` and `backend/` at repo root.
- Move `admin` to `apps/admin`.
- Move `Pinnochios-Pizza` to `apps/Pinnochios-Pizza`.
- Move Convex folder from `apps/admin/convex` to `backend/convex`.
- Update admin imports that reference `convex/_generated/api`:
  - [c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\app\page.tsx](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\app\page.tsx)
  - [c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\app\server\page.tsx](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\app\server\page.tsx)
  - [c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\app\server\inner.tsx](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\app\server\inner.tsx)
- Update backend scripts in [c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\package.json](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\admin\package.json) so `convex dev` runs against `backend/convex`.
- Run `npx convex dev` from `backend/convex` to regenerate `_generated` files in the new location.
- Verify env file locations still match app runtime expectations:
  - `apps/admin/.env.local`
  - `apps/Pinnochios-Pizza/.env`
- Restart all services from new locations and validate admin + mobile startup.

## Validation checklist
- Admin app runs and can call Convex APIs.
- Convex dev server starts from `backend/convex` without path errors.
- Mobile app still launches and bundles.
- No unresolved imports to old `admin/convex` path.