import SectionFrame from "@/components/layout/SectionFrame";
import ScrambleText from "@/components/motion/ScrambleText";
import AboutStats from "@/components/sections/AboutStats";
import { SITE } from "@/lib/constants";

export default function About() {
  return (
    <SectionFrame id="about" index="01" title="About">
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-8">
        <div>
          <ScrambleText
            as="p"
            className="mono-meta text-ash"
            text={SITE.role}
            level="micro"
          />
          <ScrambleText
            as="h3"
            className="mt-3 display text-4xl sm:text-5xl"
            text={SITE.creator}
            level="heading"
            delay={40}
          />
        </div>
        <ScrambleText
          as="p"
          className="mono-meta"
          text={SITE.studio}
          level="micro"
          delay={80}
        />
      </div>

      <div className="mt-8 max-w-2xl space-y-6 text-base leading-relaxed text-silver sm:text-lg">
        <ScrambleText
          as="p"
          className="text-lg text-paper sm:text-xl"
          text="Technology gives me the tools. Creativity gives me direction."
          level="heading"
          delay={60}
        />
        <ScrambleText
          as="p"
          text="I'm Darvin Raj, an independent digital creator interested in web development, artificial intelligence, digital experiences and problem-solving."
          level="body"
          delay={80}
        />
        <ScrambleText
          as="p"
          text="One of my strongest capabilities is using AI effectively as part of the development process. I enjoy taking an idea, breaking it into manageable parts, exploring solutions and using AI-assisted workflows to turn concepts into functional digital products."
          level="body"
          delay={120}
        />
        <ScrambleText
          as="p"
          text="I believe AI is most valuable when combined with human judgment, creative thinking and technical understanding. It allows me to experiment faster, work more efficiently and explore ideas that might otherwise take much longer to bring to life."
          level="body"
          delay={160}
        />
        <ScrambleText
          as="p"
          text="I'm always learning, building and exploring better ways to turn ideas into something real."
          level="body"
          delay={200}
        />
      </div>

      <AboutStats />
    </SectionFrame>
  );
}
