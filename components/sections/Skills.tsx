import SectionFrame from "@/components/layout/SectionFrame";
import ScrambleText from "@/components/motion/ScrambleText";

const SKILL_GROUPS = [
  {
    title: "AI & Intelligent Development",
    skills: [
      "AI-assisted development",
      "AI coding workflows",
      "AI integration",
      "Prompt design and task orchestration",
    ],
  },
  {
    title: "Web Development",
    skills: [
      "Responsive web development",
      "Website development",
      "Functional web applications",
      "Frontend implementation",
    ],
  },
  {
    title: "Design & Experience",
    skills: [
      "UI/UX design",
      "Interface design",
      "Responsive layouts",
      "Digital product prototyping",
    ],
  },
  {
    title: "Automation & Systems",
    skills: [
      "Workflow automation",
      "Business-oriented web systems",
      "Dashboard and booking system development",
      "Digital problem-solving",
    ],
  },
] as const;

export default function Skills() {
  return (
    <SectionFrame id="skills" index="03" title="Expertise">
      <ScrambleText
        as="p"
        className="max-w-xl text-2xl leading-tight tracking-tight text-paper sm:text-3xl"
        text="Where design, development and AI-assisted workflows meet."
        level="heading"
      />

      <div className="mt-10 grid gap-px border-t border-line bg-line sm:grid-cols-2">
        {SKILL_GROUPS.map((group, index) => (
          <section
            key={group.title}
            aria-labelledby={`skill-group-${index + 1}`}
            className="bg-background py-7 sm:pr-8 sm:even:pr-0 sm:even:pl-8"
          >
            <div className="flex items-baseline justify-between gap-6 border-b border-line pb-3">
              <h3
                id={`skill-group-${index + 1}`}
                className="text-base font-medium text-paper sm:text-lg"
              >
                <ScrambleText
                  text={group.title}
                  level="heading"
                  delay={40 + index * 60}
                />
              </h3>
              <span aria-hidden="true" className="mono-meta text-ash">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
            <ul className="mt-4 space-y-2">
              {group.skills.map((skill, skillIndex) => (
                <li
                  key={skill}
                  className="text-sm leading-relaxed text-silver before:mr-2 before:font-mono before:text-graphite before:content-['—']"
                >
                  <ScrambleText
                    text={skill}
                    level="body"
                    delay={60 + index * 60 + skillIndex * 25}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SectionFrame>
  );
}
