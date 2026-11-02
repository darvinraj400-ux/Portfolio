import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import ScrambleText from "@/components/motion/ScrambleText";
import ProjectVisual from "./ProjectVisual";
import GalleryTrigger from "./gallery/GalleryTrigger";
import ProjectGallery from "./gallery/ProjectGallery";
import type { GalleryImage } from "./gallery/types";
import {
  PROJECT_CATEGORY_COUNTS,
  PROJECT_COUNT,
  PROJECT_STATUS_LABELS,
  type Project,
} from "@/lib/projects";
import { cn } from "@/lib/utils";

export type ImageAvailability = {
  cover: boolean;
  desktop: boolean[];
  mobile: boolean[];
  screens: boolean[];
  optional: boolean;
};

type Props = {
  project: Project;
  images: ImageAvailability;
  previous: Project | null;
  next: Project | null;
};

const pad = (value: number) => String(value).padStart(2, "0");

function SectionHead({
  id,
  title,
  meta,
}: {
  id: string;
  title: string;
  meta?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line pb-3">
      <h2
        id={id}
        className="text-sm font-medium tracking-tight text-silver"
      >
        <ScrambleText text={title} level="heading" trigger="view" />
      </h2>
      {meta ? (
        <ScrambleText
          as="p"
          className="mono-meta text-ash"
          text={meta}
          level="micro"
          trigger="view"
          delay={40}
        />
      ) : null}
    </div>
  );
}

function MetaRow({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3">
      <dt className="mono-meta shrink-0 text-ash">
        <ScrambleText text={term} level="micro" trigger="view" />
      </dt>
      <dd className="text-right text-[13px] leading-relaxed text-silver">
        {children}
      </dd>
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="mono-meta link-underline inline-flex items-center gap-1.5 pb-1 text-silver transition-colors hover:text-paper"
    >
      <ScrambleText text={label} level="micro" trigger="view" />
      <ArrowUpRight className="size-3" aria-hidden="true" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function Neighbour({
  project,
  direction,
}: {
  project: Project;
  direction: "previous" | "next";
}) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/work/${project.slug}`}
      className={cn(
        "group flex flex-1 flex-col gap-1.5 py-2",
        isNext && "sm:items-end sm:text-right",
      )}
    >
      <span className="mono-meta flex items-center gap-2 text-ash">
        {isNext ? null : <ArrowLeft className="size-3.5" aria-hidden="true" />}
        <ScrambleText
          text={isNext ? "Next project" : "Previous project"}
          level="micro"
          trigger="view"
        />
        {isNext ? <ArrowRight className="size-3.5" aria-hidden="true" /> : null}
      </span>
      <span className="text-lg font-medium tracking-tight text-paper">
        <ScrambleText
          className="bg-gradient-to-r from-paper to-paper bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]"
          text={project.name}
          level="heading"
          trigger="view"
          delay={40}
        />
      </span>
      <span className="mono-meta text-ash">
        Project {project.id} / {pad(PROJECT_COUNT)}
      </span>
    </Link>
  );
}

export default function ProjectDetail({
  project,
  images,
  previous,
  next,
}: Props) {
  const categoryLabel =
    PROJECT_CATEGORY_COUNTS.find((entry) => entry.id === project.category)
      ?.label ?? project.category;
  const statusLabel = PROJECT_STATUS_LABELS[project.status];
  const concept = project.concept;
  const gallery = project.gallery;
  const isMobileConcept = gallery.layout === "mobile-screens";

  const suppliedScreens =
    images.screens.filter(Boolean).length + (images.optional ? 1 : 0);
  const hasLinks = Boolean(
    project.liveUrl || project.caseStudyUrl || project.repoUrl || project.figmaUrl,
  );

  const galleryImages: GalleryImage[] = [];
  const galleryIndex = new Map<string, number>();
  const portraitSizes = "(min-width: 768px) 40vw, 85vw";
  const registerImage = (
    src: string,
    alt: string,
    caption: string,
    sizes: string,
  ) => {
    galleryIndex.set(src, galleryImages.length);
    galleryImages.push({ src, alt, caption, sizes });
  };

  if (isMobileConcept) {
    gallery.screens.forEach((src, index) => {
      if (!images.screens[index]) return;
      const screenName = concept?.specifiedScreens[index];
      registerImage(
        src,
        `${project.name} — screen ${pad(index + 1)}${
          screenName ? `, ${screenName}` : ""
        }`,
        `${pad(index + 1)} — ${screenName ?? `Screen ${pad(index + 1)}`}`,
        portraitSizes,
      );
    });
    if (images.optional && gallery.optionalScreens[0]) {
      registerImage(
        gallery.optionalScreens[0],
        `${project.name} — optional screen 06`,
        "06 — Optional screen",
        portraitSizes,
      );
    }
  } else {
    gallery.desktop.forEach((src, index) => {
      if (!images.desktop[index]) return;
      registerImage(
        src,
        `${project.name} — desktop interface ${pad(index + 1)}`,
        `Desktop ${pad(index + 1)}`,
        "100vw",
      );
    });
    gallery.mobile.forEach((src, index) => {
      if (!images.mobile[index]) return;
      registerImage(
        src,
        `${project.name} — mobile interface ${pad(index + 1)}`,
        `Mobile ${pad(index + 1)}`,
        portraitSizes,
      );
    });
  }

  const triggerFor = (src: string, alt: string) => {
    const index = galleryIndex.get(src);
    return index === undefined ? undefined : (
      <GalleryTrigger index={index} label={alt} />
    );
  };

  return (
    <main id="main-content">
      <article className="shell pb-24">
        <nav aria-label="Breadcrumb" className="pt-8">
          <ol className="mono-meta flex flex-wrap items-center gap-x-3 gap-y-1 text-ash">
            <li>
              <Link href="/" className="transition-colors hover:text-paper">
                <ScrambleText
                  text="Home"
                  level="micro"
                  trigger="view"
                />
              </Link>
            </li>
            <li aria-hidden="true" className="text-graphite">
              /
            </li>
            <li>
              <Link
                href="/projects"
                className="transition-colors hover:text-paper"
              >
                <ScrambleText
                  text="Projects"
                  level="micro"
                  trigger="view"
                  delay={40}
                />
              </Link>
            </li>
            <li aria-hidden="true" className="text-graphite">
              /
            </li>
            <li aria-current="page" className="text-silver">
              <ScrambleText
                text={project.name}
                level="micro"
                trigger="view"
                delay={80}
              />
            </li>
          </ol>
        </nav>

        <header className="border-b border-line py-10 lg:py-14">
          <ScrambleText
            as="p"
            className="plate-meta-1 mono-meta text-ash"
            text={`Project ${project.id} / ${pad(PROJECT_COUNT)}`}
            level="micro"
            trigger="view"
          />
          <h1 className="display mt-5 max-w-5xl text-[clamp(2.6rem,6vw,4.75rem)] uppercase">
            <span className="plate-title-inner">
              <ScrambleText
                text={project.name}
                level="headline"
                trigger="view"
                delay={60}
              />
            </span>
          </h1>
          <ScrambleText
            as="p"
            className="plate-meta-2 mono-meta mt-5 text-silver"
            text={project.projectType}
            level="micro"
            trigger="view"
            delay={100}
          />
          <ScrambleText
            as="p"
            className="plate-meta-3 mt-6 max-w-2xl text-lg leading-relaxed text-silver"
            text={project.shortDescription}
            level="body"
            trigger="view"
            delay={140}
          />

          {project.specialInstruction ? (
            <p className="mt-6 max-w-2xl border-l border-line-strong pl-4 text-sm leading-relaxed text-silver">
              <span className="mono-meta block text-ash">
                <ScrambleText
                  text="Entry note"
                  level="micro"
                  trigger="view"
                  delay={160}
                />
              </span>
              <span className="mt-1 block">
                <ScrambleText
                  text={project.specialInstruction}
                  level="body"
                  trigger="view"
                  delay={180}
                />
              </span>
            </p>
          ) : null}

          {hasLinks ? (
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mono-meta inline-flex items-center gap-2 border border-line-strong px-4 py-2.5 text-paper transition-colors hover:border-paper hover:bg-paper hover:text-background"
                >
                  <ScrambleText
                    text={
                      project.status === "development-in-progress"
                        ? "Open preview"
                        : "Open demo"
                    }
                    level="micro"
                    trigger="view"
                    delay={200}
                  />
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : null}
              {project.caseStudyUrl ? (
                <ExternalLink
                  href={project.caseStudyUrl}
                  label="Case study"
                />
              ) : null}
              {project.repoUrl ? (
                <ExternalLink href={project.repoUrl} label="Repository" />
              ) : null}
              {project.figmaUrl ? (
                <ExternalLink href={project.figmaUrl} label="Figma" />
              ) : null}
            </div>
          ) : null}
        </header>

        <section aria-label="Project cover" className="pt-10 lg:pt-12">
          <div className="relative">
            <ProjectVisual
              projectId={project.id}
              src={gallery.cover}
              exists={images.cover}
              alt={`${project.name} — ${categoryLabel} project cover`}
              aspect="hero"
              sizes="(min-width: 1280px) 1152px, 100vw"
              priority={images.cover}
              caption={
                images.cover
                  ? undefined
                  : "Abstract placeholder — no cover image supplied. Not a screenshot."
              }
            />
            {images.cover ? (
              <span aria-hidden="true" className="plate-cover-shutter" />
            ) : null}
          </div>
        </section>

        <ProjectGallery
          images={galleryImages}
          projectName={project.name}
          collectionLabel={categoryLabel}
        >
        <section aria-labelledby="gallery-heading" className="mt-16">
          <SectionHead
            id="gallery-heading"
            title={isMobileConcept ? "Screens" : "Interface"}
            meta={
              isMobileConcept
                ? images.optional
                  ? "05 screens / optional 06"
                  : "05 screens"
                : "04 desktop / 02 mobile"
            }
          />

          {isMobileConcept ? (
            suppliedScreens === 0 ? (
              <ScrambleText
                as="p"
                className="mono-meta mt-4 max-w-xl leading-relaxed text-ash"
                text="Screen imagery is pending for this project. The panels below reserve the layout and are abstract placeholders, not screenshots."
                level="body"
                trigger="view"
              />
            ) : null
          ) : (
            <ScrambleText
              as="p"
              className="mono-meta mt-4 max-w-xl leading-relaxed text-ash"
              text={
                images.desktop.some(Boolean) || images.mobile.some(Boolean)
                  ? "Slots marked pending have no supplied image yet."
                  : "Interface imagery is pending for this project. The panels below reserve the layout and are abstract placeholders, not screenshots."
              }
              level="body"
              trigger="view"
            />
          )}

          {isMobileConcept ? (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {gallery.screens.map((src, index) => {
                const exists = Boolean(images.screens[index]);
                const screenName = concept?.specifiedScreens[index];
                const alt = `${project.name} — screen ${pad(index + 1)}${
                  screenName ? `, ${screenName}` : ""
                }`;
                return (
                  <ProjectVisual
                    key={src}
                    projectId={project.id}
                    src={src}
                    exists={exists}
                    alt={alt}
                    aspect="portrait"
                    sizes="(min-width: 1024px) 214px, (min-width: 640px) 30vw, 45vw"
                    seed={index + 1}
                    trigger={exists ? triggerFor(src, alt) : undefined}
                    caption={`${pad(index + 1)} — ${
                      screenName ?? `Screen ${pad(index + 1)}`
                    }${exists ? "" : " · pending"}`}
                  />
                );
              })}
              {images.optional && gallery.optionalScreens[0] ? (
                <ProjectVisual
                  projectId={project.id}
                  src={gallery.optionalScreens[0]}
                  exists
                  alt={`${project.name} — optional screen 06`}
                  aspect="portrait"
                  sizes="(min-width: 1024px) 214px, (min-width: 640px) 30vw, 45vw"
                  seed={6}
                  trigger={triggerFor(
                    gallery.optionalScreens[0],
                    `${project.name} — optional screen 06`,
                  )}
                  caption="06 — Optional screen"
                />
              ) : null}
            </div>
          ) : (
            <>
              <h3 className="mono-meta mt-8 text-ash">Desktop</h3>
              <div className="mt-3 grid gap-5 sm:grid-cols-2">
                {gallery.desktop.map((src, index) => {
                  const exists = Boolean(images.desktop[index]);
                  const alt = `${project.name} — desktop interface ${pad(
                    index + 1,
                  )}`;
                  return (
                    <ProjectVisual
                      key={src}
                      projectId={project.id}
                      src={src}
                      exists={exists}
                      alt={alt}
                      aspect="wide"
                      sizes="(min-width: 1280px) 566px, (min-width: 640px) 45vw, 100vw"
                      seed={index + 1}
                      trigger={exists ? triggerFor(src, alt) : undefined}
                      caption={`Desktop ${pad(index + 1)}${
                        exists ? "" : " — pending"
                      }`}
                    />
                  );
                })}
              </div>

              <h3 className="mono-meta mt-10 text-ash">Mobile</h3>
              <div className="mt-3 grid max-w-2xl grid-cols-2 gap-5">
                {gallery.mobile.map((src, index) => {
                  const exists = Boolean(images.mobile[index]);
                  const alt = `${project.name} — mobile interface ${pad(
                    index + 1,
                  )}`;
                  return (
                    <ProjectVisual
                      key={src}
                      projectId={project.id}
                      src={src}
                      exists={exists}
                      alt={alt}
                      aspect="portrait"
                      sizes="(min-width: 768px) 326px, 45vw"
                      seed={index + 5}
                      trigger={exists ? triggerFor(src, alt) : undefined}
                      caption={`Mobile ${pad(index + 1)}${
                        exists ? "" : " — pending"
                      }`}
                    />
                  );
                })}
              </div>
            </>
          )}
        </section>
        </ProjectGallery>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <section aria-labelledby="overview-heading">
              <SectionHead id="overview-heading" title="Overview" />
              <ScrambleText
                as="p"
                className="mt-6 max-w-prose text-base leading-relaxed text-silver"
                text={project.description}
                level="body"
                trigger="view"
              />

              {project.engineeringThesis ? (
                <blockquote className="mt-8 border-l border-line-strong pl-5">
                  <ScrambleText
                    as="p"
                    className="mono-meta text-ash"
                    text="Approach"
                    level="micro"
                    trigger="view"
                  />
                  <ScrambleText
                    as="p"
                    className="mt-2 max-w-prose text-lg leading-relaxed text-paper"
                    text={project.engineeringThesis}
                    level="body"
                    trigger="view"
                    delay={40}
                  />
                </blockquote>
              ) : null}
            </section>

            {project.highlights.length > 0 ? (
              <section aria-labelledby="highlights-heading" className="mt-12">
                <SectionHead
                  id="highlights-heading"
                  title="Highlights"
                  meta={pad(project.highlights.length)}
                />
                <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                  {project.highlights.map((highlight, index) => (
                    <li
                      key={highlight}
                      className="text-[13px] leading-relaxed text-silver before:mr-2 before:font-mono before:text-graphite before:content-['—']"
                    >
                      <ScrambleText
                        text={highlight}
                        level="body"
                        trigger="view"
                        delay={Math.min(index * 30, 120)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {concept ? (
              <section aria-labelledby="concept-heading" className="mt-12">
                <SectionHead
                  id="concept-heading"
                  title="Concept"
                  meta="Mobile UI"
                />
                <ScrambleText
                  as="p"
                  className="mt-6 text-base leading-relaxed text-paper"
                  text={concept.tagline}
                  level="body"
                  trigger="view"
                />

                <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
                  <div>
                    <dt className="mono-meta text-ash">
                      <ScrambleText
                        text="Industry"
                        level="micro"
                        trigger="view"
                      />
                    </dt>
                    <ScrambleText
                      as="dd"
                      className="mt-1 text-[13px] leading-relaxed text-silver"
                      text={concept.industry}
                      level="body"
                      trigger="view"
                      delay={20}
                    />
                  </div>
                  <div>
                    <dt className="mono-meta text-ash">
                      <ScrambleText
                        text="Personality"
                        level="micro"
                        trigger="view"
                      />
                    </dt>
                    <ScrambleText
                      as="dd"
                      className="mt-1 text-[13px] leading-relaxed text-silver"
                      text={concept.personality}
                      level="body"
                      trigger="view"
                      delay={40}
                    />
                  </div>
                  <div>
                    <dt className="mono-meta text-ash">
                      <ScrambleText
                        text="Audience"
                        level="micro"
                        trigger="view"
                      />
                    </dt>
                    <ScrambleText
                      as="dd"
                      className="mt-1 text-[13px] leading-relaxed text-silver"
                      text={concept.audience}
                      level="body"
                      trigger="view"
                      delay={60}
                    />
                  </div>
                  <div>
                    <dt className="mono-meta text-ash">
                      <ScrambleText
                        text="Visual style"
                        level="micro"
                        trigger="view"
                      />
                    </dt>
                    <ScrambleText
                      as="dd"
                      className="mt-1 text-[13px] leading-relaxed text-silver"
                      text={concept.visualStyle}
                      level="body"
                      trigger="view"
                      delay={80}
                    />
                  </div>
                </dl>

                <h3 className="mono-meta mt-8 text-ash">
                  <ScrambleText
                    text="Palette"
                    level="micro"
                    trigger="view"
                  />
                </h3>
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {concept.palette.map((entry) => (
                    <li
                      key={`${entry.name}-${entry.hex}`}
                      className="flex items-center gap-3 border border-line px-3 py-2"
                    >
                      <span
                        aria-hidden="true"
                        className="size-4 shrink-0 border border-line-strong"
                        style={{ backgroundColor: entry.hex }}
                      />
                      <span className="text-[13px] text-silver">
                        <ScrambleText
                          text={entry.name}
                          level="micro"
                          trigger="view"
                        />
                      </span>
                      <span className="mono-meta ml-auto text-ash">
                        {entry.hex}
                      </span>
                    </li>
                  ))}
                </ul>

                <h3 className="mono-meta mt-8 text-ash">
                  <ScrambleText
                    text="Typography"
                    level="micro"
                    trigger="view"
                  />
                </h3>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-silver">
                  {concept.typography.map((font) => (
                    <li key={font}>
                      <ScrambleText text={font} level="micro" trigger="view" />
                    </li>
                  ))}
                </ul>

                <h3 className="mono-meta mt-8 text-ash">
                  <ScrambleText
                    text="Specified screens"
                    level="micro"
                    trigger="view"
                  />
                </h3>
                <ol className="mt-2 space-y-1.5">
                  {concept.specifiedScreens.map((screen, index) => (
                    <li
                      key={screen}
                      className="flex gap-3 text-[13px] leading-relaxed text-silver"
                    >
                      <span className="font-mono text-[11px] text-ash">
                        {pad(index + 1)}
                      </span>
                      <ScrambleText
                        text={screen}
                        level="body"
                        trigger="view"
                        delay={Math.min(index * 30, 120)}
                      />
                    </li>
                  ))}
                </ol>

                {concept.fictionalContent.length > 0 ? (
                  <>
                    <h3 className="mono-meta mt-8 text-ash">
                      <ScrambleText
                        text="Fictional content"
                        level="micro"
                        trigger="view"
                      />
                    </h3>
                    <ScrambleText
                      as="p"
                      className="mt-2 text-[13px] leading-relaxed text-ash"
                      text="Invented for the concept screens — not real products, people or prices."
                      level="body"
                      trigger="view"
                      delay={20}
                    />
                    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-silver">
                      {concept.fictionalContent.map((item) => (
                        <li key={item}>
                          <ScrambleText
                            text={item}
                            level="micro"
                            trigger="view"
                          />
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </section>
            ) : null}

            {project.limitations.length > 0 ? (
              <section aria-labelledby="notes-heading" className="mt-12">
                <SectionHead
                  id="notes-heading"
                  title="Limitations"
                  meta={pad(project.limitations.length)}
                />
                <ul className="mt-6 space-y-3 border-l border-line pl-5">
                  {project.limitations.map((limitation, index) => (
                    <li
                      key={limitation}
                      className="text-[13px] leading-relaxed text-silver"
                    >
                      <ScrambleText
                        text={limitation}
                        level="body"
                        trigger="view"
                        delay={Math.min(index * 30, 90)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside
            aria-labelledby="details-heading"
            className="lg:col-span-4 lg:self-start"
          >
            <h2 id="details-heading" className="sr-only">
              Project details
            </h2>
            <dl className="border-t border-line">
              <MetaRow term="Category">
                <Link
                  href={`/projects?category=${project.category}`}
                  className="link-underline transition-colors hover:text-paper"
                >
                  <ScrambleText
                    text={categoryLabel}
                    level="micro"
                    trigger="view"
                  />
                </Link>
              </MetaRow>
              <MetaRow term="Status">
                <ScrambleText
                  text={statusLabel}
                  level="micro"
                  trigger="view"
                />
              </MetaRow>
              {project.technologies.length > 0 ? (
                <MetaRow term="Built with">
                  <ScrambleText
                    text={project.technologies.join(" · ")}
                    level="micro"
                    trigger="view"
                  />
                </MetaRow>
              ) : null}
              {project.role.length > 0 ? (
                <MetaRow term="Role">
                  <ScrambleText
                    text={project.role.join(" · ")}
                    level="micro"
                    trigger="view"
                  />
                </MetaRow>
              ) : null}
            </dl>

            {project.statusNote ? (
              <ScrambleText
                as="p"
                className="mt-6 border-l border-line-strong pl-4 text-[13px] leading-relaxed text-ash"
                text={project.statusNote}
                level="body"
                trigger="view"
              />
            ) : null}
          </aside>
        </div>

        <nav aria-label="Project navigation" className="mt-20">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-line pt-5">
            <Link
              href="/projects"
              className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
            >
              <ScrambleText
                text={`All ${PROJECT_COUNT} projects`}
                level="micro"
                trigger="view"
              />
            </Link>
            <p className="mono-meta text-ash">
              Project {project.id} / {pad(PROJECT_COUNT)}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:gap-12">
            {previous ? (
              <Neighbour project={previous} direction="previous" />
            ) : null}
            {next ? <Neighbour project={next} direction="next" /> : null}
          </div>
        </nav>
      </article>
    </main>
  );
}
