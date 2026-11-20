"use client";

import { Activity } from "lucide-react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { cn } from "@/lib/utils";

export default function MotionControl() {
  const { reduced, preference, setPreference } = useMotionPreference();
  const full = preference === "full";

  return (
    <button
      type="button"
      onClick={() => setPreference(full ? "system" : "full")}
      aria-pressed={full}
      title={
        full
          ? "Motion: full motion (overrides device) — use the device setting"
          : reduced
            ? "Motion: device is set to reduced — enable full motion"
            : "Motion: following device — force full motion"
      }
      aria-label={
        full
          ? "Full motion is on, overriding the device setting. Switch to the device setting."
          : reduced
            ? "Motion follows the device, which is set to reduced. Enable full motion."
            : "Motion follows the device. Force full motion."
      }
      className={cn(
        "relative inline-flex size-10 items-center justify-center border transition-colors",
        full
          ? "border-line-strong text-paper"
          : "border-line text-silver hover:border-line-strong hover:text-paper",
      )}
    >
      <Activity className="size-4" aria-hidden="true" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute right-1.5 top-1.5 size-1 rounded-full",
          full ? "bg-paper" : "bg-transparent shadow-[inset_0_0_0_1px_var(--paper)]",
        )}
      />
    </button>
  );
}
