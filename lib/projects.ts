/**
 * Authoritative DARVINN STUDIO portfolio inventory.
 *
 * 33 projects across four categories. This file is the single source of
 * truth for the landing spiral, /projects archive, /work/[slug] pages,
 * category counts, search and previous/next navigation.
 *
 * ShelfSenseAI is intentionally NOT part of this collection. It is
 * preserved separately in ACADEMIC_PROJECTS and in lib/constants.ts.
 */

export const PROJECT_CATEGORIES = [
  { id: "website", label: "Website Design & Branding" },
  { id: "mobile", label: "Mobile Design & Branding" },
  { id: "ai", label: "AI & Automation" },
  { id: "business", label: "Business Systems" },
] as const;

export type ProjectCategoryId = (typeof PROJECT_CATEGORIES)[number]["id"];

export const PROJECT_STATUS_LABELS = {
  "live-website-demo": "Live website demo",
  "live-demo": "Live demo",
  "live-functional-demonstration": "Live functional demonstration",
  "development-in-progress": "Development in progress",
  "mobile-ui-concept": "Mobile UI design concept",
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS_LABELS;

export type GalleryLayout = "desktop-mobile" | "mobile-screens";

export type ProjectGallery = {
  layout: GalleryLayout;
  cover: string;
  desktop: string[];
  mobile: string[];
  /** Specified mobile screens only. Five for every current mobile concept. */
  screens: string[];
  /** Optional sixth mobile image slot. Must not imply a sixth specified screen. */
  optionalScreens: string[];
};

export type MobileConcept = {
  tagline: string;
  industry: string;
  personality: string;
  audience: string;
  visualStyle: string;
  palette: { name: string; hex: string }[];
  typography: string[];
  specifiedScreens: string[];
  fictionalContent: string[];
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  legacySlugs: string[];
  category: ProjectCategoryId;
  projectType: string;
  status: ProjectStatus;
  shortDescription: string;
  description: string;
  statusNote?: string;
  specialInstruction?: string;
  engineeringThesis?: string;
  highlights: string[];
  limitations: string[];
  role: string[];
  technologies: string[];
  outcomes: string[];
  liveUrl: string | null;
  repoUrl: string | null;
  caseStudyUrl: string | null;
  figmaUrl: string | null;
  featured: boolean;
  keywords: string[];
  gallery: ProjectGallery;
  concept?: MobileConcept;
};

const asset = (slug: string, file: string) =>
  `/images/projects/${slug}/${file}`;

const desktopGallery = (slug: string) => [
  asset(slug, "desktop-01.webp"),
  asset(slug, "desktop-02.webp"),
  asset(slug, "desktop-03.webp"),
  asset(slug, "desktop-04.webp"),
];

const mobileGallery = (slug: string) => [
  asset(slug, "mobile-01.webp"),
  asset(slug, "mobile-02.webp"),
];

const screenGallery = (slug: string) => [
  asset(slug, "screen-01.webp"),
  asset(slug, "screen-02.webp"),
  asset(slug, "screen-03.webp"),
  asset(slug, "screen-04.webp"),
  asset(slug, "screen-05.webp"),
];

const desktopMobileGallery = (slug: string): ProjectGallery => ({
  layout: "desktop-mobile",
  cover: asset(slug, "cover.webp"),
  desktop: desktopGallery(slug),
  mobile: mobileGallery(slug),
  screens: [],
  optionalScreens: [],
});

const mobileScreensGallery = (slug: string): ProjectGallery => ({
  layout: "mobile-screens",
  cover: asset(slug, "cover.webp"),
  desktop: [],
  mobile: [],
  screens: screenGallery(slug),
  optionalScreens: [asset(slug, "screen-06.webp")],
});

const MOBILE_CONCEPT_LIMITATIONS = [
  "Mobile UI design concept only — not a shipped application or a verified complete Figma file.",
  "Only five screens are specified; the sixth gallery slot stays optional until a real image is supplied.",
];

export const PROJECTS: Project[] = [
  {
    id: "01",
    slug: "pastel-aesthetic-theme",
    name: "Pastel Aesthetic Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A soft visual theme built around gentle colour, calm layouts and quiet typography.",
    description:
      "A visual theme exploration demonstrating soft colour theory, gentle typography and calm layouts.",
    highlights: ["Soft colour theory", "Gentle typography", "Calm layouts"],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://pastel-aesthetic-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["pastel", "soft colour", "calm", "theme", "visual design"],
    gallery: desktopMobileGallery("pastel-aesthetic-theme"),
  },
  {
    id: "02",
    slug: "luxury-theme",
    name: "Luxury Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A restrained, high-end theme led by serif display type, premium spacing and quiet detailing.",
    description:
      "A visual theme exploration demonstrating premium spacing, serif display typography, restrained palettes and high-end presentation.",
    highlights: [
      "Premium spacing",
      "Serif display typography",
      "Restrained palettes",
      "High-end presentation",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://luxury-theme-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["luxury", "premium", "serif", "editorial", "theme"],
    gallery: desktopMobileGallery("luxury-theme"),
  },
  {
    id: "03",
    slug: "brutalist-design",
    name: "Brutalist Design",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "An uncompromising theme of raw layouts, heavy borders and anti-decoration.",
    description:
      "A visual theme exploration demonstrating raw layouts, heavy borders, uncompromising typography and anti-decoration.",
    highlights: [
      "Raw layouts",
      "Heavy borders",
      "Uncompromising typography",
      "Anti-decoration",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://brutalist-design-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["brutalist", "raw", "borders", "typography", "theme"],
    gallery: desktopMobileGallery("brutalist-design"),
  },
  {
    id: "04",
    slug: "playful-colorful-theme",
    name: "Playful Colorful Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A high-energy theme built from bold colour blocking, rounded shapes and motion.",
    description:
      "A visual theme exploration demonstrating bold colour blocking, rounded shapes and energetic motion.",
    highlights: ["Bold colour blocking", "Rounded shapes", "Energetic motion"],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://playful-colorful-theme.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["playful", "colourful", "colour blocking", "rounded", "motion"],
    gallery: desktopMobileGallery("playful-colorful-theme"),
  },
  {
    id: "05",
    slug: "nature-theme",
    name: "Nature Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "An organic theme pairing botanical imagery with earthy type and natural palettes.",
    description:
      "A visual theme exploration demonstrating organic palettes, botanical imagery and earthy typography.",
    highlights: ["Organic palettes", "Botanical imagery", "Earthy typography"],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://nature-theme-delta.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["nature", "botanical", "organic", "earthy", "theme"],
    gallery: desktopMobileGallery("nature-theme"),
  },
  {
    id: "06",
    slug: "corporate-theme",
    name: "Corporate Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A conservative, trust-oriented theme built on structured grids and clear hierarchy.",
    description:
      "A visual theme exploration demonstrating structured grids, trust-building hierarchy and conservative palettes.",
    highlights: [
      "Structured grids",
      "Trust-building hierarchy",
      "Conservative palettes",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://corporate-theme-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["corporate", "business", "grid", "trust", "theme"],
    gallery: desktopMobileGallery("corporate-theme"),
  },
  {
    id: "07",
    slug: "glassmorphism-theme",
    name: "Glassmorphism Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A layered theme exploring frosted glass, blur and translucency.",
    description:
      "A visual theme exploration demonstrating frosted glass surfaces, blur and layered translucency.",
    highlights: [
      "Frosted glass surfaces",
      "Blur",
      "Layered translucency",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://glassmorphism-theme-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["glassmorphism", "glass", "blur", "translucency", "theme"],
    gallery: desktopMobileGallery("glassmorphism-theme"),
  },
  {
    id: "08",
    slug: "retro-theme",
    name: "Retro Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A period-inspired theme with vintage typography and nostalgic palettes.",
    description:
      "A visual theme exploration demonstrating vintage typography, nostalgic palettes and period styling.",
    highlights: ["Vintage typography", "Nostalgic palettes", "Period styling"],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://retro-theme-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["retro", "vintage", "nostalgic", "period", "theme"],
    gallery: desktopMobileGallery("retro-theme"),
  },
  {
    id: "09",
    slug: "aether-cosmos",
    name: "Aether Cosmos",
    aliases: ["Aether Cosmos (Planet System)"],
    legacySlugs: [],
    category: "website",
    projectType: "Interactive experience",
    status: "live-website-demo",
    shortDescription:
      "A 3D space-themed interactive experience built around an orbital planet system and an immersive narrative.",
    description:
      "Aether Cosmos is a 3D space-themed interactive experience demonstrating orbital motion and an immersive narrative.",
    highlights: [
      "3D space-themed interaction",
      "Orbital motion",
      "Immersive narrative",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://planet-system-sites.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["space", "planets", "orbital", "3d", "interactive", "cosmos"],
    gallery: desktopMobileGallery("aether-cosmos"),
  },
  {
    id: "10",
    slug: "minimalist-design",
    name: "Minimalist Design",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A reduced theme built on whitespace discipline and essential typography.",
    description:
      "A visual theme exploration demonstrating whitespace discipline, essential typography and visual reduction.",
    highlights: [
      "Whitespace discipline",
      "Essential typography",
      "Visual reduction",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://minimalist-demo-design.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["minimalist", "whitespace", "reduction", "typography", "theme"],
    gallery: desktopMobileGallery("minimalist-design"),
  },
  {
    id: "11",
    slug: "botanian-plant-web-design",
    name: "Botanian Plant Web Design",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Industry-specific website",
    status: "live-website-demo",
    shortDescription:
      "A botanical brand site demonstrating plant product branding and catalogue UX.",
    description:
      "An industry-specific website demonstrating botanical product branding and plant catalogue UX.",
    highlights: ["Botanical product branding", "Plant catalogue UX"],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://botanian-plant-web-design-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["plants", "botanical", "catalogue", "branding", "nature"],
    gallery: desktopMobileGallery("botanian-plant-web-design"),
  },
  {
    id: "12",
    slug: "keystone-living",
    name: "Keystone Living",
    aliases: ["Keystone Living (Real Estate)"],
    legacySlugs: [],
    category: "website",
    projectType: "Brand and business website",
    status: "live-website-demo",
    shortDescription:
      "A premium real-estate brand site built around property listings and trust signals.",
    description:
      "A brand and business website demonstrating property listing UX, trust signals and premium real-estate branding.",
    highlights: [
      "Property listing UX",
      "Trust signals",
      "Premium real-estate branding",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://real-estate-web-design-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["real estate", "property", "listings", "premium", "trust"],
    gallery: desktopMobileGallery("keystone-living"),
  },
  {
    id: "13",
    slug: "rep-club",
    name: "REP CLUB",
    aliases: ["REP CLUB (Fitness)"],
    legacySlugs: [],
    category: "website",
    projectType: "Interactive experience",
    status: "live-website-demo",
    shortDescription:
      "A high-energy gym experience covering brand, programme discovery and interaction.",
    description:
      "An interactive experience demonstrating gym branding, high-energy interaction and programme discovery.",
    specialInstruction:
      'Visitors must click "Start Training" to enter the experience.',
    highlights: [
      "Gym branding",
      "High-energy interaction",
      "Programme discovery",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://fitness-website-demo-seven.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["fitness", "gym", "training", "programme", "interactive"],
    gallery: desktopMobileGallery("rep-club"),
  },
  {
    id: "14",
    slug: "mind-spring-academy",
    name: "Mind Spring Academy",
    aliases: ["Mindspring Academy"],
    legacySlugs: [],
    category: "website",
    projectType: "Digital product / learning platform",
    status: "live-website-demo",
    shortDescription:
      "A learning platform concept built around course discovery and educational information architecture.",
    description:
      "A learning-platform concept demonstrating course discovery, learning-platform UX and educational information architecture.",
    highlights: [
      "Course discovery",
      "Learning-platform UX",
      "Educational information architecture",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://mind-spring-academy-learning-platfo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["education", "learning", "courses", "academy", "platform"],
    gallery: desktopMobileGallery("mind-spring-academy"),
  },
  {
    id: "15",
    slug: "atelier-noir",
    name: "Atelier Noir",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Brand and business website",
    status: "live-website-demo",
    shortDescription:
      "A luxury fashion editorial concept built on typographic luxury and high-end commerce.",
    description:
      "A luxury fashion editorial concept demonstrating editorial fashion branding, high-end commerce and typographic luxury.",
    highlights: [
      "Editorial fashion branding",
      "High-end commerce",
      "Typographic luxury",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://luxury-fashion-editorial-boutique.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["fashion", "luxury", "editorial", "boutique", "commerce"],
    gallery: desktopMobileGallery("atelier-noir"),
  },
  {
    id: "16",
    slug: "roam-atlas",
    name: "ROAM ATLAS",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Interactive experience",
    status: "live-website-demo",
    shortDescription:
      "An interactive travel discovery experience with maps, itineraries and explorative layouts.",
    description:
      "An interactive travel discovery experience demonstrating travel discovery UX, interactive maps, itineraries and explorative layouts.",
    highlights: [
      "Travel discovery UX",
      "Interactive maps",
      "Itineraries",
      "Explorative layouts",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://interactive-travel-explore-design-d.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["travel", "maps", "itineraries", "discovery", "interactive"],
    gallery: desktopMobileGallery("roam-atlas"),
  },
  {
    id: "17",
    slug: "pulseboard",
    name: "PULSEBOARD",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Digital product",
    status: "live-website-demo",
    shortDescription:
      "A SaaS analytics dashboard exploring data visualisation and dashboard information architecture.",
    description:
      "A SaaS analytics dashboard concept demonstrating data visualisation, dashboard information architecture and product UX.",
    highlights: [
      "Data visualisation",
      "Dashboard information architecture",
      "SaaS product UX",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://saa-s-analytics-dashboard-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["saas", "analytics", "dashboard", "data visualisation"],
    gallery: desktopMobileGallery("pulseboard"),
  },
  {
    id: "18",
    slug: "alex-mori",
    name: "Alex Mori",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Creative portfolio",
    status: "live-website-demo",
    shortDescription:
      "A motion-led personal portfolio with case-study layouts and personal branding.",
    description:
      "A creative portfolio demonstrating personal branding, case-study layouts and motion-led presentation.",
    specialInstruction:
      "Wait for the landing page to finish loading before interacting.",
    highlights: [
      "Personal branding",
      "Case-study layouts",
      "Motion-led presentation",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://portfolio-demo-nine-sable-96.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["portfolio", "personal branding", "case study", "motion"],
    gallery: desktopMobileGallery("alex-mori"),
  },
  {
    id: "19",
    slug: "nova-supply",
    name: "NOVA SUPPLY",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Digital product / e-commerce",
    status: "live-website-demo",
    shortDescription:
      "A premium e-commerce demonstration built around product catalogues, checkout and retail branding.",
    description:
      "A premium e-commerce concept demonstrating product catalogues, checkout UX and retail branding.",
    highlights: [
      "Product catalogues",
      "Checkout UX",
      "Premium retail branding",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://premium-ecommerse-store.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["ecommerce", "retail", "products", "checkout", "premium"],
    gallery: desktopMobileGallery("nova-supply"),
  },
  {
    id: "20",
    slug: "ember-and-olive",
    name: "Ember & Olive",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Brand and business website",
    status: "live-website-demo",
    shortDescription:
      "A warm restaurant and hospitality brand site with a menu-led layout.",
    description:
      "A brand and business website demonstrating warm restaurant and hospitality branding with a menu-led layout.",
    highlights: [
      "Restaurant branding",
      "Hospitality branding",
      "Menu-led layout",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://ember-and-olive-gamma.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["restaurant", "hospitality", "menu", "warm", "branding"],
    gallery: desktopMobileGallery("ember-and-olive"),
  },
  {
    id: "21",
    slug: "brew-and-bean",
    name: "Brew & Bean",
    aliases: ["Luma Café"],
    legacySlugs: [],
    category: "website",
    projectType: "Brand and business website",
    status: "live-website-demo",
    shortDescription:
      "A warm café brand site demonstrating local-business UX and café identity.",
    description:
      "A brand and business website demonstrating café branding, warm palettes and local-business UX.",
    highlights: ["Café branding", "Warm palettes", "Local-business UX"],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://luma-cafe-psi.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["cafe", "coffee", "local business", "warm", "branding"],
    gallery: desktopMobileGallery("brew-and-bean"),
  },
  {
    id: "22",
    slug: "futuristic-theme",
    name: "Futuristic Theme",
    aliases: [],
    legacySlugs: [],
    category: "website",
    projectType: "Visual theme exploration",
    status: "live-website-demo",
    shortDescription:
      "A speculative interface theme of sci-fi surfaces, glow and advanced motion.",
    description:
      "A visual theme exploration demonstrating sci-fi interfaces, glow, advanced motion and speculative interface design.",
    highlights: [
      "Sci-fi interfaces",
      "Glow",
      "Advanced motion",
      "Speculative interface design",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://futuristic-theme-demo.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: ["futuristic", "sci-fi", "glow", "motion", "interface"],
    gallery: desktopMobileGallery("futuristic-theme"),
  },
  {
    id: "23",
    slug: "dailydrip",
    name: "DailyDrip",
    aliases: [],
    legacySlugs: [],
    category: "mobile",
    projectType: "Mobile app design concept",
    status: "mobile-ui-concept",
    shortDescription:
      "Your daily ritual, brewed better — a specialty coffee ordering and loyalty app concept.",
    description:
      "A mobile UI design concept for specialty coffee ordering and loyalty. DailyDrip pairs a warm, refined, artisanal and contemporary personality with a premium editorial café aesthetic across five specified screens.",
    statusNote:
      "Mobile UI design concept, not a shipped application or a verified complete Figma file.",
    highlights: [
      "E-commerce UI",
      "Product customisation",
      "Brand identity",
      "Loyalty systems",
      "Checkout design",
    ],
    limitations: MOBILE_CONCEPT_LIMITATIONS,
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: null,
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "coffee",
      "cafe",
      "ordering",
      "loyalty",
      "mobile",
      "ui concept",
    ],
    gallery: mobileScreensGallery("dailydrip"),
    concept: {
      tagline: "Your daily ritual, brewed better.",
      industry: "Specialty coffee, café ordering and loyalty.",
      personality: "Warm, refined, artisanal and contemporary.",
      audience:
        "Coffee enthusiasts, students, young professionals and remote workers.",
      visualStyle: "Premium editorial café aesthetic.",
      palette: [
        { name: "Espresso", hex: "#2B1D18" },
        { name: "Warm cream", hex: "#F7F2E9" },
        { name: "Caramel", hex: "#C78A54" },
        { name: "Terracotta", hex: "#A85D3B" },
        { name: "Latte beige", hex: "#D7BFA7" },
        { name: "Olive", hex: "#4E654B" },
      ],
      typography: ["DM Sans", "Playfair Display"],
      specifiedScreens: [
        "Home & Discovery",
        "Coffee Menu",
        "Product Details — Honey Oat Latte",
        "Cart & Checkout",
        "Rewards — 8-stamp loyalty card",
      ],
      fictionalContent: [
        "Honey Oat Latte product detail",
        "8-stamp loyalty card",
      ],
    },
  },
  {
    id: "24",
    slug: "pulse",
    name: "PULSE",
    aliases: [],
    legacySlugs: [],
    category: "mobile",
    projectType: "Mobile app design concept",
    status: "mobile-ui-concept",
    shortDescription:
      "Train with purpose — a dark-mode fitness tracking and workout analytics app concept.",
    description:
      "A mobile UI design concept for fitness, workout tracking and activity analytics. PULSE uses a bold, futuristic, disciplined and technical dark-mode visual language across five specified screens.",
    statusNote:
      "Mobile UI design concept, not a shipped application or a verified complete Figma file.",
    highlights: [
      "Data visualisation",
      "Dashboards",
      "Fitness UX",
      "Progress tracking",
      "Dark-mode design",
    ],
    limitations: MOBILE_CONCEPT_LIMITATIONS,
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: null,
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "fitness",
      "workout",
      "training",
      "analytics",
      "dark mode",
      "mobile",
      "ui concept",
    ],
    gallery: mobileScreensGallery("pulse"),
    concept: {
      tagline: "Train with purpose.",
      industry: "Fitness, workout tracking and activity analytics.",
      personality: "Bold, futuristic, disciplined and technical.",
      audience: "Gym enthusiasts, athletes and runners.",
      visualStyle: "Futuristic sports technology, dark mode.",
      palette: [
        { name: "Background", hex: "#080A0A" },
        { name: "Dark surface", hex: "#121614" },
        { name: "Elevated surface", hex: "#191F1B" },
        { name: "Neon lime", hex: "#C8FF36" },
        { name: "Electric blue", hex: "#427BFF" },
        { name: "Text", hex: "#F5F7F2" },
        { name: "Muted text", hex: "#9AA39B" },
      ],
      typography: ["Space Grotesk / Sora", "Inter"],
      specifiedScreens: [
        "Home Dashboard — steps, calories and streak",
        "Workout Discovery",
        "Active Workout — timer, sets and reps",
        "Performance Analytics — charts and personal records",
        "Profile & Goals",
      ],
      fictionalContent: [],
    },
  },
  {
    id: "25",
    slug: "makanmate",
    name: "MakanMate",
    aliases: [],
    legacySlugs: [],
    category: "mobile",
    projectType: "Mobile app design concept",
    status: "mobile-ui-concept",
    shortDescription:
      "Good food, good mood — a playful local food discovery, ordering and delivery app concept.",
    description:
      "A mobile UI design concept for food discovery, restaurants, ordering and delivery. MakanMate combines a playful, friendly, contemporary and local personality with playful modern food branding across five specified screens.",
    statusNote:
      "Mobile UI design concept, not a shipped application or a verified complete Figma file.",
    highlights: [
      "Food commerce",
      "Restaurant discovery",
      "Local branding",
      "Checkout",
      "Delivery tracking",
    ],
    limitations: MOBILE_CONCEPT_LIMITATIONS,
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: null,
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "food",
      "restaurant",
      "delivery",
      "ordering",
      "local",
      "mobile",
      "ui concept",
    ],
    gallery: mobileScreensGallery("makanmate"),
    concept: {
      tagline: "Good food, good mood.",
      industry: "Food discovery, restaurants, ordering and delivery.",
      personality: "Playful, friendly, contemporary and local.",
      audience:
        "Young adults, students, food lovers and local-dish explorers.",
      visualStyle: "Playful modern food branding.",
      palette: [
        { name: "Strawberry pink", hex: "#FF6584" },
        { name: "Deep rose", hex: "#E64D70" },
        { name: "Butter yellow", hex: "#FFE28A" },
        { name: "Fresh mint", hex: "#BCEBD4" },
        { name: "Warm cream", hex: "#FFF9F0" },
        { name: "Cocoa", hex: "#382B2B" },
      ],
      typography: ["Nunito / Plus Jakarta Sans", "Inter"],
      specifiedScreens: [
        "Home & Food Discovery",
        "Discover Restaurants",
        "Food Details — Ayam Gepuk Set",
        "Cart & Checkout",
        "Live Order Tracking — four stages",
      ],
      fictionalContent: [
        "Kak Ina's Kitchen",
        "Wok & Roll",
        "Roti Corner",
        "Sambal Social",
        "Ayam Gepuk Set",
        "Four-stage live order tracking",
      ],
    },
  },
  {
    id: "26",
    slug: "dewdrop",
    name: "Dewdrop",
    aliases: [],
    legacySlugs: [],
    category: "mobile",
    projectType: "Mobile app design concept",
    status: "mobile-ui-concept",
    shortDescription:
      "A little care, every day — a minimal botanical skincare and routine app concept.",
    description:
      "A mobile UI design concept for skincare, beauty e-commerce and routine management. Dewdrop uses a natural, gentle, elegant and refined minimal botanical beauty editorial style across five specified screens.",
    statusNote:
      "Mobile UI design concept, not a shipped application or a verified complete Figma file.",
    highlights: [
      "Beauty branding",
      "Product e-commerce",
      "Routine management",
      "Checkout UX",
    ],
    limitations: MOBILE_CONCEPT_LIMITATIONS,
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: null,
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "skincare",
      "beauty",
      "routine",
      "ecommerce",
      "botanical",
      "mobile",
      "ui concept",
    ],
    gallery: mobileScreensGallery("dewdrop"),
    concept: {
      tagline: "A little care, every day.",
      industry: "Skincare, beauty e-commerce and routine management.",
      personality: "Natural, gentle, elegant and refined.",
      audience:
        "Skincare enthusiasts and young adults building routines.",
      visualStyle: "Minimal botanical beauty editorial.",
      palette: [
        { name: "Sage", hex: "#A8B9A0" },
        { name: "Deep olive", hex: "#465744" },
        { name: "Ivory", hex: "#FAF8F1" },
        { name: "Soft blush", hex: "#E8CFC7" },
        { name: "Oat beige", hex: "#E8DFD2" },
        { name: "Cocoa", hex: "#34352F" },
      ],
      typography: ["DM Serif Display / Playfair Display", "DM Sans"],
      specifiedScreens: [
        "Home & Discover",
        "Shop & Catalogue",
        "Product Details — Gentle Cloud Cleanser",
        "My Routine — AM/PM tabs and progress",
        "Cart & Checkout",
      ],
      fictionalContent: [
        "Gentle Cloud Cleanser — RM49",
        "Dew Barrier Cream — RM69",
        "Morning Dew Serum — RM79",
        "Daily Veil SPF50 — RM59",
        "Soft Reset Toner — RM45",
        "Night Bloom Mask — RM65",
      ],
    },
  },
  {
    id: "27",
    slug: "pocketpal",
    name: "PocketPal",
    aliases: [],
    legacySlugs: [],
    category: "mobile",
    projectType: "Mobile app design concept",
    status: "mobile-ui-concept",
    shortDescription:
      "Make money feel manageable — a friendly budgeting, expenses and savings app concept.",
    description:
      "A mobile UI design concept for personal finance, expense tracking, budgeting and savings. PocketPal uses a friendly, modern, trustworthy and intelligent modern-minimal fintech style across five specified screens.",
    statusNote:
      "Mobile UI design concept, not a shipped application or a verified complete Figma file.",
    highlights: [
      "Fintech dashboards",
      "Expense management",
      "Financial data visualisation",
      "Budgeting",
      "Information architecture",
    ],
    limitations: MOBILE_CONCEPT_LIMITATIONS,
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: null,
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "finance",
      "budgeting",
      "expenses",
      "savings",
      "fintech",
      "mobile",
      "ui concept",
    ],
    gallery: mobileScreensGallery("pocketpal"),
    concept: {
      tagline: "Make money feel manageable.",
      industry:
        "Personal finance, expense tracking, budgeting and savings.",
      personality: "Friendly, modern, trustworthy and intelligent.",
      audience:
        "Students, young professionals and beginner budgeters.",
      visualStyle: "Modern minimal fintech.",
      palette: [
        { name: "Cobalt blue", hex: "#4169E1" },
        { name: "Deep blue", hex: "#2447B8" },
        { name: "Lavender", hex: "#E9E5FF" },
        { name: "Mint", hex: "#C9F2DF" },
        { name: "Pale grey", hex: "#F7F8FC" },
        { name: "Text", hex: "#172033" },
      ],
      typography: ["Inter / Manrope"],
      specifiedScreens: [
        "Home & Financial Overview — donut chart and transactions",
        "Activity & Transactions — filters and date groups",
        "Budgets — five categories and progress bars",
        "Savings Goals — Emergency Fund and Holiday Fund",
        "Profile & Settings",
      ],
      fictionalContent: [
        "Income — RM4,500",
        "Expenses — RM1,865.40",
        "Budget limit — RM2,800",
        "Remaining — RM934.60",
        "Total savings — RM4,050",
      ],
    },
  },
  {
    id: "28",
    slug: "docuflow-ai",
    name: "DocuFlow AI",
    aliases: [],
    legacySlugs: [],
    category: "ai",
    projectType: "AI invoice-processing platform",
    status: "development-in-progress",
    shortDescription:
      "Invoice processing, minus the paperwork — a review-oriented AI extraction platform.",
    description:
      "DocuFlow AI is an invoice-processing platform with private document uploads, account-scoped records, duplicate detection, human approval and a pluggable AI extraction architecture.",
    statusNote:
      "Authentication is live. The AI processing pipeline is still in development and is not shipped.",
    engineeringThesis:
      "AI extracts, human approves. No silent automation.",
    highlights: [
      "Private document uploads",
      "Account-scoped records",
      "Duplicate detection",
      "Human approval",
      "Pluggable AI extraction architecture",
      "Row-level security",
      "Review-oriented processing",
    ],
    limitations: [
      "The full AI processing pipeline is still in development and must not be described as shipped.",
    ],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://docu-flow-ai-flax.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "invoice",
      "documents",
      "ai extraction",
      "human approval",
      "automation",
      "duplicate detection",
    ],
    gallery: desktopMobileGallery("docuflow-ai"),
  },
  {
    id: "29",
    slug: "leadflow",
    name: "LeadFlow",
    aliases: ["Relay"],
    legacySlugs: [],
    category: "ai",
    projectType: "AI lead qualification and routing",
    status: "live-functional-demonstration",
    shortDescription:
      "Inbound that routes itself — the AI classifies, and code scores deterministically.",
    description:
      "LeadFlow is an AI lead qualification and routing demonstration. The model returns discrete categories from a closed enum, and a deterministic scoring rubric maps those categories to a 0–100 score. Relay is the fictional CRM product associated with the demonstration.",
    statusNote:
      "Live functional demonstration. Relay is a fictional CRM portfolio product, not an established commercial deployment.",
    engineeringThesis: "The AI classifies; code scores.",
    highlights: [
      "Closed-enum classification",
      "Deterministic scoring rubric: company fit 30, industry fit 25, intent clarity 25, budget signal 20",
      "Spam is a hard override to zero",
      "Unknown category values fail safely rather than producing invalid scores",
      "Routing: 70 or above qualified / automated response; 30–69 human review; below 30 archived",
      "Groq primary with Gemini fallback",
      "Supabase, Resend, HMAC-cookie admin access, Zod validation and rate limiting",
    ],
    limitations: [
      "Relay is a fictional CRM portfolio product and functional demonstration, not a commercial deployment.",
      "An unused lead-enrichment stub remains in the codebase.",
    ],
    role: [],
    technologies: [
      "Groq",
      "Gemini",
      "Supabase",
      "Resend",
      "Zod",
    ],
    outcomes: [],
    liveUrl: "https://lead-flow-sable.vercel.app/",
    repoUrl: "https://github.com/darvinraj400-ux/LeadFlow",
    caseStudyUrl: "https://lead-flow-sable.vercel.app/case-study",
    figmaUrl: null,
    featured: false,
    keywords: [
      "lead qualification",
      "routing",
      "crm",
      "scoring",
      "automation",
      "relay",
    ],
    gallery: desktopMobileGallery("leadflow"),
  },
  {
    id: "30",
    slug: "supportai",
    name: "SupportAI",
    aliases: ["Nimbus Analytics"],
    legacySlugs: ["support-ai"],
    category: "ai",
    projectType: "FAQ chat widget with RAG and human handoff",
    status: "live-demo",
    shortDescription:
      "A support assistant that answers only from company FAQs and admits when it does not know.",
    description:
      "SupportAI is a FAQ chat widget using retrieval-augmented generation and human handoff. It answers only from a company's FAQs and admits ignorance through an explicit tool call rather than relying on a similarity threshold alone. Nimbus Analytics is the public product identity used for the demonstration.",
    statusNote:
      "Live demo with documented performance and reliability limitations. Do not replace measured results with unverified claims.",
    engineeringThesis:
      "Answer only from a company's FAQs and admit ignorance through an explicit tool call, not merely a similarity threshold.",
    highlights: [
      "Gemini gemini-embedding-001 embeddings at 768 dimensions",
      "Supabase pgvector with the match_faqs RPC",
      "Retrieval threshold 0.5 with the top four matches",
      "Groq streaming with Gemini fallback",
      "Explicit reportNoAnswer tool",
      "Server-authoritative fallback response",
      "Two consecutive no-answers trigger handoff and a handoff form",
      "3D Intelligence Core built with Three.js and React Three Fiber",
      "Lazy loading, WebGL checks, quality tiers and visibility-aware pausing",
    ],
    limitations: [
      "Measured performance was 49.8 FPS, below the earlier 60.2 FPS claim.",
      "No rate limiting on the public chat endpoint.",
      "Concurrent first messages may create duplicate conversations because the session table has no unique constraint.",
      "Some visual feedback timing and first-load issues remain.",
    ],
    role: [],
    technologies: [
      "Gemini",
      "Supabase pgvector",
      "Groq",
      "Three.js",
      "React Three Fiber",
    ],
    outcomes: [],
    liveUrl: "https://support-ai-three-gold.vercel.app/",
    repoUrl: "https://github.com/darvinraj400-ux/AI-Support",
    caseStudyUrl: "https://support-ai-three-gold.vercel.app/case-study",
    figmaUrl: null,
    featured: false,
    keywords: [
      "support",
      "rag",
      "faq",
      "chat",
      "handoff",
      "nimbus analytics",
    ],
    gallery: desktopMobileGallery("supportai"),
  },
  {
    id: "31",
    slug: "slotwise",
    name: "SlotWise",
    aliases: [],
    legacySlugs: [],
    category: "business",
    projectType: "Appointment management for service businesses",
    status: "live-demo",
    shortDescription:
      "Appointment management where booking correctness is enforced below the interface.",
    description:
      "SlotWise is appointment management for service businesses, covering staff scheduling, appointment calendars, customer and service management, and business timezone handling.",
    engineeringThesis:
      "Booking correctness is enforced below the interface, not just by frontend validation.",
    highlights: [
      "Staff scheduling",
      "Appointment calendars",
      "Customer and service management",
      "Business timezone handling",
      "PostgreSQL exclusion constraints prevent overlapping bookings",
      "Database-enforced ownership and booking rules",
    ],
    limitations: [],
    role: [],
    technologies: ["PostgreSQL"],
    outcomes: [],
    liveUrl: "https://slot-wise-five.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "appointments",
      "booking",
      "scheduling",
      "staff",
      "service business",
    ],
    gallery: desktopMobileGallery("slotwise"),
  },
  {
    id: "32",
    slug: "stockpilot",
    name: "StockPilot",
    aliases: [],
    legacySlugs: [],
    category: "business",
    projectType: "Inventory management for small businesses",
    status: "live-demo",
    shortDescription:
      "Inventory management built on an auditable stock-movement ledger.",
    description:
      "StockPilot is inventory management for small businesses, covering product catalogues, supplier management, stock-in, stock-out and adjustments, auditable inventory movement history and low-stock reporting.",
    engineeringThesis:
      "Stock quantities cannot be directly edited by the client. Every change passes through a recorded stock-movement process.",
    highlights: [
      "Product catalogues",
      "Supplier management",
      "Stock-in, stock-out and adjustments",
      "Auditable inventory movement history",
      "Low-stock reporting",
      "Atomic database transactions",
      "Protection against unauthorised quantity changes",
    ],
    limitations: [],
    role: [],
    technologies: [],
    outcomes: [],
    liveUrl: "https://stock-pilot-lilac-omega.vercel.app/",
    repoUrl: null,
    caseStudyUrl: null,
    figmaUrl: null,
    featured: false,
    keywords: [
      "inventory",
      "stock",
      "suppliers",
      "small business",
      "audit",
    ],
    gallery: desktopMobileGallery("stockpilot"),
  },
  {
    id: "33",
    slug: "fade-and-co",
    name: "Fade & Co.",
    aliases: [],
    legacySlugs: [],
    category: "business",
    projectType: "Multi-barber booking platform",
    status: "live-demo",
    shortDescription:
      "A multi-barber booking platform where AI parses natural language and the database enforces race safety.",
    description:
      "Fade & Co. is a multi-barber booking platform with natural-language booking, a four-step booking wizard and calendar export. Overlapping appointments for the same barber cannot both commit.",
    statusNote: "Live demo with documented gaps.",
    engineeringThesis: "AI parses; the database enforces.",
    highlights: [
      "PostgreSQL exclusion constraint using btree_gist and tstzrange",
      "Overlapping appointments for the same barber cannot both commit",
      "23P01 maps to a friendly 409 slot_taken response",
      "Natural-language booking uses Groq with Gemini fallback",
      "Pure slot engine with a 15-minute scheduling grid",
      "60-minute minimum notice",
      "Half-open [start, end) time semantics",
      "Four-step booking wizard",
      "RFC 5545 .ics calendar export",
      "Security headers",
      "HMAC-cookie admin access",
    ],
    limitations: [
      "The project README still contains demo and case-study placeholders.",
      "Reference-code generation has an acknowledged race window.",
      "Automated test coverage is limited to the concurrency test script.",
    ],
    role: [],
    technologies: ["PostgreSQL", "Groq", "Gemini"],
    outcomes: [],
    liveUrl: "https://fade-and-co-psi.vercel.app/",
    repoUrl: "https://github.com/darvinraj400-ux/FadeAndCo",
    caseStudyUrl: "https://fade-and-co-psi.vercel.app/case-study",
    figmaUrl: null,
    featured: false,
    keywords: [
      "barber",
      "booking",
      "scheduling",
      "natural language",
      "race safety",
    ],
    gallery: desktopMobileGallery("fade-and-co"),
  },
];

/**
 * Preserved but intentionally excluded from PROJECTS and every count.
 * ShelfSenseAI is a polytechnic final-year project (FYP), kept available
 * for possible independent academic presentation.
 */
export const ACADEMIC_PROJECTS = [
  {
    slug: "shelfsenseai",
    name: "ShelfSenseAI",
    oneLiner:
      "Retail pricing intelligence for Malaysian kedai runcit. AI recommends, guardrails enforce, human approves.",
    role: "Team project — 3-person FYP",
    repoUrl: "https://github.com/darvinraj400-ux/ShelfSenseAI",
    featured: true,
    exclusionNote:
      "Academic FYP. Excluded from the 33-project collection, landing spiral, /projects archive, filters and project counts.",
  },
] as const;

export const PROJECT_COUNT = PROJECTS.length;

export const PROJECT_CATEGORY_COUNTS = PROJECT_CATEGORIES.map((category) => ({
  ...category,
  count: PROJECTS.filter((project) => project.category === category.id).length,
}));

export function getProjectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

/** URL-safe form of a human alias, e.g. "Luma Café" -> "luma-cafe". */
export function aliasSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProjectNeighbours(slug: string): {
  previous: Project | null;
  next: Project | null;
} {
  const index = PROJECTS.findIndex((project) => project.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? PROJECTS[index - 1] : null,
    next: index < PROJECTS.length - 1 ? PROJECTS[index + 1] : null,
  };
}

/**
 * Mechanical reconciliation checks. Returns an empty array when the data
 * satisfies the authoritative inventory. Run before generating assets.
 */
export function validateProjectInventory(): string[] {
  const issues: string[] = [];
  const expectedCategoryCounts: Record<ProjectCategoryId, number> = {
    website: 22,
    mobile: 5,
    ai: 3,
    business: 3,
  };

  if (PROJECTS.length !== 33) {
    issues.push(`Expected 33 projects, found ${PROJECTS.length}.`);
  }

  for (const category of PROJECT_CATEGORIES) {
    const actual = PROJECTS.filter(
      (project) => project.category === category.id
    ).length;
    if (actual !== expectedCategoryCounts[category.id]) {
      issues.push(
        `${category.label}: expected ${expectedCategoryCounts[category.id]}, found ${actual}.`
      );
    }
  }

  const ids = new Set<string>();
  const slugs = new Set<string>();
  const names = new Set<string>();

  for (const project of PROJECTS) {
    if (ids.has(project.id)) issues.push(`Duplicate id: ${project.id}.`);
    ids.add(project.id);

    if (slugs.has(project.slug)) {
      issues.push(`Duplicate slug: ${project.slug}.`);
    }
    slugs.add(project.slug);

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
      issues.push(`Slug is not lowercase kebab-case: ${project.slug}.`);
    }

    if (names.has(project.name)) {
      issues.push(`Duplicate project name: ${project.name}.`);
    }
    names.add(project.name);

    if (
      project.slug === "shelfsenseai" ||
      ACADEMIC_PROJECTS.some((academic) => academic.slug === project.slug)
    ) {
      issues.push(
        `${project.slug} is an excluded academic project and must not be in PROJECTS.`
      );
    }

    if (
      project.gallery.cover !==
      `/images/projects/${project.slug}/cover.webp`
    ) {
      issues.push(`${project.slug}: cover path does not match its slug.`);
    }

    if (project.gallery.layout === "desktop-mobile") {
      if (
        project.gallery.desktop.length !== 4 ||
        project.gallery.mobile.length !== 2 ||
        project.gallery.screens.length !== 0 ||
        project.gallery.optionalScreens.length !== 0
      ) {
        issues.push(
          `${project.slug}: desktop-mobile gallery must contain 4 desktop, 2 mobile and 0 screen slots.`
        );
      }
    }

    if (project.gallery.layout === "mobile-screens") {
      if (
        project.gallery.desktop.length !== 0 ||
        project.gallery.mobile.length !== 0 ||
        project.gallery.screens.length !== 5 ||
        project.gallery.optionalScreens.length !== 1
      ) {
        issues.push(
          `${project.slug}: mobile-screens gallery must contain 5 specified screens and 1 optional sixth slot.`
        );
      }
    }

    if (project.liveUrl && !project.liveUrl.startsWith("https://")) {
      issues.push(`${project.slug}: live URL must use https.`);
    }

    if (project.category !== "mobile" && !project.liveUrl) {
      issues.push(`${project.slug}: no supplied live URL.`);
    }

    if (project.category === "mobile" && project.liveUrl) {
      issues.push(`${project.slug}: mobile concept must not claim a live URL.`);
    }
  }

  const allAliases = new Map<string, string>();
  for (const project of PROJECTS) {
    for (const alias of project.aliases) {
      const key = alias.toLowerCase();
      const existing = allAliases.get(key);
      if (existing && existing !== project.slug) {
        issues.push(
          `Alias "${alias}" is shared by ${existing} and ${project.slug}.`
        );
      }
      allAliases.set(key, project.slug);
    }
  }

  return issues;
}
