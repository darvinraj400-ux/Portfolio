import type { Metadata } from "next";
import Link from "next/link";
import { existsSync } from "node:fs";
import path from "node:path";
import ArchiveExplorer, {
  type ArchiveProject,
} from "@/components/archive/ArchiveExplorer";
import ScrambleText from "@/components/motion/ScrambleText";
import {
  PROJECT_CATEGORIES,
  PROJECT_CATEGORY_COUNTS,
  PROJECT_COUNT,
  PROJECTS,
} from "@/lib/projects";

const description = `Selected work by Darvin Raj — ${PROJECT_COUNT} projects across website design, mobile design, AI and automation, and business systems.`;

export const metadata: Metadata = {
  title: "Selected Work",
  description,
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Selected Work — DARVINN STUDIO",
    description,
    url: "/projects",
    type: "website",
  },
};

const pad = (value: number) => String(value).padStart(2, "0");

const labelByCategory = new Map(
  PROJECT_CATEGORY_COUNTS.map((entry) => [entry.id, entry.label]),
);

const coverExists = (url: string) =>
  existsSync(path.join(process.cwd(), "public", url.replace(/^\//, "")));

export default function ProjectsPage() {
  const projects: ArchiveProject[] = PROJECTS.map((project) => ({
    id: project.id,
    slug: project.slug,
    name: project.name,
    category: project.category,
    categoryLabel: labelByCategory.get(project.category) ?? project.category,
    projectType: project.projectType,
    shortDescription: project.shortDescription,
    description: project.description,
    technologies: project.technologies,
    keywords: project.keywords,
    aliases: project.aliases,
    legacySlugs: project.legacySlugs,
    cover: project.gallery.cover,
    hasCover: coverExists(project.gallery.cover),
  }));

  const categories = PROJECT_CATEGORIES.map((entry) => ({
    id: entry.id,
    label: entry.label,
  }));

  return (
    <main id="main-content">
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden="true"
          className="studio-grid pointer-events-none absolute inset-0 -z-10"
        />
        <div className="shell grid gap-10 pb-14 pt-14 lg:grid-cols-12 lg:items-end lg:gap-10 lg:pb-20 lg:pt-20">
          <div className="lg:col-span-8">
            <ScrambleText
              as="p"
              className="plate-meta-1 mono-meta text-ash"
              text={`Selected work / ${PROJECT_COUNT} projects`}
              level="micro"
              trigger="view"
            />
            <span
              aria-hidden="true"
              className="plate-route-rule mt-4 block h-px w-full bg-line-strong"
            />
            <h1 className="display mt-6 max-w-3xl text-[clamp(2.5rem,6.4vw,5rem)] uppercase">
              <span className="plate-title-inner">
                <ScrambleText
                  text="Selected Work"
                  level="headline"
                  trigger="view"
                  delay={60}
                />
              </span>
            </h1>
            <ScrambleText
              as="p"
              className="plate-meta-2 mt-7 max-w-xl text-base leading-relaxed text-silver"
              text="Websites, digital products, AI experiments and business systems — spanning design concepts, functional demonstrations and deployed work."
              level="body"
              trigger="view"
              delay={120}
            />
          </div>

          <div className="lg:col-span-4 lg:justify-self-end lg:pb-1 lg:text-right">
            <p className="display text-[clamp(4rem,8vw,6.5rem)] leading-none tabular-nums text-paper">
              {PROJECT_COUNT}
            </p>
            <ScrambleText
              as="p"
              className="mono-meta mt-3 text-ash"
              text={`Selected projects / ${PROJECT_CATEGORIES.length} disciplines`}
              level="micro"
              trigger="view"
              delay={160}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="disciplines-heading" className="shell pt-12 lg:pt-16">
        <div className="flex items-baseline justify-between gap-6 border-b border-line pb-3">
          <h2
            id="disciplines-heading"
            className="text-sm font-medium tracking-tight text-silver"
          >
            <ScrambleText text="By discipline" level="heading" trigger="view" />
          </h2>
          <ScrambleText
            as="p"
            className="mono-meta text-ash"
            text={`${PROJECT_COUNT} total`}
            level="micro"
            trigger="view"
            delay={100}
          />
        </div>

        <dl className="grid grid-cols-2 gap-px border-b border-line bg-line lg:grid-cols-4">
          {PROJECT_CATEGORY_COUNTS.map((entry, index) => (
            <div key={entry.id} className="bg-background px-4 py-6 sm:px-6">
              <dt className="mono-meta text-ash">
                <ScrambleText
                  text={entry.label}
                  level="micro"
                  trigger="view"
                  delay={index * 50}
                />
              </dt>
              <dd className="mt-3 font-mono text-3xl tabular-nums text-paper">
                {pad(entry.count)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="archive-heading" className="shell pb-20 pt-12 lg:pt-14">
        <h2 id="archive-heading" className="sr-only">
          Browse the archive
        </h2>
        <ArchiveExplorer
          projects={projects}
          categories={categories}
          total={PROJECT_COUNT}
        />
      </section>

      <section className="shell pb-24">
        <div className="flex flex-wrap items-baseline justify-between gap-6 border-t border-line pt-8">
          <ScrambleText
            as="p"
            className="max-w-lg text-sm leading-relaxed text-silver"
            text={`${PROJECT_COUNT} selected projects across ${PROJECT_CATEGORIES.length} disciplines — spanning design concepts, functional demonstrations and deployed work.`}
            level="body"
            trigger="view"
            delay={80}
          />
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <Link
              href="/"
              className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
            >
              <ScrambleText
                text="Homepage"
                level="micro"
                trigger="view"
                delay={120}
              />
            </Link>
            <Link
              href="/#contact"
              className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
            >
              <ScrambleText
                text="Start a project"
                level="micro"
                trigger="view"
                delay={160}
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
