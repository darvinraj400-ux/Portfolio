import Reveal from "@/components/layout/Reveal";

export default function About() {
  return (
    <section id="about" aria-label="About" data-palette="neutral" className="scroll-mt-14 px-6 py-24 sm:py-32">
      <Reveal className="mx-auto w-full max-w-5xl">
        <h2 data-reveal className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          About
        </h2>
        <div className="mt-8 max-w-2xl space-y-6 text-lg leading-relaxed text-foreground">
          <p data-reveal>
            I&apos;m Darvin, and I build AI products that admit what they
            don&apos;t know. Most demos fail the moment a user asks something
            unexpected — so I design for that moment first: guardrails,
            confidence thresholds, and a clean handoff to a human.
          </p>
          <p data-reveal>
            My work lives at the intersection of full-stack engineering and
            applied AI. I&apos;ve shipped a pricing copilot for kedai runcit, a
            support widget that answers from your own FAQs, a lead qualifier
            with a deterministic rubric, and a booking system with a race-safe
            scheduler.
          </p>
          <p data-reveal>
            I&apos;m based in Kuala Lumpur and finishing my final year. When
            I&apos;m not shipping, I&apos;m usually breaking my own demos on
            purpose to find out where the guardrails should go.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
