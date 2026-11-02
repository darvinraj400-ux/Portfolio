import Link from "next/link";
import ScrambleText from "@/components/motion/ScrambleText";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-6 text-center"
    >
      <ScrambleText
        as="p"
        className="mono-meta text-ash"
        text="404"
        level="micro"
        trigger="mount"
      />
      <ScrambleText
        as="h1"
        className="mt-4 display text-4xl sm:text-5xl"
        text="This page doesn't exist."
        level="headline"
        trigger="mount"
        delay={40}
      />
      <ScrambleText
        as="p"
        className="mt-4 max-w-md text-sm leading-relaxed text-silver"
        text="The page may have moved, or the link may be incomplete."
        level="body"
        trigger="mount"
        delay={80}
      />
      <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        <Link
          href="/"
          className="link-underline pb-1 text-sm text-silver transition-colors hover:text-paper"
        >
          <ScrambleText
            text="Back home"
            level="micro"
            trigger="mount"
            delay={120}
          />
        </Link>
        <Link
          href="/projects"
          className="link-underline pb-1 text-sm text-silver transition-colors hover:text-paper"
        >
          <ScrambleText
            text="View selected work"
            level="micro"
            trigger="mount"
            delay={160}
          />
        </Link>
      </div>
    </main>
  );
}
