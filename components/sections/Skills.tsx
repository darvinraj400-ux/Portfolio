import type { ComponentType } from "react";
import { Boxes, Cloud, Database } from "lucide-react";
import {
  SiCss,
  SiDocker,
  SiExpress,
  SiFastapi,
  SiGit,
  SiGithub,
  SiGooglegemini,
  SiHtml5,
  SiJavascript,
  SiLangchain,
  SiMongodb,
  SiNextdotjs,
  SiOllama,
  SiPostman,
  SiPython,
  SiReact,
  SiSupabase,
  SiTailwindcss,
} from "react-icons/si";
import Reveal from "@/components/layout/Reveal";

type SkillIcon = ComponentType<{
  size?: number | string;
  className?: string;
}>;

type Skill = {
  label: string;
  Icon: SkillIcon;
};

// NOTE: react-icons/si no longer ships SiCss3 / SiAmazonaws (verified
// against the installed version). CSS3 resolves to SiCss (the CSS
// logo). ChromaDB, Vector Embeddings, and AWS have no brand mark in
// react-icons — they use neutral lucide icons so the label stays
// authoritative without misattributing a vendor.
const ROWS: {
  label: string;
  skills: Skill[];
  duration: string;
  direction: "left" | "right";
}[] = [
  {
    label: "Row 1",
    direction: "left",
    duration: "45s",
    skills: [
      { label: "JavaScript", Icon: SiJavascript },
      { label: "HTML5", Icon: SiHtml5 },
      { label: "CSS3", Icon: SiCss },
      { label: "Python", Icon: SiPython },
      { label: "React", Icon: SiReact },
      { label: "Next.js", Icon: SiNextdotjs },
    ],
  },
  {
    label: "Row 2",
    direction: "right",
    duration: "55s",
    skills: [
      { label: "Tailwind CSS", Icon: SiTailwindcss },
      { label: "Express.js", Icon: SiExpress },
      { label: "MongoDB", Icon: SiMongodb },
      { label: "FastAPI", Icon: SiFastapi },
      { label: "Supabase", Icon: SiSupabase },
    ],
  },
  {
    label: "Row 3",
    direction: "left",
    duration: "50s",
    skills: [
      { label: "LangChain", Icon: SiLangchain },
      { label: "Ollama", Icon: SiOllama },
      { label: "Gemini", Icon: SiGooglegemini },
      { label: "ChromaDB", Icon: Database },
      { label: "Vector Embeddings", Icon: Boxes },
    ],
  },
  {
    label: "Row 4",
    direction: "right",
    duration: "60s",
    skills: [
      { label: "AWS", Icon: Cloud },
      { label: "Git", Icon: SiGit },
      { label: "GitHub", Icon: SiGithub },
      { label: "Docker", Icon: SiDocker },
      { label: "Postman", Icon: SiPostman },
    ],
  },
];

function Pill({ label, Icon }: Skill) {
  return (
    <span className="inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border border-border bg-card/60 px-3 text-sm text-foreground/80">
      <Icon size={18} aria-hidden="true" />
      {label}
    </span>
  );
}

export default function Skills() {
  return (
    <section id="skills" aria-label="Skills" data-palette="neutral" className="scroll-mt-14 px-6 py-24 sm:py-32">
      <Reveal className="mx-auto w-full max-w-5xl">
        <h2 data-reveal className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Skills
        </h2>
        <div className="mt-8 space-y-3 sm:space-y-4">
          {ROWS.map((row) => (
            <div
              key={row.label}
              data-reveal
              role="marquee"
              aria-label={`Skills row`}
              className="marquee overflow-hidden"
            >
              <div
                className="marquee-track"
                data-direction={row.direction}
                style={{ animationDuration: row.duration }}
              >
                <div className="flex shrink-0 items-center gap-3 pr-3">
                  {row.skills.map((skill) => (
                    <Pill key={skill.label} {...skill} />
                  ))}
                </div>
                <div
                  className="flex shrink-0 items-center gap-3 pr-3"
                  aria-hidden="true"
                >
                  {row.skills.map((skill) => (
                    <Pill key={`loop-${skill.label}`} {...skill} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
