"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import ScrambleText from "@/components/motion/ScrambleText";
import { cn } from "@/lib/utils";
import ProjectPlate from "./ProjectPlate";

export type ArchiveProject = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  projectType: string;
  shortDescription: string;
  description: string;
  technologies: string[];
  keywords: string[];
  aliases: string[];
  legacySlugs: string[];
  cover: string;
  hasCover: boolean;
};

type CategoryFilter = { id: string; label: string };

type Props = {
  projects: ArchiveProject[];
  categories: CategoryFilter[];
  total: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

function Cover({
  project,
  sizes,
}: {
  project: ArchiveProject;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!project.hasCover || failed) return <ProjectPlate id={project.id} />;

  return (
    <Image
      src={project.cover}
      alt={`${project.name} — ${project.categoryLabel}`}
      fill
      sizes={sizes}
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function ArchiveExplorer({
  projects,
  categories,
  total,
}: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [ready, setReady] = useState(false);
  const initialEntry = useRef(true);

  useEffect(() => {
    initialEntry.current = false;
  }, []);

  const categoryIds = useMemo(
    () => new Set(categories.map((entry) => entry.id)),
    [categories],
  );

  const haystacks = useMemo(
    () =>
      new Map(
        projects.map((project) => [
          project.slug,
          [
            project.name,
            project.slug,
            ...project.aliases,
            ...project.legacySlugs,
            project.categoryLabel,
            project.projectType,
            project.shortDescription,
            project.description,
            ...project.technologies,
            ...project.keywords,
          ]
            .join(" ")
            .toLowerCase(),
        ]),
      ),
    [projects],
  );

  useEffect(() => {
    const apply = () => {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("category");
      setCategory(
        requested && categoryIds.has(requested) ? requested : "all",
      );
      setQuery(params.get("search") ?? "");
    };

    apply();
    setReady(true);
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [categoryIds]);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    const text = query.trim();
    if (text) params.set("search", text);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      search
        ? `${window.location.pathname}?${search}`
        : window.location.pathname,
    );
  }, [ready, category, query]);

  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const matching = tokens.length
    ? projects.filter((project) => {
        const haystack = haystacks.get(project.slug) ?? "";
        return tokens.every((token) => haystack.includes(token));
      })
    : projects;

  const counts: Record<string, number> = { all: matching.length };
  for (const project of matching) {
    counts[project.category] = (counts[project.category] ?? 0) + 1;
  }

  const visible =
    category === "all"
      ? matching
      : matching.filter((project) => project.category === category);

  const filtering = query.trim().length > 0 || category !== "all";

  const reset = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <div>
      <div className="border-y border-line py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-sm">
            <label htmlFor="archive-search" className="sr-only">
              Search selected work
            </label>
            <input
              id="archive-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search selected work..."
              autoComplete="off"
              enterKeyHint="search"
              className="w-full border-0 border-b border-line bg-transparent py-3 pr-10 text-base text-paper transition-colors placeholder:text-ash focus:border-line-strong [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-0 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-ash transition-colors hover:text-paper"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-5">
            <p className="mono-meta" role="status" aria-live="polite">
              <span key={visible.length} className="archive-count">
                {pad(visible.length)}
              </span>{" "}
              of {pad(total)} projects
            </p>
            {filtering ? (
              <button
                type="button"
                onClick={reset}
                className="mono-meta link-underline pb-0.5 text-silver transition-colors hover:text-paper"
              >
                <ScrambleText
                  text="Reset filters"
                  level="micro"
                  trigger="mount"
                />
              </button>
            ) : null}
          </div>
        </div>

        <div
          role="group"
          aria-label="Filter by category"
          className="mt-6 flex flex-wrap gap-x-6 gap-y-2"
        >
          {[{ id: "all", label: "All Projects" }, ...categories].map(
            (entry, index) => {
              const active = category === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    if (entry.id === category) return;
                    setCategory(entry.id);
                  }}
                  className={cn(
                    "inline-flex items-baseline gap-1.5 border-b pb-1 text-[13px] transition-colors",
                    active
                      ? "border-paper text-paper"
                      : "border-transparent text-ash hover:text-silver",
                  )}
                >
                  <ScrambleText
                    text={entry.label}
                    level="micro"
                    trigger="view"
                    delay={index * 30}
                  />
                  <span className="font-mono text-[10px] tabular-nums text-ash">
                    {pad(counts[entry.id] ?? 0)}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      {visible.length > 0 ? (
        <ul
          className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map((project, index) => (
            <li
              key={project.slug}
              className="archive-card"
              style={
                initialEntry.current
                  ? { animationDelay: `${Math.min(index * 8, 240)}ms` }
                  : undefined
              }
            >
              <article
                data-project-slug={project.slug}
                className="group relative flex flex-col"
              >
                <Link
                  href={`/work/${project.slug}`}
                  aria-label={`${project.id}, ${project.name}, ${project.categoryLabel} — open project page`}
                  className="absolute inset-0 z-10"
                />

                <div className="relative aspect-[4/3] overflow-hidden border border-line bg-surface transition-colors duration-300 group-hover:border-line-strong">
                  <div className="absolute inset-0 transition-transform duration-500 ease-out motion-reduce:group-hover:scale-100 group-hover:scale-[1.03]">
                    <Cover
                      project={project}
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-4">
                  <span className="mono-meta text-ash transition-colors group-hover:text-silver">
                    {project.id}
                  </span>
                  <span className="mono-meta text-right text-ash">
                    <ScrambleText
                      text={project.categoryLabel}
                      level="micro"
                      trigger="view"
                    />
                  </span>
                </div>

                <h3 className="mt-2 text-base font-medium tracking-tight text-paper sm:text-lg">
                  <ScrambleText
                    className="bg-gradient-to-r from-paper to-paper bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]"
                    text={project.name}
                    level="heading"
                    trigger="view"
                    delay={40}
                  />
                </h3>
                <ScrambleText
                  as="p"
                  className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-silver"
                  text={project.shortDescription}
                  level="body"
                  trigger="view"
                  delay={80}
                />
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 border border-line bg-surface px-6 py-20 text-center sm:py-28">
          <ScrambleText
            as="p"
            className="mono-meta uppercase tracking-[0.2em] text-ash"
            text="No matches found"
            level="heading"
            trigger="mount"
          />
          <ScrambleText
            as="p"
            className="mt-3 text-lg tracking-tight text-paper"
            text="Try another keyword or reset your filters."
            level="body"
            trigger="mount"
            delay={60}
          />
          <button
            type="button"
            onClick={reset}
            className="mono-meta mt-6 border border-line-strong px-4 py-2.5 text-silver transition-colors hover:border-paper hover:text-paper"
          >
            <ScrambleText
              text="Reset filters"
              level="micro"
              trigger="mount"
              delay={120}
            />
          </button>
        </div>
      )}
    </div>
  );
}
