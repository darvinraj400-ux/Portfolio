import Image from "next/image";
import type { ReactNode } from "react";
import ProjectPlate from "@/components/archive/ProjectPlate";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  src: string;
  exists: boolean;
  alt: string;
  aspect: "hero" | "wide" | "portrait";
  sizes: string;
  priority?: boolean;
  caption?: string;
  seed?: number;
  trigger?: ReactNode;
};

const ASPECT = {
  hero: "aspect-[4/3]",
  wide: "aspect-[16/9]",
  portrait: "aspect-[1170/2532]",
} as const;

export default function ProjectVisual({
  projectId,
  src,
  exists,
  alt,
  aspect,
  sizes,
  priority,
  caption,
  seed = 0,
  trigger,
}: Props) {
  return (
    <figure className="min-w-0">
      <div
        className={cn(
          "relative overflow-hidden border border-line bg-surface",
          ASPECT[aspect],
        )}
      >
        {exists ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <ProjectPlate id={projectId} seed={seed} />
        )}
        {trigger}
      </div>
      {caption ? (
        <figcaption className="mono-meta mt-2 text-ash">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
