---
name: Admin panel responsiveness
overview: "Fix horizontal overflow and cramped layouts by applying flexbox-safe `min-w-0`, responsive spacing/typography in `AdminShell`, and page-level tweaks for orders (long text) and data tables. Optional follow-up: mobile nav pattern (scroll vs sheet) if needed after baseline fixes."
todos:
  - id: shell-minw-padding
    content: "AdminShell: min-w-0 on main, responsive padding/typography, mobile nav overflow"
    status: completed
  - id: orders-responsive
    content: "orders/page.tsx: responsive headings, Section padding, OrderDetailBody line wrap"
    status: completed
  - id: tables-pages
    content: "pizzas + ingredients pages: responsive headers, min-w-0 on table wrapper, optional table min-w"
    status: completed
isProject: false
---

# Admin panel full responsiveness

## Diagnosis

- **[`apps/admin/components/admin/admin-shell.tsx`](apps/admin/components/admin/admin-shell.tsx)** uses `flex min-h-screen flex-col md:flex-row`. The main column is `flex-1 overflow-auto` but **without `min-w-0`**, flex items default to `min-width: auto`, so wide content (tables, long strings) can **force the whole page wider than the viewport** instead of scrolling inside the main area.
- **Fixed `p-8` and global `text-lg`** on the main pane make small screens feel tight; headings like `text-5xl` on list pages amplify overflow risk.
- **Tables** ([`components/ui/table.tsx`](apps/admin/components/ui/table.tsx)) already wrap the `<table>` in `overflow-x-auto`; the fix is ensuring **ancestors** participate in shrinking, plus optional **`min-w-[…]` on the `<table>`** so horizontal scroll has a clear minimum width on phones.
- **Orders detail** ([`OrderDetailBody`](apps/admin/app/admin/orders/page.tsx)) uses `flex justify-between` on line items; long pizza names need **`min-w-0` + `break-words`** on the left column to avoid layout breakage.

## Implementation

### 1. Shell: flex-safe width + responsive padding/typography

**File:** [`apps/admin/components/admin/admin-shell.tsx`](apps/admin/components/admin/admin-shell.tsx)

- On the **root** container: add `min-w-0` if needed (usually the scrolling child matters most).
- On the **aside**: add `min-w-0 shrink-0` (sidebar keeps fixed intent on `md+`; `md:w-64` stays).
- On the **main content** wrapper (`flex-1 overflow-auto …`): add **`min-w-0`** (critical).
- Replace flat `p-8` with **`px-4 py-6 sm:px-6 sm:py-8 md:px-8`** (tune once for comfort).
- Soften global **`text-lg leading-relaxed`** to something like **`text-base leading-relaxed sm:text-lg`** so body copy scales down on narrow viewports.

**Mobile nav:** The top row uses `flex gap-1` for links. If tabs still overflow on very small widths, wrap the `<nav>` with **`overflow-x-auto`** and **`whitespace-nowrap md:whitespace-normal`**, or **`scrollbar-thin`** (if available in Tailwind setup) so users can scroll the nav horizontally without breaking the layout.

### 2. Orders page: typography, sections, line items

**File:** [`apps/admin/app/admin/orders/page.tsx`](apps/admin/app/admin/orders/page.tsx)

- Page `<header>`: `h1` → responsive scale, e.g. **`text-3xl sm:text-4xl md:text-5xl`**; subtitle **`text-lg sm:text-xl`**.
- `Section` wrapper: inner padding **`p-4 sm:p-6`** (replace or complement fixed `p-6`).
- Overview “Total revenue” number: **`text-3xl sm:text-4xl`** if `text-4xl` overflows on tiny screens.
- **`OrderDetailBody`** list rows: wrap the left text in **`min-w-0 break-words`** (and keep **`shrink-0`** on price); optionally stack on **`xs`** with **`flex-col sm:flex-row sm:items-start sm:justify-between`** if labels still collide.

### 3. Pizzas & Ingredients: headings + table wrappers

**Files:** [`apps/admin/app/admin/pizzas/page.tsx`](apps/admin/app/admin/pizzas/page.tsx), [`apps/admin/app/admin/ingredients/page.tsx`](apps/admin/app/admin/ingredients/page.tsx)

- Match **responsive `h1` / subtitle** pattern with orders.
- On the **bordered table wrapper** (`div.rounded-md.border`): add **`min-w-0 max-w-full`** so the flex chain can shrink.
- Pass **`className="min-w-[640px]"`** (or similar) on `<Table>` **only if** you want a consistent horizontal scroll width on mobile (optional but improves UX when many columns).

Dialogs already use `max-w-[calc(100%-2rem)]` in [`dialog.tsx`](apps/admin/components/ui/dialog.tsx); pizzas page overrides with `sm:max-w-lg` — no change required unless you see clipping; then add **`max-h-[90dvh]`** alongside existing `max-h-[90vh]` for mobile browser chrome.

### 4. Verification

- Resize Chrome (or DevTools) from **320px → 768px → 1280px** on `/admin/orders`, `/admin/pizzas`, `/admin/ingredients`.
- Confirm **no horizontal page scroll** except inside the intended **table** scroll region.
- Spot-check **order details** with a long pizza name + long address.

## Out of scope (unless you ask later)

- Replacing tables with **card lists on mobile** (separate layout per breakpoint) — larger UX project.
- **Hamburger + Sheet** sidebar — only if horizontal nav scroll feels insufficient.
