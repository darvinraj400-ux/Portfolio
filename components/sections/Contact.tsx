import { ArrowUpRight } from "lucide-react";
import SectionFrame from "@/components/layout/SectionFrame";
import ScrambleText from "@/components/motion/ScrambleText";
import ContactCta from "@/components/sections/ContactCta";
import { SITE } from "@/lib/constants";

export default function Contact() {
  return (
    <SectionFrame id="contact" index="04" title="Contact">
      <ScrambleText
        as="p"
        className="display max-w-3xl text-4xl sm:text-5xl"
        text="HAVE AN IDEA? LET'S BUILD IT."
        level="heading"
      />

      <ScrambleText
        as="p"
        className="mt-8 max-w-xl text-base leading-relaxed text-silver"
        text="Have a project in mind, an idea worth exploring or an opportunity to collaborate? I'd love to hear about it. Let's turn your next idea into something real."
        level="body"
        delay={60}
      />

      <div className="mt-10">
        <ContactCta />
      </div>

      <div className="mt-12 grid gap-8 border-t border-line pt-8 sm:grid-cols-12 sm:items-end">
        <div className="sm:col-span-8">
          <ScrambleText
            as="p"
            className="mono-meta text-ash"
            text="BEYOND THE INTERFACE"
            level="micro"
            delay={160}
          />
          <ScrambleText
            as="p"
            className="mt-3 max-w-xl text-lg leading-relaxed text-paper"
            text="Explore my GitHub to discover my development work, experiments, code and ongoing projects."
            level="body"
            delay={200}
          />
        </div>
        <a
          href={SITE.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-12 items-center gap-2 border border-line-strong px-5 font-mono text-[11px] tracking-[0.12em] text-paper transition-colors hover:border-paper hover:bg-paper hover:text-background sm:col-span-4 sm:justify-self-end"
        >
          <ScrambleText
            text="EXPLORE MY GITHUB"
            level="micro"
            delay={240}
          />
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-6">
        <a
          href={`mailto:${SITE.email}`}
          className="link-underline pb-1 text-sm text-silver transition-colors hover:text-paper"
        >
          <ScrambleText text={SITE.email} level="micro" delay={280} />
        </a>
        <p className="mono-meta text-ash">
          <ScrambleText
            text={`${SITE.creator} · ${SITE.role}`}
            level="micro"
            delay={320}
          />
        </p>
      </div>
    </SectionFrame>
  );
}
