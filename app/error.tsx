"use client";

import { useEffect } from "react";
import ScrambleText from "@/components/motion/ScrambleText";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-6 text-center"
    >
      <ScrambleText
        as="p"
        className="mono-meta text-ash"
        text="Something went wrong"
        level="micro"
        trigger="mount"
      />
      <ScrambleText
        as="h1"
        className="mt-4 display text-4xl sm:text-5xl"
        text="This page couldn't load."
        level="headline"
        trigger="mount"
        delay={40}
      />
      <ScrambleText
        as="p"
        className="mt-4 max-w-md text-sm leading-relaxed text-silver"
        text="An unexpected error interrupted the page. Try loading it again."
        level="body"
        trigger="mount"
        delay={80}
      />
      <button
        type="button"
        onClick={reset}
        className="link-underline mt-8 pb-1 text-sm text-silver transition-colors hover:text-paper"
      >
        <ScrambleText
          text="Try again"
          level="micro"
          trigger="mount"
          delay={120}
        />
      </button>
    </main>
  );
}
