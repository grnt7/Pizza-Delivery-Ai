---
name: Expo skills and native UI
overview: Install the official `expo/skills` bundle via the Skills CLI (using `bunx` as you prefer), verify where skills land in the monorepo, then apply **building-native-ui** guidance in focused passes on Pinnochios screens (navigation chrome, scroll/safe-area, modern shadows, haptics, typography) without a full route restructure unless you want that later.
todos:
  - id: install-expo-skills
    content: Run `bunx skills add expo/skills` (or `npx`) from repo root or Pinnochios app; confirm install path with CLI output
    status: completed
  - id: read-building-native-ui
    content: Open installed `building-native-ui` SKILL.md + references needed for tabs/scroll/shadows/haptics
    status: completed
  - id: ui-pass-tabs-home
    content: Polish `app-tabs.tsx` and `index.tsx` (insets, boxShadow, gap, haptics, typography)
    status: completed
  - id: ui-pass-cart-profile-modals
    content: Polish `explore.tsx`, `profile.tsx`, order/customize modals for consistency
    status: completed
  - id: verify-pinnochios
    content: Run Pinnochios lint/typecheck script and quick Expo Go smoke test
    status: completed
isProject: false
---

# Add Expo skills and apply building-native-ui

## 1. Install the Expo skills bundle

**Correct command** (your `bunx skill s add` is almost certainly a typo): use the [Skills CLI](https://skills.sh/) pattern from [find-skills](c:\Users\DaGra\.agents\skills\find-skills\SKILL.md):

```bash
bunx skills add expo/skills
```

If Bun resolution is flaky, the same works with:

```bash
npx skills add expo/skills
```

**Where to run it:** Prefer the monorepo root [`c:\Users\DaGra\Builds\Pizza-Delivery-Ai`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai) so agent tooling can see one skills tree; if the CLI supports per-package install, [`apps/Pinnochios-Pizza`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza) is the alternative. After install, note the actual output path (often a `.skills` directory or similar per CLI version) and optionally run `bunx skills check` / `bunx skills update` later.

**What you get:** The `expo/skills` repo publishes multiple skills in one bundle; the one you care about for visuals is **`building-native-ui`** (Expo Router, NativeTabs, stacks, styling, animations, references under `references/`).

No `skills.json` exists in the repo today; the install step creates or extends whatever the current CLI expects.

## 2. How we will use `building-native-ui` (ground rules)

From the published [building-native-ui SKILL.md](https://raw.githubusercontent.com/expo/skills/main/plugins/expo/skills/building-native-ui/SKILL.md), the highest-impact ideas for **your current architecture** are:

| Area | Guidance | Fit for Pinnochios |
|------|----------|-------------------|
| Tabs | `NativeTabs` + labels/icons; optional `role="search"` etc. | You already use [`app-tabs.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\components\app-tabs.tsx) with `expo-router/unstable-native-tabs` — align styling with theme and skill patterns. |
| Stacks / titles | Prefer **stack-defined titles** and large titles over ad-hoc page titles | Today [`_layout.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\app\_layout.tsx) wraps Clerk + `AppTabs` only; tab screens are flat routes. **Incremental:** add titles via `Stack` only if we introduce a per-tab stack layout; otherwise improve in-screen hierarchy (section headers) without a big router migration. |
| Scroll / safe area | `ScrollView`/`FlatList` as first child where appropriate; `contentInsetAdjustmentBehavior="automatic"`; account for top/bottom insets | Apply to [`index.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\app\index.tsx), [`explore.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\app\explore.tsx), [`profile.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\app\profile.tsx), and modals. |
| Shadows | Prefer **`boxShadow`** style prop; avoid legacy shadow/elevation | Replace legacy shadows on cards/rows where present. |
| Delight | **expo-haptics** on iOS for primary actions (add to cart, submit order) | Small, conditional `Platform.OS === 'ios'` or `process.env.EXPO_OS === 'ios'` per skill. |
| Typography | `selectable` on important text; `fontVariant: 'tabular-nums'` for prices/order IDs | Low-risk polish. |

**Out of scope for the first pass (optional follow-up):** Full route restructure to match the skill’s “`(index,search)/_layout.tsx` + shared group” pattern — that would touch many files; we can defer unless you want native large titles on every tab.

## 3. Concrete UI enhancement passes (after skills are on disk)

Work only under [`apps/Pinnochios-Pizza`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza), reusing [`constants/theme.ts`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\constants\theme.ts) and existing components.

1. **Tab bar polish** — [`src/components/app-tabs.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\components\app-tabs.tsx): refine `backgroundColor` / `indicatorColor` / `labelStyle` for light/dark; keep VectorIcon pattern unless you standardize on SF Symbols via `expo-image` (skill preference) — that would be a larger icon swap.
2. **Home / menu screen** — [`src/app/index.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\app\index.tsx): scroll container insets, card `boxShadow`, spacing with flex `gap` where it simplifies layout, haptics on “add” actions.
3. **Cart (`explore`)** — [`src/app/explore.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\app\explore.tsx): same treatment for list areas and totals (tabular nums for currency).
4. **Orders / profile** — [`src/app/profile.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\app\profile.tsx) + [`src/components/order-detail-modal.tsx`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\src\components\order-detail-modal.tsx): readable hierarchy, selectable order numbers, consistent shadows and padding.
5. **Customize / other modals** — e.g. customize sheet component(s): match corner radius (`borderCurve: 'continuous'` on supporting versions), avoid clipping with `contentContainerStyle` padding pattern from the skill.

After edits: run the app’s usual typecheck/lint for the Pinnochios package (e.g. `bun run` / package scripts from [`apps/Pinnochios-Pizza/package.json`](c:\Users\DaGra\Builds\Pizza-Delivery-Ai\apps\Pinnochios-Pizza\package.json)).

## 4. Optional: make agents pick up the skill automatically

If you use Cursor rules: add a short rule pointing agents to the installed `building-native-ui` path (exact path depends on CLI output). This is optional and only if you want consistent reminders beyond the default skills discovery.
