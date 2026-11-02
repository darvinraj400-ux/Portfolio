import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ScrambleText from "@/components/motion/ScrambleText";
import { NAV_LINKS, SITE } from "@/lib/constants";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <div className="shell grid gap-10 py-12 md:grid-cols-12 md:items-end">
        <div className="md:col-span-5">
          <ScrambleText
            as="p"
            className="text-sm font-semibold tracking-tight text-paper"
            text={SITE.studio}
            level="micro"
            trigger="view"
          />
          <ScrambleText
            as="p"
            className="mono-meta mt-2 text-ash"
            text={`${SITE.role} · Portfolio of ${SITE.creator}`}
            level="micro"
            trigger="view"
            delay={40}
          />
        </div>

        <nav aria-label="Footer" className="md:col-span-4">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV_LINKS.map((link, index) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[13px] text-silver transition-colors hover:text-paper"
                >
                  <ScrambleText
                    text={link.label}
                    level="micro"
                    trigger="view"
                    delay={80 + index * 30}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3 md:text-right">
          <a
            href={SITE.github}
            target="_blank"
            rel="noreferrer"
            className="mono-meta inline-flex items-center gap-1.5 text-silver transition-colors hover:text-paper"
          >
            <ScrambleText
              text="GitHub"
              level="micro"
              trigger="view"
              delay={200}
            />
            <ArrowUpRight className="size-3" aria-hidden="true" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <ScrambleText
            as="p"
            className="mono-meta mt-1"
            text={SITE.domain.replace("https://", "")}
            level="micro"
            trigger="view"
            delay={240}
          />
          <ScrambleText
            as="p"
            className="mono-meta mt-1 text-ash"
            text={`© ${year}`}
            level="micro"
            trigger="view"
            delay={280}
          />
        </div>
      </div>
    </footer>
  );
}
