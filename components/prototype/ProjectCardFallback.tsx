import { cn } from "@/lib/utils";

type ProjectCardFallbackProps = {
  index: string;
  titleLines: string[];
  category: string;
  total: number;
  hovered: boolean;
  selected: boolean;
  className?: string;
};

const CHROME_BASE =
  "linear-gradient(180deg, #8f8f92 0%, #c9c9cb 28%, #a2a2a5 52%, #4a4a4d 70%, #161618 86%, #040405 100%)";

const CHROME_GROUND =
  "linear-gradient(180deg, rgba(34,34,38,0) 0%, rgba(34,34,38,0.32) 16%, rgba(24,24,27,0.78) 34%, rgba(17,17,19,0.96) 60%, #08080a 100%)";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function ProjectCardFallback({
  index,
  titleLines,
  category,
  total,
  hovered,
  selected,
  className,
}: ProjectCardFallbackProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-full w-full overflow-hidden rounded-[10px] border bg-[#070708] transition-[transform,border-color,box-shadow] duration-300 ease-out",
        selected
          ? "-translate-y-1.5 scale-[1.02] border-white/80 shadow-[0_36px_90px_-40px_rgba(255,255,255,0.32)]"
          : hovered
            ? "-translate-y-1 scale-[1.015] border-white/45 shadow-[0_36px_90px_-40px_rgba(255,255,255,0.2)]"
            : "border-white/20 shadow-[0_36px_90px_-40px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(155deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 32%, rgba(0,0,0,0.24) 64%, rgba(255,255,255,0.04) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(120% 90% at 68% 0%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />
      <div className="pointer-events-none absolute inset-[5%] rounded-[7px] border border-white/[0.14]" />

      <div className="pointer-events-none absolute left-[61.3%] top-[36.6%] w-[37.1%] -translate-x-1/2 -translate-y-1/2">
        <div
          className="relative aspect-square w-full overflow-hidden rounded-full border border-white/[0.08]"
          style={{ backgroundImage: CHROME_BASE }}
        >
          <div
            className="absolute inset-x-0 bottom-0 top-[50%]"
            style={{ backgroundImage: CHROME_GROUND }}
          />
          <div className="absolute inset-x-0 top-0 h-[61%] overflow-hidden [mask-image:linear-gradient(to_bottom,black_72%,transparent_100%)]">
            <div className="absolute left-[14%] top-[4%] h-[102%] w-[15%] -rotate-[16deg] rounded-full bg-white/90 blur-[4px]" />
            <div className="absolute left-[5%] top-[1%] h-[116%] w-[34%] -rotate-[16deg] rounded-full bg-white/15 blur-[10px]" />
            <div className="absolute right-[8%] top-[22%] h-[52%] w-[7%] rotate-[4deg] rounded-full bg-white/25 blur-[5px]" />
          </div>
          <div className="absolute left-[45%] top-[66%] h-[18%] w-[11%] bg-white/10 blur-[8px]" />
          <div className="absolute inset-0 rounded-full shadow-[inset_14px_18px_26px_rgba(255,255,255,0.14),inset_-16px_-20px_30px_rgba(0,0,0,0.55)]" />
        </div>
      </div>

      <div className="relative flex h-full flex-col p-7 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.18em] text-[#d6d6d6]">
            DARVINN STUDIO
          </p>
          <p className="font-mono text-[10px] tracking-[0.18em] text-ash">
            {index} / {String(total).padStart(2, "0")}
          </p>
        </div>
        <div className="mt-4 h-px w-full bg-white/10" />

        <div className="flex-1" />

        <div className="relative">
          <p className="font-mono text-[10px] tracking-[0.14em] text-ash">
            {category}
          </p>
          <p className="mt-2 text-[clamp(1.85rem,6vw,2.6rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-paper">
            {titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
          <div className="mt-5 h-px w-full bg-white/10" />
          <div className="mt-3 flex items-baseline justify-between gap-4">
            <p className="font-mono text-[10px] tracking-[0.12em] text-ash">
              Placeholder artwork
            </p>
            <p className="font-mono text-[10px] tracking-[0.18em] text-[#d6d6d6]">
              2026
            </p>
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
