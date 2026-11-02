import SectionFrame from "@/components/layout/SectionFrame";
import ScrambleText from "@/components/motion/ScrambleText";

const SERVICES = [
  {
    title: "Website Design & Development",
    body: "Responsive websites, landing pages, portfolio websites and modern digital experiences.",
  },
  {
    title: "Custom Web Applications",
    body: "Functional web applications, dashboards, booking systems and business-oriented digital tools.",
  },
  {
    title: "AI Integration & Automation",
    body: "AI-powered features, intelligent workflows, chatbots and practical automation solutions.",
  },
  {
    title: "UI/UX & Digital Product Design",
    body: "Interface design, user experiences, wireframes, prototypes and mobile application concepts.",
  },
  {
    title: "Rapid Prototyping & Development",
    body: "Turning ideas into interactive prototypes and functional demonstrations using efficient development and AI-assisted workflows.",
  },
] as const;

export default function Services() {
  return (
    <SectionFrame id="services" index="02" title="Services">
      <ScrambleText
        as="p"
        className="max-w-xl text-2xl leading-tight tracking-tight text-paper sm:text-3xl"
        text="What I can design, build and automate."
        level="heading"
      />

      <ul className="mt-10 border-t border-line">
        {SERVICES.map((service, index) => (
          <li
            key={service.title}
            className="grid gap-3 border-b border-line py-7 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] sm:gap-8"
          >
            <ScrambleText
              as="h3"
              className="text-base font-medium text-paper sm:text-lg"
              text={service.title}
              level="heading"
              delay={40 + index * 50}
            />
            <ScrambleText
              as="p"
              className="text-sm leading-relaxed text-silver"
              text={service.body}
              level="body"
              delay={80 + index * 50}
            />
          </li>
        ))}
      </ul>
    </SectionFrame>
  );
}
