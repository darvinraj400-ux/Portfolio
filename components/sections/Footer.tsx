import { SITE } from "@/lib/constants";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-palette="neutral" className="border-t border-border px-6 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {SITE.domain.replace("https://", "")} — © {year}
        </p>
        <p className="text-sm text-muted-foreground">Built by hand with Next.js, GSAP, and Magic UI.</p>
      </div>
    </footer>
  );
}
