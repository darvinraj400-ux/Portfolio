# DARVINN STUDIO — Project Asset Guide

Last updated: 2026-11-01

This document maps every project in the 33-project collection to its image folder and defines the filenames the portfolio expects. The central project data lives in [`lib/projects.ts`](lib/projects.ts). The folder structure is content-driven: replacing an image should not require touching the 3D scene, React components or gallery layout.

## Inventory accounting

| Category | Projects |
|---|---:|
| Website Design & Branding | 22 |
| Mobile Design & Branding | 5 |
| AI & Automation | 3 |
| Business Systems | 3 |
| **Total** | **33** |

These counts are derived from `PROJECTS` in `lib/projects.ts`, not hardcoded in components.

ShelfSenseAI is intentionally excluded from the 33-project collection, the landing spiral, the `/projects` archive, filters and project counts. Its existing project information and repository reference are preserved in `ACADEMIC_PROJECTS` in `lib/projects.ts` and remain in `lib/constants.ts`. No ShelfSenseAI asset folder is created here.

## Directory structure

```text
public/
├── images/
│   ├── studio/                     # Studio identity assets (optional)
│   ├── ui/                         # Shared interface assets (optional)
│   └── projects/
│       ├── pastel-aesthetic-theme/
│       │   ├── .gitkeep
│       │   ├── cover.webp          # Add these files manually
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
│       │   ├── screen-05.webp
│       │   └── screen-06.webp      # Optional; absent until supplied
│       └── ... 31 more project folders
└── audio/
    ├── music/
    └── interface/
```

Every image folder currently contains only `.gitkeep`; no screenshots or interface mockups have been generated. The only generated audio is the two original sounds in `public/audio`, documented below.

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
| `desktop-01.webp` | First desktop interface image | Required for a complete set |
| `desktop-02.webp` | Second desktop interface image | Required for a complete set |
| `desktop-03.webp` | Third desktop interface image | Required for a complete set |
| `desktop-04.webp` | Fourth desktop interface image | Required for a complete set |
| `mobile-01.webp` | First mobile interface image | Required for a complete set |
| `mobile-02.webp` | Second mobile interface image | Required for a complete set |

### Mobile design-concept projects

| Filename | Purpose | Slot |
|---|---|---|
| `cover.webp` | Portfolio card and project hero | Required |
| `screen-01.webp` | Specified screen 1 | Required for a complete set |
| `screen-02.webp` | Specified screen 2 | Required for a complete set |
| `screen-03.webp` | Specified screen 3 | Required for a complete set |
| `screen-04.webp` | Specified screen 4 | Required for a complete set |
| `screen-05.webp` | Specified screen 5 | Required for a complete set |
| `screen-06.webp` | Optional sixth gallery slot | Optional |

The five current mobile concepts each specify exactly five screens. Do not invent a sixth screen. `screen-06.webp` exists only as an optional gallery slot for a genuine additional image supplied later.

## Recommended image specifications

These are upload recommendations. The final crop depends on the component layout; keep important interface content away from the outer edges so it survives responsive cropping.

| Slot | Recommended size | Aspect ratio | Target file size |
|---|---|---|---|
| `cover.webp` | 1600 × 1200 | 4:3 | 200–600 KB |
| `desktop-*.webp` | 1920 × 1080 | 16:9 | 300–900 KB |
| `mobile-*.webp` | 1170 × 2532 | 9:19.5 | 150–500 KB |
| `screen-*.webp` | 1170 × 2532 or 1290 × 2796 | 9:19.5 | 150–500 KB |

Additional guidance:

- Use sRGB colour.
- Use WebP quality 80–85.
- Keep full-page screenshots readable at card size; avoid extremely long full-page captures for `cover.webp`.
- Use consistent image dimensions within one project folder.
- Do not upscale a low-resolution screenshot to fill a slot.

## Supported format

The canonical filename contract is `.webp`, and every path in `lib/projects.ts` ends in `.webp`.

- Convert PNG or JPEG sources to WebP rather than renaming the extension.
- Do not place a file named `cover.webp` that is actually a PNG or JPEG; browsers may decode it, but the asset pipeline treats the filename as a contract.
- Support for retaining other extensions (AVIF, PNG, JPEG) requires an explicit asset-resolution change. Flag it before supplying a different format so the gallery and placeholder logic can be updated and tested.
- Do not rename a project folder without updating the project slug and asset paths in `lib/projects.ts`.

## Adding or replacing an image

1. Use this guide to find the project folder.
2. Add or replace the file at the exact filename in the table above.
3. Keep the same filename; do not add suffixes such as `-final` or `-v2`.
4. Confirm the new image has the expected dimensions and format.
5. Refresh the page. No code change is needed once the asset layer is connected in the gallery stage.

`.gitkeep` is a folder placeholder, not a project asset. It can remain after real images are added; the asset layer targets only the named image files.

## Missing images

Until real images are supplied:

- The interface must render a polished monochrome placeholder.
- Do not show broken image icons.
- Do not substitute an unrelated screenshot.
- Do not generate or present fake interface screenshots, fabricated mobile screens, testimonials or results.
- A missing optional `screen-06.webp` must not create a sixth invented screen.

The gallery and card components that enforce these rules are part of a later implementation stage. This document defines the contract they will consume.

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

## Link and content verification status

- All 28 supplied demo URLs (22 website projects, 3 AI projects and 3 business systems) returned HTTP 200 on 2026-10-30.
- HTTP 200 confirms that the URL responded; it does not independently verify that the content still matches the supplied inventory.
- No URLs were replaced or guessed.
- The five mobile concepts have no supplied live URL and are labelled as design concepts.
- Preserved entry instructions are stored in the data model:
  - REP CLUB: visitors must click "Start Training" to enter the experience.
  - Alex Mori: wait for the landing page to finish loading before interacting.
- No outcomes, client names, testimonials, metrics, technology stacks or deployment claims have been invented.

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
