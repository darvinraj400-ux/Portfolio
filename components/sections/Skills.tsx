import Reveal from "@/components/layout/Reveal";

const SKILL_GROUPS = [
  {
    label: "Languages",
    items: ["TypeScript", "Python", "SQL"],
  },
  {
    label: "Frameworks",
    items: ["Next.js", "React", "Tailwind CSS", "Node.js"],
  },
  {
    label: "AI/ML",
    items: ["LLM apps", "RAG", "Guardrails", "Prompt design"],
  },
  {
    label: "Data",
    items: ["PostgreSQL", "Supabase", "Pandas"],
  },
  {
    label: "Infra",
    items: ["Vercel", "Git", "Docker"],
  },
] as const;

export default function Skills() {
  return (
    <section id="skills" aria-label="Skills" data-palette="neutral" className="scroll-mt-14 px-6 py-24 sm:py-32">
      <Reveal className="mx-auto w-full max-w-5xl">
        <h2 data-reveal className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Skills
        </h2>
        <dl className="mt-8 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {SKILL_GROUPS.map((group) => (
            <div key={group.label} data-reveal>
              <dt className="text-sm font-medium text-foreground">
                {group.label}
              </dt>
              <dd className="mt-3">
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </section>
  );
}
