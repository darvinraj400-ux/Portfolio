import { ArrowUpRight } from "lucide-react";
import ContactCta from "@/components/sections/ContactCta";
import Reveal from "@/components/layout/Reveal";
import { SITE } from "@/lib/constants";

export default function Contact() {
  return (
    <section id="contact" aria-label="Contact" data-palette="neutral" className="scroll-mt-14 px-6 py-24 sm:py-32">
      <Reveal className="mx-auto w-full max-w-5xl">
        <h2 data-reveal className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Contact
        </h2>
        <p data-reveal className="mt-8 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          Have something worth building? Let&apos;s talk.
        </p>
        <p data-reveal className="mt-6 text-base text-muted-foreground">
          Available for full-stack and AI integration work.
        </p>
        <p data-reveal className="text-base text-muted-foreground">
          Available for remote work.
        </p>
        <div data-reveal className="mt-8">
          <ContactCta />
        </div>
        <div data-reveal className="mt-4">
          <a
            href={`mailto:${SITE.email}`}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {SITE.email}
          </a>
        </div>
        <div data-reveal className="mt-8">
          <a
            href={SITE.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            GitHub
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </Reveal>
    </section>
  );
}
