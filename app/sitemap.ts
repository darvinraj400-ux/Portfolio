import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITE.domain}/`, lastModified: new Date() }];
}
