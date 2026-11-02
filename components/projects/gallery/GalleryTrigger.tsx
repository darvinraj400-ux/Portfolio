"use client";

import { Maximize2 } from "lucide-react";
import { useGallery } from "./ProjectGallery";

type Props = {
  index: number;
  label: string;
};

export default function GalleryTrigger({ index, label }: Props) {
  const gallery = useGallery();
  if (!gallery) return null;

  return (
    <button
      type="button"
      onClick={(event) => gallery.open(index, event.currentTarget)}
      aria-label={`Open ${label} in fullscreen`}
      aria-haspopup="dialog"
      className="group absolute inset-0 z-10 cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-paper"
    >
      <span
        aria-hidden="true"
        className="absolute right-2 top-2 inline-flex size-7 items-center justify-center border border-line-strong bg-background/70 text-silver opacity-80 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
      >
        <Maximize2 className="size-3.5" />
      </span>
    </button>
  );
}
