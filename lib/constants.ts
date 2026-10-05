export const SITE = {
  name: "Darvin Raj",
  domain: "https://darvinn.xyz",
  positioning: "I build AI that knows its limits.",
  email: "darvinraj400@gmail.com",
  github: "https://github.com/darvinraj400-ux",
} as const;

export type Project = {
  slug: string;
  name: string;
  oneLiner: string;
  role?: string;
  link: string;
  caseStudy?: string;
  repo?: string;
  featured?: boolean;
  palette: "shelfsense" | "supportai" | "leadflow" | "fadeandco";
};

export const PROJECTS: Project[] = [
  {
    slug: "shelfsenseai",
    name: "ShelfSenseAI",
    oneLiner:
      "Retail pricing intelligence for Malaysian kedai runcit. AI recommends, guardrails enforce, human approves.",
    role: "Team project — 3-person FYP",
    link: "https://github.com/darvinraj400-ux/ShelfSenseAI",
    featured: true,
    palette: "shelfsense",
  },
  {
    slug: "support-ai",
    name: "SupportAI",
    oneLiner:
      "Drop-in AI support widget that answers from your own FAQs and hands off to a human when unsure.",
    link: "https://support-ai-three-gold.vercel.app",
    caseStudy: "https://support-ai-three-gold.vercel.app/case-study",
    repo: "https://github.com/darvinraj400-ux/AI-Support",
    palette: "supportai",
  },
  {
    slug: "leadflow",
    name: "LeadFlow",
    oneLiner:
      "AI lead qualification. The AI classifies, the rubric scores deterministically.",
    link: "https://lead-flow-sable.vercel.app",
    caseStudy: "https://lead-flow-sable.vercel.app/case-study",
    repo: "https://github.com/darvinraj400-ux/LeadFlow",
    palette: "leadflow",
  },
  {
    slug: "fade-and-co",
    name: "Fade & Co.",
    oneLiner:
      "Multi-barber booking with a race-safe scheduler and natural-language input.",
    link: "https://fade-and-co-psi.vercel.app",
    caseStudy: "https://fade-and-co-psi.vercel.app/case-study",
    repo: "https://github.com/darvinraj400-ux/FadeAndCo",
    palette: "fadeandco",
  },
];

export const NAV_LINKS = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

/** Resolved once so Featured and Products can never render the same entry. */
export const FEATURED_PROJECT =
  PROJECTS.find((p) => p.featured) ?? PROJECTS[0];

export const PRODUCT_PROJECTS = PROJECTS.filter((p) => p !== FEATURED_PROJECT);
