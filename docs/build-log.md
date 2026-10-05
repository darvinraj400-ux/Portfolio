# Build Log

Reverse-chronological.

## 2026-10-05 — Design: cinematic rain atmosphere

- RainBackground: fixed canvas (z-0) with far/near streak layers,
  wind drift, DPR cap 2, resize realloc, RAF pause on tab-hide,
  adaptive throttle under sustained load. Pure canvas, no library.
- Room: amber corner glow (8s breathe), static vignette, rare
  lightning wash (45-90s, rAF-driven). Reduced-motion renders a
  static gradient + vignette only — no canvas, no glow, no flash.
- Intensity follows the palette via window.__rainIntensity lerped in
  the palette tween: 1.4 shelfsense, 1.1 supportai, 0.9 leadflow,
  0.3 fadeandco (near-drizzle calm), 1.0 neutral.
- Neutral tokens warmed (bg [14,14,18], fg warm off-white);
  body transparent with bg on <html> so the canvas shows through.
  Nav scrolled state softened to bg-background/70. Accent pair
  deliberately left cool (chrome vs. editorial tone).
- Contrast on warm base: fg 15.90, muted 7.67, mutedFG 4.63 (AA).
- First Load JS unchanged at 165 kB (canvas component is dependency-
  free; GSAP still dynamic).
- Review fixes: lightning clock rebased on tab return, debounced
  resize with full-height drop distribution + visualViewport, print
  hidden, live reduced-motion swap, NaN intensity guard.

## 2026-10-05 — Layer 5: about stats, magic UI accents, polish

- AboutStats: three counters (3 Live projects / 4 AI patterns /
  1 Registered copyright), NumberTicker on scroll-into-view, one-shot,
  reduced-motion + no-JS render finals. Vendor spring has no duration
  prop, so the ~1s settle is approximate, not 1200ms exact.
- Contact: ShimmerButton CTA (accent surface, background text, subtle
  shimmer) + plain-text email fallback link + availability lines.
  Button accent-vs-text is 4.45/4.46 on supportai/fadeandco — hairline
  under AA normal, passes 3:1 large-text; recorded, not patched.
- Skills: category keep-list (Flask, Vercel AI SDK, scikit-learn,
  pgvector, Cloudflare, Resend, GitHub Actions in).
- Footer: "Built by hand with Next.js, GSAP, and Magic UI."
- 404 / error / loading are token-only; fresh loads start neutral.
- Magic UI as accent only (NumberTicker + ShimmerButton, no new deps);
  scroll-cue shiny text skipped. Registry color defaults removed from
  vendored files (tailwind-merge can't collapse project tokens).
- Review fixes: mailto anchor fallback, noscript finals, focus-visible
  ring on CTA, reduced-motion change listener, ticker reveal delay.

## 2026-10-05 — Layer 4: horizontal Flip

- Products pins on desktop (ScrollTrigger pin + scrub 1, 1:1 travel);
  vertical scroll translates a 3-card track (70vw cards). Mobile and
  reduced-motion keep the vertical stack with details always visible.
- Center detection runs on the TWEEN's onUpdate (scrub smoothing keeps
  the track traveling after scroll settles; trigger onUpdate would read
  stale geometry). Centered card gets data-centered + drives
  setActivePalette; gap zones hold the last palette. onLeave → neutral.
- Card details (case-study + repo links) expand via CSS attribute
  toggle; always-visible = name + one-liner + Live site. No invented
  content.
- Layer-3 vertical triggers yield while #products is position:fixed
  (their bands go stale inside the pin); approach/reverse/mobile use
  the vertical path unchanged.
- Keyboard: focusin centers the focused card (1px scroll = 1px travel);
  Escape blurs + smooth-scrolls to Services. Lenis.resize() after pin
  setup so long targets below the pin stay reachable.
- Verified: pin/translate 1:1, all three palette+detail moments,
  unpin-to-neutral, reverse, resize-refresh, mobile + reduced-motion
  stacks, Tab-center, Escape exit, rapid fling convergence, zero
  console errors on settled loads.

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
