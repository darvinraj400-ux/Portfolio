"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import type { MotionPreference } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FULL_NOTE =
  "Enables the full animation experience, overriding your device's reduced-motion preference on this website.";

const OPTIONS: {
  value: MotionPreference;
  label: string;
  hint: string;
}[] = [
  {
    value: "system",
    label: "System default",
    hint: "Follows your device's motion setting.",
  },
  {
    value: "reduced",
    label: "Reduced motion",
    hint: "Gentle movement, no automatic animation.",
  },
  {
    value: "full",
    label: "Full motion",
    hint: "The complete cinematic experience.",
  },
];

export default function MotionControl() {
  const { preference, systemReduced, setPreference } = useMotionPreference();
  const pathname = usePathname();
  const panelId = useId();
  const radioName = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const summary =
    preference === "reduced"
      ? "Reduced motion"
      : preference === "full"
        ? "Full motion"
        : "System default";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLInputElement>('input[type="radio"]:checked')
        ?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative max-md:static">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        title={`Motion: ${summary}`}
        aria-label={`Motion: ${summary} — open motion settings`}
        className={cn(
          "relative inline-flex size-10 items-center justify-center border transition-colors",
          open
            ? "border-line-strong text-paper"
            : "border-line text-silver hover:border-line-strong hover:text-paper",
        )}
      >
        <Activity className="size-4" aria-hidden="true" />
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-1.5 top-1.5 size-1 rounded-full",
            preference === "system"
              ? "bg-transparent shadow-[inset_0_0_0_1px_var(--paper)]"
              : "bg-paper",
          )}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          ref={panelRef}
          role="group"
          aria-label="Motion settings"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(20rem,calc(100vw-2rem))] border border-line-strong bg-surface p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)] max-md:left-[clamp(1.25rem,4vw,3rem)] max-md:right-[clamp(1.25rem,4vw,3rem)] max-md:w-auto"
        >
          <fieldset>
            <legend className="mono-meta uppercase tracking-[0.18em] text-ash">
              Motion
            </legend>
            <p className="mt-2 text-[11px] leading-relaxed text-ash">
              {systemReduced
                ? "Your device requests reduced motion."
                : "Your device has no reduced-motion preference."}
            </p>

            <div className="mt-3 space-y-1.5">
              {OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 border border-line px-3 py-2 transition-colors focus-within:border-paper/70 hover:border-line-strong"
                >
                  <input
                    type="radio"
                    name={radioName}
                    value={option.value}
                    checked={preference === option.value}
                    onChange={() => setPreference(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="mt-[3px] size-2.5 shrink-0 rounded-full border border-ash transition-colors peer-checked:border-paper peer-checked:bg-paper"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] text-paper">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-ash">
                      {option.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {preference === "full" ? (
            <p
              role="status"
              className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-silver"
            >
              {FULL_NOTE}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
