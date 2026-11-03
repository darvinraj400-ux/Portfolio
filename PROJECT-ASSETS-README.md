# DARVINN STUDIO — Project Asset Guide

Last updated: 2026-11-03

This document maps every project in the 33-project collection to its image folder and records the assets that are now installed. The central project data lives in [`lib/projects.ts`](lib/projects.ts). Folder names and slugs are canonical and must not be renamed.

## Inventory accounting

| Category | Projects |
|---|---:|
| Website Design & Branding | 22 |
| Mobile Design & Branding | 5 |
| AI & Automation | 3 |
| Business Systems | 3 |
| **Total** | **33** |

These counts are derived from `PROJECTS` in `lib/projects.ts`, not hardcoded in components. `validateProjectInventory()` currently returns an empty array.

ShelfSenseAI is intentionally excluded from the 33-project collection, the landing spiral, the `/projects` archive, filters and project counts. Its existing project information and repository reference are preserved in `ACADEMIC_PROJECTS` in `lib/projects.ts` and remain in `lib/constants.ts`. No ShelfSenseAI asset folder is created here.

## Installed assets

All 33 projects now have a complete supplied image set:

| Set type | Projects | Files per project | Files |
|---|---:|---:|---:|
| Standard gallery (`cover` + 4 desktop + 2 mobile) | 28 | 7 | 196 |
| Mobile concept (`cover` + 5 screens) | 5 | 6 | 30 |
| **Total** | **33** | | **226** |

- No required image is missing.
- No `screen-06.webp` exists. The optional sixth screen was not supplied and must not be invented.
- Every project folder in `public/images/projects/` contains only `.webp` files plus its `.gitkeep`.
- The supplied originals (PNG/JPEG) were moved out of `public/` to `.qa/stage9/originals/<slug>/` after conversion verification. They are a reversible QA backup, not site assets, and are not committed. They can be deleted after review.

### Actual dimensions

Dimensions were preserved exactly from the supplied sources; no image was cropped, stretched or scaled. The sets are not uniform, so these are the real dimensions rather than a single target per slot.

| Slot | Actual dimensions (file count) |
|---|---|
| `cover.webp` | 1440×900 (24), 2752×1536 (4), 1376×768 (4), 1024×572 (1) |
| `desktop-*.webp` | 1440×900 (99), 1669×911 (13) |
| `mobile-*.webp` | 780×1688 (53), 1179×2556 (2), 1320×2868 (1) |
| `screen-*.webp` | 390×884 (7); 390×1092, 390×1117, 390×1230, 390×1248, 390×1299 (1 each); 377–611×1600 (12); 390×1600 (1) |

### Conversion record

Source formats were 28 PNG covers, 112 PNG desktop images, 56 PNG mobile images, 25 PNG screens and 5 JPEG covers. Every source was encoded to WebP with `sharp` and verified before the original was moved:

| Check | Result |
|---|---|
| Files converted | 226 |
| Failures | 0 |
| Source total | 90.84 MB |
| WebP total | 13.39 MB (85.3% smaller) |
| Encoding chosen | 147 × lossy WebP quality 90; 79 × lossless WebP |
| Encoding rule | Both q90 lossy and lossless were encoded; the smaller result passing verification was kept |
| Dimensions | All 226 match the source exactly |
| Alpha/transparency | All preserved; maximum alpha difference 0 |
| Pixel comparison | Raw RGBA comparison; maximum mean RGB difference 1.525 |
| Files larger than source | None |

Flat UI screenshots often compress better losslessly, so a subset is lossless and pixel-identical; photographic imagery uses q90. No image was recoloured.

## WebP conventions

- The canonical filename contract is `.webp`, and every path in `lib/projects.ts` ends in `.webp`.
- Convert PNG or JPEG sources to WebP rather than renaming the extension.
- Do not place a file named `cover.webp` that is actually a PNG or JPEG; browsers may decode it, but the asset pipeline treats the filename as a contract.
- Preserve the source dimensions, aspect ratio, colour and transparency. Do not crop, stretch or recolour during conversion.
- For new assets, encode both q90 lossy and lossless, keep the smaller file that passes pixel/alpha verification, and only then remove the original.
- Support for retaining other extensions (AVIF, PNG, JPEG) requires an explicit asset-resolution change. Flag it before supplying a different format so the gallery and placeholder logic can be updated and tested.
- Do not rename a project folder without updating the project slug and asset paths in `lib/projects.ts`.

## Directory structure

```text
public/
├── images/
│   ├── studio/                     # Studio identity assets (optional)
│   ├── ui/                         # Shared interface assets (optional)
│   └── projects/
│       ├── pastel-aesthetic-theme/
│       │   ├── .gitkeep
│       │   ├── cover.webp
│       │   ├── desktop-01.webp
│       │   ├── desktop-02.webp
│       │   ├── desktop-03.webp
│       │   ├── desktop-04.webp
│       │   ├── mobile-01.webp
│       │   └── mobile-02.webp
│       ├── dailydrip/
│       │   ├── .gitkeep
│       │   ├── cover.webp
│       │   ├── screen-01.webp
│       │   ├── screen-02.webp
│       │   ├── screen-03.webp
│       │   ├── screen-04.webp
│       │   └── screen-05.webp
│       └── ... 31 more project folders
└── audio/
    ├── music/
    └── interface/
```

## Project folder map

| # | Project | Slug / folder | Category | Gallery slots |
|---:|---|---|---|---|
| 01 | Pastel Aesthetic Theme | `pastel-aesthetic-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 02 | Luxury Theme | `luxury-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 03 | Brutalist Design | `brutalist-design` | Website Design & Branding | 4 desktop + 2 mobile |
| 04 | Playful Colorful Theme | `playful-colorful-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 05 | Nature Theme | `nature-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 06 | Corporate Theme | `corporate-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 07 | Glassmorphism Theme | `glassmorphism-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 08 | Retro Theme | `retro-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 09 | Aether Cosmos | `aether-cosmos` | Website Design & Branding | 4 desktop + 2 mobile |
| 10 | Minimalist Design | `minimalist-design` | Website Design & Branding | 4 desktop + 2 mobile |
| 11 | Botanian Plant Web Design | `botanian-plant-web-design` | Website Design & Branding | 4 desktop + 2 mobile |
| 12 | Keystone Living | `keystone-living` | Website Design & Branding | 4 desktop + 2 mobile |
| 13 | REP CLUB | `rep-club` | Website Design & Branding | 4 desktop + 2 mobile |
| 14 | Mind Spring Academy | `mind-spring-academy` | Website Design & Branding | 4 desktop + 2 mobile |
| 15 | Atelier Noir | `atelier-noir` | Website Design & Branding | 4 desktop + 2 mobile |
| 16 | ROAM ATLAS | `roam-atlas` | Website Design & Branding | 4 desktop + 2 mobile |
| 17 | PULSEBOARD | `pulseboard` | Website Design & Branding | 4 desktop + 2 mobile |
| 18 | Alex Mori | `alex-mori` | Website Design & Branding | 4 desktop + 2 mobile |
| 19 | NOVA SUPPLY | `nova-supply` | Website Design & Branding | 4 desktop + 2 mobile |
| 20 | Ember & Olive | `ember-and-olive` | Website Design & Branding | 4 desktop + 2 mobile |
| 21 | Brew & Bean | `brew-and-bean` | Website Design & Branding | 4 desktop + 2 mobile |
| 22 | Futuristic Theme | `futuristic-theme` | Website Design & Branding | 4 desktop + 2 mobile |
| 23 | DailyDrip | `dailydrip` | Mobile Design & Branding | 5 screens + 1 optional |
| 24 | PULSE | `pulse` | Mobile Design & Branding | 5 screens + 1 optional |
| 25 | MakanMate | `makanmate` | Mobile Design & Branding | 5 screens + 1 optional |
| 26 | Dewdrop | `dewdrop` | Mobile Design & Branding | 5 screens + 1 optional |
| 27 | PocketPal | `pocketpal` | Mobile Design & Branding | 5 screens + 1 optional |
| 28 | DocuFlow AI | `docuflow-ai` | AI & Automation | 4 desktop + 2 mobile |
| 29 | LeadFlow | `leadflow` | AI & Automation | 4 desktop + 2 mobile |
| 30 | SupportAI | `supportai` | AI & Automation | 4 desktop + 2 mobile |
| 31 | SlotWise | `slotwise` | Business Systems | 4 desktop + 2 mobile |
| 32 | StockPilot | `stockpilot` | Business Systems | 4 desktop + 2 mobile |
| 33 | Fade & Co. | `fade-and-co` | Business Systems | 4 desktop + 2 mobile |

Aliases do not get separate folders. In particular:

- Mind Spring Academy is also known as Mindspring Academy. Folder: `mind-spring-academy`.
- Brew & Bean is also known as Luma Café. Folder: `brew-and-bean`.
- LeadFlow is associated with Relay. Folder: `leadflow`.
- SupportAI uses the public identity Nimbus Analytics. Folder: `supportai`.
- `support-ai` is preserved as a legacy slug in the data model, but it is not a second project or folder.

## Filename contract

### Standard website, AI and business-system projects

| Filename | Purpose | Slot |
|---|---|---|
| `cover.webp` | Portfolio card and project hero | Required |
| `desktop-01.webp` | First desktop interface image | Required |
| `desktop-02.webp` | Second desktop interface image | Required |
| `desktop-03.webp` | Third desktop interface image | Required |
| `desktop-04.webp` | Fourth desktop interface image | Required |
| `mobile-01.webp` | First mobile interface image | Required |
| `mobile-02.webp` | Second mobile interface image | Required |

### Mobile design-concept projects

| Filename | Purpose | Slot |
|---|---|---|
| `cover.webp` | Portfolio card and project hero | Required |
| `screen-01.webp` | Specified screen 1 | Required |
| `screen-02.webp` | Specified screen 2 | Required |
| `screen-03.webp` | Specified screen 3 | Required |
| `screen-04.webp` | Specified screen 4 | Required |
| `screen-05.webp` | Specified screen 5 | Required |
| `screen-06.webp` | Optional sixth gallery slot | Optional; not currently supplied |

The five current mobile concepts each specify exactly five screens. Do not invent a sixth screen. `screen-06.webp` exists only as an optional gallery slot for a genuine additional image supplied later.

## Adding or replacing an image

1. Use this guide to find the project folder.
2. Add or replace the file at the exact filename in the table above.
3. Keep the same filename; do not add suffixes such as `-final` or `-v2`.
4. Preserve the source dimensions and aspect ratio; keep important interface content away from the outer edges so it survives the existing 4:3 card/hero frame cropping.
5. Encode WebP and verify dimensions, transparency and pixel fidelity before removing the source.
6. Refresh the page. No code change is needed; the server checks for the `.webp` file and activates it automatically.

`.gitkeep` is a folder placeholder, not a project asset. It can remain alongside real images; the asset layer targets only the named image files.

## Missing images

None. All 28 standard sets have seven files and all five mobile sets have six files. The optional `screen-06.webp` is intentionally absent.

If an image is ever removed, the interface must render a polished abstract placeholder rather than a broken image icon. Do not substitute an unrelated screenshot or generate fake interface screens. The gallery and card components already enforce this.

## Live demo URLs

The 28 supplied URLs below are used exactly as supplied: no spelling, hostname or path changes. All returned HTTP 200 with no redirect on 2026-11-03.

| Project | Exact URL | Result |
|---|---|---|
| Pastel Aesthetic Theme | https://pastel-aesthetic-demo.vercel.app/ | 200, no redirect |
| Luxury Theme | https://luxury-theme-demo.vercel.app/ | 200, no redirect |
| Brutalist Design | https://brutalist-design-demo.vercel.app/ | 200, no redirect |
| Playful Colorful Theme | https://playful-colorful-theme.vercel.app/ | 200, no redirect |
| Nature Theme | https://nature-theme-delta.vercel.app/ | 200, no redirect |
| Corporate Theme | https://corporate-theme-demo.vercel.app/ | 200, no redirect |
| Glassmorphism Theme | https://glassmorphism-theme-demo.vercel.app/ | 200, no redirect |
| Retro Theme | https://retro-theme.vercel.app/ | 200, no redirect |
| Aether Cosmos | https://planet-system-sites.vercel.app/ | 200, no redirect |
| Minimalist Design | https://minimalist-demo-design.vercel.app/ | 200, no redirect |
| Botanian Plant Web Design | https://botanian-plant-web-design-demo.vercel.app/ | 200, no redirect |
| Keystone Living | https://real-estate-web-design-demo.vercel.app/ | 200, no redirect |
| REP CLUB | https://fitness-website-demo-seven.vercel.app/ | 200, no redirect |
| Mind Spring Academy | https://mind-spring-academy-learning-platfo.vercel.app/ | 200, no redirect |
| Atelier Noir | https://luxury-fashion-editorial-boutique.vercel.app/ | 200, no redirect |
| ROAM ATLAS | https://interactive-travel-explore-design-d.vercel.app/ | 200, no redirect |
| PULSEBOARD | https://saa-s-analytics-dashboard-demo.vercel.app/ | 200, no redirect |
| Alex Mori | https://portfolio-demo-nine-sable-96.vercel.app/ | 200, no redirect |
| NOVA SUPPLY | https://premium-ecommerse-store.vercel.app/ | 200, no redirect |
| Ember & Olive | https://ember-and-olive-gamma.vercel.app/ | 200, no redirect |
| Brew & Bean | https://luma-cafe-psi.vercel.app/ | 200, no redirect |
| Futuristic Theme | https://futuristic-theme-demo.vercel.app/ | 200, no redirect |
| DocuFlow AI | https://docu-flow-ai-flax.vercel.app/ | 200, no redirect |
| LeadFlow | https://lead-flow-sable.vercel.app/ | 200, no redirect |
| SupportAI | https://support-ai-three-gold.vercel.app/ | 200, no redirect |
| SlotWise | https://slot-wise-five.vercel.app/ | 200, no redirect |
| StockPilot | https://stock-pilot-lilac-omega.vercel.app/ | 200, no redirect |
| Fade & Co. | https://fade-and-co-psi.vercel.app/ | 200, no redirect |

The previous Retro Theme URL (`https://retro-theme-demo.vercel.app/`) also returned HTTP 200 but is not used; the data model now points at the exact supplied URL above.

### Mobile concepts without a live URL

These five have no supplied live URL and must not show a live-demo button: `dailydrip`, `pulse`, `makanmate`, `dewdrop`, `pocketpal`. They are presented as mobile design concepts.

## Status classifications

Statuses come from `lib/projects.ts`; the only remote evidence collected in this pass is URL reachability. HTTP 200 confirms that a URL responds; it does not independently verify that the content still matches the supplied inventory.

| Status | Count | Projects | Basis |
|---|---:|---|---|
| `live-website-demo` | 22 | All Website Design & Branding projects | Supplied URL returned 200 |
| `mobile-ui-concept` | 5 | DailyDrip, PULSE, MakanMate, Dewdrop, PocketPal | No URL supplied; design concepts |
| `development-in-progress` | 1 | DocuFlow AI | URL returned 200; status note says authentication is live but the AI processing pipeline is still in development and not shipped |
| `live-functional-demonstration` | 1 | LeadFlow | URL returned 200; Relay is a fictional CRM portfolio product, not a commercial deployment |
| `live-demo` | 4 | SupportAI, SlotWise, StockPilot, Fade & Co. | URLs returned 200; SupportAI has documented performance/reliability limitations and Fade & Co. has documented gaps |

Preserved entry instructions from the data model:

- REP CLUB: visitors must click "Start Training" to enter the experience.
- Alex Mori: wait for the landing page to finish loading before interacting.

No outcomes, client names, testimonials, metrics, technology stacks or deployment claims have been invented.

## Audio assets

The site uses exactly two original, procedurally synthesised sounds, generated by `scripts/generate-audio.mjs`. Levels, provenance and regeneration steps are in [`public/audio/README.md`](public/audio/README.md). Both are on by default; if the browser blocks autoplay, music starts on the visitor's first interaction. Turning either switch off persists and stops or prevents that cue.

```text
public/audio/
├── music/
│   └── late-night-studio.ogg/.m4a   # 30 s seamless jazz loop, opt-in
└── interface/
    └── soft-click.ogg/.m4a          # single tactile click, opt-in
```

Do not add hover, transition, category or gallery cue folders. The sound layer supports only the music toggle and the cursor click; incidental pointer, scroll and animation events stay silent.

## Changing project data

Edit `lib/projects.ts` for names, aliases, statuses, descriptions, links, keywords and gallery paths. Keep the following invariants:

- 33 records total: 22 website, 5 mobile, 3 AI, 3 business.
- Unique `id`, `slug` and canonical `name`.
- Slugs remain lowercase kebab-case.
- Each standard project has four desktop and two mobile image slots.
- Each mobile concept has five specified screen slots plus one optional sixth slot.
- ShelfSenseAI remains outside `PROJECTS`.
- Category counts are computed from the data at runtime.

Run the data validator before renaming folders or adding records:

```bash
node --experimental-strip-types --input-type=module -e "import('./lib/projects.ts').then((m) => console.log(m.validateProjectInventory()))"
```

A valid inventory returns an empty array.
