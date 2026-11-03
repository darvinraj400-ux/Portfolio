"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import SoundControl from "@/components/audio/SoundControl";
import ScrambleText from "@/components/motion/ScrambleText";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { getLenisInstance, scrollToId } from "@/lib/scroll";
import { cn } from "@/lib/utils";

type ActiveKey = "home" | "projects" | "about" | "contact";

const OBSERVED_IDS = ["top", "about", "services", "skills", "contact"] as const;

function activeFromHref(href: string): ActiveKey {
  if (href === "/") return "home";
  if (href.startsWith("/projects")) return "projects";
  if (href.includes("about")) return "about";
  return "contact";
}

function activeFromSection(id: string): ActiveKey | null {
  if (id === "top") return "home";
  if (id === "about") return "about";
  if (id === "contact") return "contact";
  return null;
}

export default function Nav({ projectCount }: { projectCount: number }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [section, setSection] = useState<ActiveKey | null>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingSection = useRef<string | null>(null);

  const active: ActiveKey | null =
    pathname.startsWith("/projects") || pathname.startsWith("/work")
      ? "projects"
      : isHome
        ? section
        : null;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      if (
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2
      ) {
        setSection("contact");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const sections = OBSERVED_IDS.map((id) =>
      document.getElementById(id),
    ).filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSection(activeFromSection(entry.target.id));
          }
        }
      },
      { rootMargin: "-42% 0px -52% 0px" },
    );
    for (const el of sections) observer.observe(el);
    return () => observer.disconnect();
  }, [isHome]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = [
        toggleRef.current,
        ...panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ].filter((el): el is HTMLElement => el !== null);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const lenis = getLenisInstance();
    lenis?.stop?.();
    panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = previousOverflow;
      lenis?.start?.();
      // The menu held the scroll lock, so a link's scroll request is replayed
      // here after the document is released; scrolling earlier is dropped.
      if (pendingSection.current) {
        const target = pendingSection.current;
        pendingSection.current = null;
        scrollToId(target);
      }
    };
  }, [open]);

  const navigateToSection = (target: string) => {
    if (!open) {
      scrollToId(target);
      return;
    }
    pendingSection.current = target;
    setOpen(false);
  };

  const resolveHref = (href: string) =>
    isHome && href.startsWith("/#") ? href.slice(1) : href;

  const handleNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!isHome) return;
    if (
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    if (href === "/") {
      event.preventDefault();
      navigateToSection("#top");
      window.history.replaceState(null, "", "/");
      return;
    }

    if (href.startsWith("/#")) {
      const id = `#${href.slice(2)}`;
      if (!document.getElementById(id.slice(1))) return;
      event.preventDefault();
      navigateToSection(id);
      window.history.replaceState(null, "", id);
    }
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 border-b bg-background/95 backdrop-blur-xl transition-colors duration-300",
          scrolled || open ? "border-line" : "border-transparent",
        )}
      >
      <nav
        aria-label="Primary"
        className="shell flex h-16 items-center justify-between gap-6"
      >
        <Link
          href="/"
          aria-label="DARVINN STUDIO — home"
          onClick={(event) => handleNavClick(event, "/")}
          className="group flex items-baseline gap-2"
        >
          <span className="text-[13px] font-semibold tracking-tight text-paper">
            <ScrambleText
              text="DARVINN"
              level="micro"
              trigger="after-intro"
              delay={0}
            />
          </span>
          <span className="mono-meta text-silver transition-colors group-hover:text-paper">
            <ScrambleText
              text="STUDIO"
              level="micro"
              trigger="after-intro"
              delay={40}
            />
          </span>
        </Link>

        <ul className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link, index) => {
            const key = activeFromHref(link.href);
            const isActive = active === key;
            return (
              <li key={link.href}>
                <Link
                  href={resolveHref(link.href)}
                  onClick={(event) => handleNavClick(event, link.href)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex items-baseline gap-1.5 border-b pb-1 text-[13px] transition-colors",
                    isActive
                      ? "border-paper text-paper"
                      : "border-transparent text-silver hover:border-line-strong hover:text-paper",
                  )}
                >
                  <ScrambleText
                    text={link.label}
                    level="micro"
                    trigger="after-intro"
                    delay={80 + index * 40}
                  />
                  {key === "projects" ? (
                    <span
                      aria-hidden="true"
                      className="font-mono text-[10px] text-ash"
                    >
                      {projectCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <SoundControl />
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex size-10 items-center justify-center border border-line text-paper transition-colors hover:border-line-strong md:hidden"
          >
            {open ? (
              <X className="size-4" aria-hidden="true" />
            ) : (
              <Menu className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>
      </header>

      {open ? (
        <div
          id="mobile-menu"
          ref={panelRef}
          data-lenis-prevent
          className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto overscroll-contain border-t border-line bg-background md:hidden"
        >
          <nav
            aria-label="Mobile"
            className="shell flex min-h-full flex-col justify-between pb-10 pt-6"
          >
            <ul className="border-y border-line">
              {NAV_LINKS.map((link) => {
                const key = activeFromHref(link.href);
                const isActive = active === key;
                return (
                  <li key={link.href} className="border-b border-line last:border-b-0">
                    <Link
                      href={resolveHref(link.href)}
                      onClick={(event) => handleNavClick(event, link.href)}
                      aria-current={isActive ? "page" : undefined}
                      className="flex items-baseline justify-between py-5"
                    >
                      <span
                        className={cn(
                          "text-2xl font-medium tracking-tight",
                          isActive ? "text-paper" : "text-silver",
                        )}
                      >
                        <ScrambleText
                          text={link.label}
                          level="heading"
                          trigger="mount"
                        />
                      </span>
                      {key === "projects" ? (
                        <span className="mono-meta text-ash">
                          {projectCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-10 space-y-2">
              <p className="mono-meta text-ash">
                {projectCount} selected projects
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mono-meta text-silver transition-colors hover:text-paper"
              >
                {SITE.email}
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
