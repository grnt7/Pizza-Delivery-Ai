---
name: Admin order status colors
overview: "Add distinct, accessible status styling to the admin Orders page: semantic background/text colors per pipeline stage, consistent use across overview badges and order cards, optional tab/column hints, and ARIA labels so status is clear without relying on color alone."
todos:
  - id: status-tokens
    content: Add STATUS → Tailwind class map (light/dark) + reuse LABEL in orders/page.tsx or lib/order-status.ts
    status: completed
  - id: apply-badges
    content: Wire OrderCard badge + Overview by-status badges + optional Card border-l accent
    status: completed
  - id: tabs-optional
    content: "Optional: TabsTrigger colored dot/accent using same tokens"
    status: completed
  - id: a11y
    content: Add aria-label (or labelledby) on order cards; ensure text + color redundancy
    status: completed
isProject: false
---

# Admin orders: status color and accessibility

## Current behavior

- [`apps/admin/app/admin/orders/page.tsx`](apps/admin/app/admin/orders/page.tsx): Every order uses `<Badge variant="secondary">` for status (same gray for Placed through Delivered). Overview “By status” counts use `variant="outline"` (also uniform). Tabs and column headers are text-only with no stage color.

## Approach

**1. Central status tokens (same file or small helper)**

- Add a `Record<Status, { badgeClass: string; label: string; dotClass?: string }>` (or split `badgeClass` + `tabIndicatorClass`) mapping the four Convex statuses to Tailwind classes that work in **light and dark** (e.g. `bg-*` / `text-*` / `border-*` with `dark:` variants).
- Suggested semantic mapping (adjust to taste, keep contrast ≥ ~4.5:1 for text on background):
  - **Placed** — cool / “new” (e.g. blue family)
  - **Preparing** — warm / “in progress” (e.g. amber)
  - **Out for delivery** — distinct mid-pipeline (e.g. violet or sky)
  - **Delivered** — success (e.g. green)

**2. Where to apply**

| UI | Change |
|----|--------|
| Overview “By status” badges | Replace generic `outline` with per-status `badgeClass` (same as cards) so counts read as a mini legend. |
| `OrderCard` status `Badge` | Use `className={cn(badgeVariants({ variant: "outline" }), STATUS_BADGE[status])}` or **default** Badge + `STATUS_BADGE[status]` overrides so borders/backgrounds differ. |
| Optional: order `Card` | Add subtle `border-l-4` + matching border color from the same map when viewing mixed lists (e.g. “All” tab) so cards scan faster. |
| `TabsList` / `TabsTrigger` | Optional: small colored dot or left accent next to each status tab label using the same token map (keeps tab bar aligned with card colors). |

**3. Accessibility (not color-only)**

- On each **order card** root or header row: `aria-label={`Order ${shortId}, ${LABEL[status]}`}` (or `aria-labelledby` pointing to title + badge).
- Keep **visible text** on every badge (`Placed`, etc.) so meaning does not depend on hue.
- Optional: add a **title** attribute on the badge mirroring full status for tooltips, or a visually hidden `<span className="sr-only">Status: …</span>` if the visible label is abbreviated.

**4. Files**

- **Primary:** [`apps/admin/app/admin/orders/page.tsx`](apps/admin/app/admin/orders/page.tsx) — status map, wire badges/cards/tabs, ARIA.
- **Optional:** [`apps/admin/lib/order-status.ts`](apps/admin/lib/order-status.ts) (new) — export `STATUS_UI` if you want pizzas/ingredients pages to reuse later; otherwise keep the map colocated in the page to avoid scope creep.

**5. Out of scope**

- No Convex/schema changes.
- No changes to customer app unless you explicitly want parity later.

## Verification

- Manually check Orders page in **light and dark** theme (if the admin app supports both).
- Quick contrast check on each badge (browser devtools or a11y extension).
- Keyboard: tab to order cards and confirm `aria-label` is announced sensibly with screen reader (optional).
