import type { NextConfig } from "next";
import { aliasSlug, PROJECTS } from "./lib/projects";

const aliasRedirects = PROJECTS.flatMap((project) =>
  [...project.aliases, ...project.legacySlugs]
    .map((alias) => aliasSlug(alias))
    .filter((slug) => slug.length > 0 && slug !== project.slug)
    .map((slug) => ({
      source: `/work/${slug}`,
      destination: `/work/${project.slug}`,
      permanent: true,
    })),
);

const nextConfig: NextConfig = {
  async redirects() {
    return aliasRedirects;
  },
};

export default nextConfig;
