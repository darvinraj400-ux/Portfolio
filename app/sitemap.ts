import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { PROJECTS } from "@/lib/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE.domain}/`, lastModified },
    { url: `${SITE.domain}/projects`, lastModified },
    ...PROJECTS.map((project) => ({
      url: `${SITE.domain}/work/${project.slug}`,
      lastModified,
    })),
  ];
}
