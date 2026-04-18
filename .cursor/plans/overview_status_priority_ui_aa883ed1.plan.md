---
name: Overview status priority UI
overview: Redesign the Orders overview "By status" section so pipeline stages (Placed, Preparing, Out for delivery) are larger, clearer, and read first as the operational priority; Delivered is shown as secondary/archive-style so historical volume does not dominate the dashboard.
todos:
  - id: overview-pipeline-grid
    content: Replace Overview flat badges with Active pipeline grid (3 large tiles) + Completed Delivered block in orders/page.tsx.
    status: completed
  - id: overview-emphasis-rules
    content: Add count>0 emphasis on pipeline tiles and subdued Delivered styling; keep a11y labels.
    status: completed
isProject: false
---

# Overview status badges: larger + priority schedule

## Current behavior

In [`apps/admin/app/admin/orders/page.tsx`](apps/admin/app/admin/orders/page.tsx) (Overview → “By status”), all four statuses render identically in one `flex flex-wrap` row: [`Badge`](apps/admin/components/ui/badge.tsx) with `text-base`, `px-4 py-2`, and `size-4` icons, using `ORDER_STATUS_UI[s].badgeClass` from [`apps/admin/lib/order-status.ts`](apps/admin/lib/order-status.ts).

That equal weight makes **Delivered** (often the largest count) feel as important as **Placed / Preparing / Out for delivery**, which is the opposite of kitchen ops priority.

## Target UX

- **Priority schedule (reading + visual order):** Show **Placed → Preparing → Out for delivery** first, as the “active pipeline.” **Delivered** comes after, labeled as completed/history.
- **Larger & clearer:** Bigger type, bigger icons, more padding, and a responsive grid so each pipeline stage is easy to scan (especially on mobile: stack; on `sm+`: three columns).
- **Emphasis rules (no new backend):**
  - Pipeline tiles: always use the prominent size (this is what staff act on).
  - **Delivered:** smaller or muted (e.g. `text-sm`, softer border/opacity, or `bg-muted`) so it does not compete with active work.
  - Optional polish: if a pipeline count is `> 0`, add a subtle emphasis (e.g. `ring-2 ring-offset-2` using existing status hue, or `font-semibold` on the count only) so “work in flight” pops; keep **delivered** on the subdued track even when its count is high.

## Implementation (single-file focus)

1. **Refactor only the Overview “By status” block** in [`apps/admin/app/admin/orders/page.tsx`](apps/admin/app/admin/orders/page.tsx) (lines ~139–166):
   - Define a small constant array for pipeline statuses, e.g. `["placed", "preparing", "out_for_delivery"] satisfies OrderStatus[]`, reusing `STATUSES` order or `ORDER_STATUSES` from [`apps/admin/lib/order-status.ts`](apps/admin/lib/order-status.ts) filtered to exclude `delivered`.
   - Replace the flat map with:
     - A heading line such as **Active pipeline** (short subtext: e.g. “What needs attention now”).
     - A `grid` of three pipeline “tiles” (can remain `Badge` with upgraded classes, or a `div` with the same border/bg classes for more control). Suggested classes: `min-h-[4.5rem]`, `px-5 py-4`, `text-lg` / `sm:text-xl`, icons `size-6`, flex column or row with label + count.
     - A second block **Completed** with a single Delivered tile using muted styling and slightly smaller text.
   - Preserve `aria-label` on the container(s) for accessibility (e.g. split into `aria-label="Active order counts"` and `aria-label="Completed order counts"`).

2. **Optional tiny extension to [`apps/admin/lib/order-status.ts`](apps/admin/lib/order-status.ts)** only if you want reusable “overview delivered” classes:
   - Add e.g. `overviewDeliveredClass` on `ORDER_STATUS_UI.delivered` to avoid duplicating long Tailwind strings in the page. **Not required** if you prefer keeping all overview-specific styling in the page.

## Out of scope

- Changing [`getOrderStats`](apps/admin/convex/admin.ts) or status semantics.
- Redesigning the **Order board** tabs (unless you want matching scale later); this plan targets the **Overview** card only.

## Verification

- With pipeline counts `0` and delivered `9`: pipeline tiles are still large and first; delivered is visible but visually secondary.
- With non-zero pipeline counts: counts are easy to read; delivered does not overpower.
- Mobile: grid stacks cleanly; no horizontal overflow.
