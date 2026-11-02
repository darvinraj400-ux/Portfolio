import ScrambleText from "@/components/motion/ScrambleText";
import { SITE } from "@/lib/constants";

const SUBJECT = encodeURIComponent("Project inquiry");

/** Opens a prefilled email in the visitor's mail client. */
export default function ContactCta() {
  const mailto = `mailto:${SITE.email}?subject=${SUBJECT}`;

  return (
    <a
      href={mailto}
      aria-label={`Email ${SITE.email}`}
      className="inline-flex h-12 items-center bg-paper px-6 text-sm font-medium text-background transition-colors hover:bg-silver"
    >
      <ScrambleText text="Email me" level="micro" delay={120} />
    </a>
  );
}
