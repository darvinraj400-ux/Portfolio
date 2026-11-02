"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { useSound } from "./SoundProvider";
import { cn } from "@/lib/utils";

type SwitchProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
};

function Switch({ label, checked, onToggle, buttonRef }: SwitchProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center border transition-colors",
        checked
          ? "border-paper bg-paper/10"
          : "border-line-strong bg-transparent",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 size-4 -translate-y-1/2 rounded-full transition-all",
          checked ? "right-1 bg-paper" : "left-1 bg-ash",
        )}
      />
    </button>
  );
}

function VolumeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[12px] text-silver">Music volume</span>
        <span className="mono-meta tabular-nums text-ash">{percent}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={percent}
        aria-label="Music volume"
        aria-valuetext={`${percent} percent`}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(Number(event.target.value) / 100)
        }
        className="mt-2 w-full cursor-pointer accent-[var(--paper)]"
      />
    </label>
  );
}

export default function SoundControl() {
  const {
    musicOn,
    clickOn,
    musicVolume,
    status,
    toggleMusic,
    toggleClick,
    setMusicVolume,
  } = useSound();
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const switchRef = useRef<HTMLButtonElement>(null);

  const active = musicOn || clickOn;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => switchRef.current?.focus());
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
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        title={
          status === "waiting"
            ? "Waiting for browser interaction to start audio"
            : active
              ? "Sound on"
              : "Sound off"
        }
        aria-label={
          active
            ? status === "waiting"
              ? "Sound on, waiting for browser interaction — open sound settings"
              : "Sound on — open sound settings"
            : "Sound off — open sound settings"
        }
        className={cn(
          "relative inline-flex size-10 items-center justify-center border transition-colors",
          open
            ? "border-line-strong text-paper"
            : "border-line text-silver hover:border-line-strong hover:text-paper",
        )}
      >
        {active ? (
          <Volume2 className="size-4" aria-hidden="true" />
        ) : (
          <VolumeX className="size-4" aria-hidden="true" />
        )}
        <span
          aria-hidden="true"
          className={cn(
            "absolute right-1.5 top-1.5 size-1 rounded-full transition-colors",
            status === "waiting"
              ? "bg-transparent shadow-[inset_0_0_0_1px_var(--paper)]"
              : active
                ? "bg-paper"
                : "bg-ash/60",
          )}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="group"
          aria-label="Sound settings"
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(19rem,calc(100vw-2rem))] border border-line-strong bg-surface p-4 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]"
        >
          <p className="mono-meta uppercase tracking-[0.18em] text-ash">
            Sound
          </p>

          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-sm text-paper">Music</span>
            <Switch
              label="Music"
              checked={musicOn}
              onToggle={toggleMusic}
              buttonRef={switchRef}
            />
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-ash">
            Soft late-night jazz.
          </p>

          <div className="mt-4 border-t border-line pt-4">
            <VolumeSlider value={musicVolume} onChange={setMusicVolume} />
          </div>

          <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
            <span className="text-sm text-paper">Cursor click</span>
            <Switch
              label="Cursor click"
              checked={clickOn}
              onToggle={toggleClick}
            />
          </div>

          <p className="mt-2 text-[11px] leading-relaxed text-ash">
            On by default. If the browser blocks autoplay, music starts on your
            first interaction.
          </p>

          <p
            role="status"
            aria-live="polite"
            className={cn(
              "mt-3 text-[11px] leading-relaxed",
              status === "waiting"
                ? "text-ash"
                : status === "blocked"
                  ? "text-paper"
                  : "sr-only",
            )}
          >
            {status === "starting"
              ? "Starting audio."
              : status === "waiting"
                ? "Waiting for your first interaction to start music."
                : status === "blocked"
                  ? "Audio could not start. Try again."
                  : musicOn && clickOn
                    ? "Music and cursor click enabled."
                    : musicOn
                      ? "Music enabled."
                      : clickOn
                        ? "Cursor click enabled."
                        : "Sound disabled."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
