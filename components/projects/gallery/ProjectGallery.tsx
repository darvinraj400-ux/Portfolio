"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { getLenisInstance } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import type { GalleryImage } from "./types";

type GalleryApi = {
  open: (index: number, trigger: HTMLElement) => void;
};

const GalleryContext = createContext<GalleryApi | null>(null);

export function useGallery(): GalleryApi | null {
  return useContext(GalleryContext);
}

const pad = (value: number) => String(value).padStart(2, "0");

type Props = {
  images: GalleryImage[];
  projectName: string;
  collectionLabel: string;
  children: ReactNode;
};

export default function ProjectGallery({
  images,
  projectName,
  collectionLabel,
  children,
}: Props) {
  const total = images.length;
  const { reduced } = useMotionPreference();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const openRef = useRef(false);

  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const [incoming, setIncoming] = useState<number | null>(null);
  const [incomingReady, setIncomingReady] = useState(false);
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const openAt = useCallback(
    (index: number, trigger: HTMLElement) => {
      if (total === 0 || openRef.current) return;
      openRef.current = true;
      triggerRef.current = trigger;
      setCurrent(((index % total) + total) % total);
      setIncoming(null);
      setIncomingReady(false);
      setReadySrc(null);
      setFailedSrc(null);
      setOpen(true);
    },
    [total],
  );

  const close = useCallback(() => {
    if (!openRef.current) return;
    openRef.current = false;
    setOpen(false);
    setIncoming(null);
    setIncomingReady(false);
    const trigger = triggerRef.current;
    triggerRef.current = null;
    window.requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus();
    });
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (total < 2) return;
      setFailedSrc(null);
      setIncomingReady(false);
      setIncoming((previous) => {
        const from = previous ?? current;
        return (from + delta + total) % total;
      });
    },
    [current, total],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    if (!dialog.open) dialog.showModal();

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const lenis = getLenisInstance();
    lenis?.stop?.();

    return () => {
      root.style.overflow = previousOverflow;
      lenis?.start?.();
      if (dialog.open) dialog.close();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (incoming === null || !incomingReady) return;
    const timer = window.setTimeout(
      () => setCurrent(incoming),
      reduced ? 0 : 240,
    );
    return () => window.clearTimeout(timer);
  }, [incoming, incomingReady, reduced]);

  const currentSrc = images[current]?.src;

  useEffect(() => {
    if (incoming === null || current !== incoming) return;
    if (readySrc !== currentSrc) return;
    setIncoming(null);
    setIncomingReady(false);
  }, [current, currentSrc, incoming, readySrc]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey)
        return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest?.(
          "input, textarea, select, [contenteditable='true'], [role='slider']",
        )
      )
        return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, step]);

  const image = images[current];
  const incomingImage = incoming === null ? null : images[incoming];
  const failed = Boolean(image) && failedSrc === image?.src;
  const baseReady = Boolean(image) && readySrc === image?.src;
  const isLoading =
    Boolean(image) &&
    !failed &&
    (incomingImage ? !incomingReady : !baseReady);

  const announcement = image
    ? `Image ${current + 1} of ${total}: ${image.caption}${
        failed ? ". Image could not be loaded." : ""
      }`
    : "";

  const api = useMemo(() => ({ open: openAt }), [openAt]);

  const handleStageClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    const target = event.target as HTMLElement;
    if (target.closest("img, button")) return;
    close();
  };

  const handleTouchStart = (event: ReactTouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 1) {
      touchRef.current = null;
      return;
    }
    touchRef.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  };

  const handleTouchEnd = (event: ReactTouchEvent<HTMLDivElement>) => {
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 400);
    step(dx < 0 ? 1 : -1);
  };

  const handleTab = (event: ReactKeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((node) => node.getClientRects().length > 0);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const failIncoming = (index: number) => {
    setFailedSrc(images[index].src);
    setCurrent(index);
    setIncoming(null);
    setIncomingReady(false);
    setReadySrc(null);
  };

  return (
    <GalleryContext.Provider value={api}>
      {children}

      <dialog
        ref={dialogRef}
        aria-labelledby="project-gallery-title"
        aria-modal="true"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onKeyDown={handleTab}
        className="project-lightbox m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-background p-0 text-foreground"
      >
        {open && image ? (
          <div className="flex h-full flex-col">
            <header className="flex items-start justify-between gap-6 border-b border-line px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-[max(1.5rem,env(safe-area-inset-top))]">
              <div className="min-w-0">
                <h2
                  id="project-gallery-title"
                  className="truncate text-sm font-medium tracking-tight text-paper sm:text-base"
                >
                  {projectName}
                </h2>
                <p className="mono-meta mt-1 truncate text-ash">
                  {collectionLabel}
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close image viewer"
                className="inline-flex size-11 shrink-0 items-center justify-center border border-line-strong text-silver transition-colors hover:border-paper hover:text-paper"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>

            <div
              className="relative min-h-0 flex-1 touch-pan-y"
              aria-busy={isLoading}
              onClick={handleStageClick}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-[3.25rem] py-4 sm:px-24">
                <div className="grid h-full w-full grid-rows-1 place-items-center">
                  <Image
                    key={`base-${image.src}`}
                    src={image.src}
                    alt={incomingImage ? "" : image.alt}
                    width={0}
                    height={0}
                    sizes={image.sizes}
                    quality={90}
                    loading="eager"
                    draggable={false}
                    style={{ width: "auto", height: "auto" }}
                    onLoad={() => setReadySrc(image.src)}
                    onError={() => {
                      if (incomingImage) return;
                      setReadySrc(null);
                      setFailedSrc(image.src);
                    }}
                    className={cn(
                      "pointer-events-auto col-start-1 row-start-1 max-h-full max-w-full select-none object-contain transition-[opacity,transform] duration-300 ease-out",
                      failed
                        ? "opacity-0"
                        : baseReady
                          ? "scale-100 opacity-100"
                          : "scale-[0.995] opacity-0",
                    )}
                  />

                  {incomingImage ? (
                    <Image
                      key={`incoming-${incomingImage.src}`}
                      src={incomingImage.src}
                      alt={incomingImage.alt}
                      width={0}
                      height={0}
                      sizes={incomingImage.sizes}
                      quality={90}
                      loading="eager"
                      draggable={false}
                      style={{ width: "auto", height: "auto" }}
                      onLoad={() => setIncomingReady(true)}
                      onError={() => {
                        if (incoming !== null) failIncoming(incoming);
                      }}
                      className={cn(
                        "pointer-events-auto col-start-1 row-start-1 max-h-full max-w-full select-none object-contain transition-[opacity,transform] duration-300 ease-out",
                        incomingReady
                          ? "scale-100 opacity-100"
                          : "scale-[0.995] opacity-0",
                      )}
                    />
                  ) : null}
                </div>
              </div>

              {total > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Previous image"
                    className="absolute left-1 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-line-strong bg-background/60 text-silver transition-colors hover:border-paper hover:text-paper sm:left-4"
                  >
                    <ChevronLeft className="size-5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next image"
                    className="absolute right-1 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-line-strong bg-background/60 text-silver transition-colors hover:border-paper hover:text-paper sm:right-4"
                  >
                    <ChevronRight className="size-5" aria-hidden="true" />
                  </button>
                </>
              ) : null}

              {isLoading ? (
                <span className="mono-meta pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 uppercase tracking-[0.2em] text-ash">
                  Loading
                </span>
              ) : null}

              {failed ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
                  <p className="text-sm text-paper">Image could not be loaded.</p>
                  <p className="mono-meta text-ash">
                    {image.caption} · {pad(current + 1)} / {pad(total)}
                  </p>
                </div>
              ) : null}
            </div>

            <footer className="flex items-start justify-between gap-6 border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-8 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <p className="mono-meta min-w-0 leading-relaxed text-silver">
                {image.caption}
              </p>
              <p className="mono-meta shrink-0 tracking-[0.16em] text-silver">
                <span aria-hidden="true">
                  {pad(current + 1)} / {pad(total)}
                </span>
                <span className="sr-only">
                  Image {current + 1} of {total}
                </span>
              </p>
            </footer>

            <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {announcement}
            </p>
          </div>
        ) : null}
      </dialog>
    </GalleryContext.Provider>
  );
}
