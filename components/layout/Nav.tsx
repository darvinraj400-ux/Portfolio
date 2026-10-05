"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { scrollToId } from "@/lib/scroll";

type ActiveKey = "work" | "about" | "contact";

const OBSERVED_IDS = [
  "work",
  "products",
  "about",
  "services",
  "skills",
  "contact",
] as const;

function idToActive(id: string): ActiveKey | null {
  if (id === "work" || id === "products") return "work";
  if (id === "about") return "about";
  if (id === "contact") return "contact";
  // services / skills intentionally clear the highlight.
  return null;
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<ActiveKey | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      // Bottom-of-page fallback: the contact section is short enough that
      // it can clamp before entering the observer band.
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
      ) {
        setActive("contact");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = OBSERVED_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(idToActive(entry.target.id));
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActive(idToActive(href.replace("#", "")));
    scrollToId(href);
    // Reflect the section in the URL (replace, not push) so deep links
    // and copied URLs work without polluting back-button history.
    window.history.replaceState(null, "", href);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur transition-colors duration-200 ${
        scrolled
          ? "border-border bg-background/90"
          : "border-transparent bg-background/70"
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6"
      >
        <Link
          href="#top"
          onClick={handleNavClick("#top")}
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          {SITE.name}
        </Link>
        <ul className="flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive = active === idToActive(link.href.replace("#", ""));
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={handleNavClick(link.href)}
                  aria-current={isActive ? "location" : undefined}
                  className={`text-sm transition-colors hover:text-foreground ${
                    isActive
                      ? "text-foreground underline underline-offset-8"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
