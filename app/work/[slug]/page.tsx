import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import path from "node:path";
import ProjectDetail, {
  type ImageAvailability,
} from "@/components/projects/ProjectDetail";
import {
  getProjectBySlug,
  getProjectNeighbours,
  PROJECT_STATUS_LABELS,
  PROJECTS,
  type Project,
} from "@/lib/projects";

type Params = { slug: string };

export const dynamicParams = false;

const publicFileExists = (url: string) =>
  existsSync(path.join(process.cwd(), "public", url.replace(/^\//, "")));

const imageAvailability = (project: Project): ImageAvailability => ({
  cover: publicFileExists(project.gallery.cover),
  desktop: project.gallery.desktop.map((url) => publicFileExists(url)),
  mobile: project.gallery.mobile.map((url) => publicFileExists(url)),
  screens: project.gallery.screens.map((url) => publicFileExists(url)),
  optional: project.gallery.optionalScreens.some((url) =>
    publicFileExists(url),
  ),
});

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project not found",
      robots: { index: false, follow: false },
    };
  }

  const description = `${project.shortDescription} ${PROJECT_STATUS_LABELS[project.status]}.`;
  const coverExists = publicFileExists(project.gallery.cover);

  return {
    title: project.name,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${project.name} — DARVINN STUDIO`,
      description,
      url: `/work/${project.slug}`,
      type: "website",
      ...(coverExists
        ? {
            images: [
              {
                url: project.gallery.cover,
                alt: `${project.name} — project cover`,
              },
            ],
          }
        : {}),
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { previous, next } = getProjectNeighbours(project.slug);

  return (
    <ProjectDetail
      project={project}
      images={imageAvailability(project)}
      previous={previous}
      next={next}
    />
  );
}
