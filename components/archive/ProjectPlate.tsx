const STROKE = "rgba(168,168,168,0.3)";
const BRIGHT = "rgba(232,232,232,0.62)";

/**
 * Abstract monochrome artwork for projects without a supplied cover.
 * Deterministic per project id — never a simulated interface.
 */
export default function ProjectPlate({
  id,
  seed = 0,
}: {
  id: string;
  seed?: number;
}) {
  const n = Number.parseInt(id, 10) || 1;
  const variant = (n + seed) % 4;
  const accent = 40 + ((n + seed * 2) % 11) * 27;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden bg-[#070707]"
    >
      <div className="studio-glow absolute inset-0" />
      <svg
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        {variant === 0 ? (
          <g stroke={STROKE}>
            <circle cx="232" cy="146" r="58" />
            <circle cx="232" cy="146" r="94" strokeDasharray="2 6" />
            <circle cx="232" cy="146" r="130" />
            <path d="M40 250 L360 74" stroke={BRIGHT} />
          </g>
        ) : null}

        {variant === 1 ? (
          <g stroke={STROKE}>
            {Array.from({ length: 13 }, (_, index) => (
              <line
                key={index}
                x1={34 + index * 28}
                y1="24"
                x2={34 + index * 28}
                y2="276"
              />
            ))}
            <line x1={accent} y1="24" x2={accent} y2="276" stroke={BRIGHT} />
            <line x1="34" y1="204" x2="366" y2="204" stroke={BRIGHT} />
          </g>
        ) : null}

        {variant === 2 ? (
          <g fill={STROKE}>
            {Array.from({ length: 96 }, (_, index) => {
              const column = index % 12;
              const row = Math.floor(index / 12);
              const emphasis = (column + row + n + seed) % 7 === 0;
              return (
                <circle
                  key={index}
                  cx={40 + column * 29}
                  cy={36 + row * 32}
                  r={emphasis ? 2.4 : 1.1}
                  opacity={emphasis ? 1 : 0.7}
                />
              );
            })}
            <rect x={accent} y="28" width="1" height="244" fill={BRIGHT} />
          </g>
        ) : null}

        {variant === 3 ? (
          <g stroke={STROKE}>
            {[64, 108, 152, 196, 240].map((radius) => (
              <path
                key={radius}
                d={`M36 272 A ${radius} ${radius} 0 0 1 ${36 + radius} ${272 - radius}`}
              />
            ))}
            <path d="M36 272 A 152 152 0 0 1 188 120" stroke={BRIGHT} />
          </g>
        ) : null}
      </svg>

      <span className="absolute left-4 top-4 h-px w-8 bg-white/25" />
      <span className="absolute bottom-3 right-4 font-mono text-4xl leading-none tracking-tighter tabular-nums text-white/15 sm:text-5xl">
        {id}
      </span>
    </div>
  );
}
