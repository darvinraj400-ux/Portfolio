import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Reveal from "@/components/layout/Reveal";
import { FEATURED_PROJECT as featured } from "@/lib/constants";

export default function Featured() {
  return (
    <section id="work" aria-label="Featured work" className="scroll-mt-14 px-6 py-24 sm:py-32">
      <Reveal className="mx-auto w-full max-w-5xl">
        <h2 data-reveal className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Featured
        </h2>
        <article data-reveal className="mt-8 rounded-2xl border border-border bg-card p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>Featured</Badge>
            {featured.role ? (
              <span className="text-sm text-muted-foreground">
                {featured.role}
              </span>
            ) : null}
          </div>
          <h3 className="mt-6 font-serif text-4xl tracking-tight text-foreground sm:text-5xl">
            {featured.name}
          </h3>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {featured.oneLiner}
          </p>
          <a
            href={featured.link}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            View on GitHub
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </article>
      </Reveal>
    </section>
  );
}
