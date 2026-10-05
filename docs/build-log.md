# Build Log

Reverse-chronological.

## 2026-10-05 — Layer 3: ambient palette shift

- Palette tokens refactored to RGB triplets (`--background-rgb` etc. +
  `rgb(var())` aliases) so GSAP can interpolate them numerically.
- lib/palettes.ts: five palettes as triplets. fadeandco is LIGHT
  (cream base); the others are dark. The shift inverts the page.
- setActivePalette(): single entry point. Kills in-flight tween on
  retrigger, no-ops when the target is already active, respects
  prefers-reduced-motion by setting tokens instantly. Unknown keys
  fall back to neutral.
- usePaletteScroll(): one ScrollTrigger per [data-palette] element,
  start top 45% / end bottom 45%, onToggle drives the shift. Bands must
  not overlap (last-toggle-wins); gaps keep the last palette.
  Architecture is trigger-agnostic so Layer 4's horizontal Flip can
  drive the same function.
- Verified body-text contrast AAA in all five palettes (15.5–19.1:1).
  Known: muted #71717a on cream is 4.29:1 (secondary text only;
  static token, unchanged). Cards stay dark slabs in cream by design
  (only the 5 tokens shift) — they read as contrast blocks.
- No project screenshots exist yet, so no border wrappers were needed;
  future screenshot frames should use border-border.
- Review fixes: catch-path supersession guard, hasOwn key check,
  tween-handle nulling, neutral seeding, bottom-of-page neutral
  fallback, rounded token writes.

## 2026-10-05 — Layer 2: hero decode, section reveals, Services, nav

- New Services section (4 cards, 2x2 desktop / stacked mobile).
  Page order now Hero → About → Featured → Products → Services →
  Skills → Contact → Footer.
- Hero decode: h1 splits into per-character motion spans on mount
  (380ms, 22ms stagger, ease [0.22, 1, 0.36, 1]); SSR still ships the
  full string as plain text. Subline + scroll cue fade in at 0.9s.
  Scroll cue arrow loops on a 2s reverse cycle — the only looping
  animation on the page.
- Section reveals: `lib/use-section-reveal.ts` (GSAP + ScrollTrigger,
  `top 80%`, opacity 0→1 / y 16→0, 600ms, 80ms stagger, `power2.out`,
  `once: true`) via a `Reveal` wrapper so sections stay server
  components. Initial hidden state is set in the effect only — content
  is visible with JS disabled.
- Nav: scrolled state past 40px (stronger border, darker backdrop,
  200ms), active-section highlight via IntersectionObserver
  (#work covers Featured + Products), clicks route through
  `scrollToId` (shared Lenis instance, native fallback).
- `prefers-reduced-motion`: plain h1, no reveals, no Lenis, nav clicks
  jump instantly. Verified in-browser.
- Verified: tsc 0, build 0, `/` 200 with full-text SSR h1.

## 2026-10-05 — Layer 1: Scaffold

- Next.js 15 App Router, Tailwind v4, shadcn/ui (Base-UI).
- GSAP + ScrollTrigger + Lenis installed; not yet wired to any section.
- Design tokens: off-black editorial base, Fraunces display, Inter body.
- Neutral palette as the portfolio's own identity — each project
  section will shift the page into that project's palette on scroll.
- Four signature scroll moments planned: hero decode, ambient palette
  shift, horizontal Flip on the products section, and About numbers.
- All sections render static; motion lands in later layers.
