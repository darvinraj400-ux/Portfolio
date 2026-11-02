import type { Metadata } from "next";
import Link from "next/link";
import ProjectCardPrototype from "@/components/prototype/ProjectCardPrototype";
import {
  PROJECT_CATEGORIES,
  PROJECT_COUNT,
  PROJECTS,
} from "@/lib/projects";

export const metadata: Metadata = {
  title: "Project card study",
  description:
    "Single-card 3D prototype for the DARVINN STUDIO project collection.",
  robots: { index: false, follow: false },
};

const TITLE_LINES = ["Pastel", "Aesthetic Theme"];

export default async function PrototypeCardPage({
  searchParams,
}: {
  searchParams: Promise<{ fallback?: string | string[] }>;
}) {
  const params = await searchParams;
  const forceFallback = params.fallback === "1";
  const project = PROJECTS[0];
  const category =
    PROJECT_CATEGORIES.find((entry) => entry.id === project.category)?.label ??
    project.category;

  return (
    <main id="main-content" className="shell pb-24 pt-12 sm:pt-16">
      <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
        <p className="mono-meta">Prototype / Stage 1C</p>
        <Link
          href="/"
          className="mono-meta text-ash transition-colors hover:text-paper"
        >
          DARVINN STUDIO
        </Link>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <p className="mono-meta text-ash">Single-card study</p>
          <h1 className="display mt-4 text-[clamp(2.6rem,6vw,4.2rem)] text-paper">
            One card, before the spiral.
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-silver">
            A physical object study for the 33-project collection. Dark glass,
            a thin silver rim and printed typography, suspended in black. The
            homepage is untouched; this route exists only for review.
          </p>

          <dl className="mt-10 border-t border-line">
            <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
              <dt className="mono-meta text-ash">Object</dt>
              <dd className="text-[13px] text-silver">
                {project.id} / {PROJECT_COUNT}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
              <dt className="mono-meta text-ash">Renderer</dt>
              <dd className="text-[13px] text-silver">
                React Three Fiber, lazy-loaded
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
              <dt className="mono-meta text-ash">Interaction</dt>
              <dd className="text-[13px] text-silver">
                Hover, keyboard, selection
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
              <dt className="mono-meta text-ash">Fallback</dt>
              <dd className="text-[13px] text-silver">Static DOM card</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            <Link
              href={
                forceFallback ? "/prototype/card" : "/prototype/card?fallback=1"
              }
              className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
            >
              {forceFallback ? "Load the WebGL scene" : "View the static fallback"}
            </Link>
            <Link
              href="/projects"
              className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
            >
              Project archive
            </Link>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="border border-line bg-black">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="mono-meta text-ash">Live object</p>
              <p className="mono-meta text-ash">
                {project.id} / {PROJECT_COUNT}
              </p>
            </div>
            <div className="px-5 py-10 sm:px-12 sm:py-12">
              <ProjectCardPrototype
                index={project.id}
                title={project.name}
                titleLines={TITLE_LINES}
                category={category}
                total={PROJECT_COUNT}
                forceFallback={forceFallback}
              />
            </div>
          </div>
          <p className="mono-meta mt-4 text-ash">
            Prototype route. Not linked from the site navigation.
          </p>
        </div>
      </div>
    </main>
  );
}
