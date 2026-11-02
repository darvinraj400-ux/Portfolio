import type { Metadata } from "next";
import Link from "next/link";
import VortexStage from "@/components/vortex/VortexStage";
import { FULL_VORTEX_PROJECTS, VORTEX_PROJECTS } from "@/lib/vortex-config";
import { PROJECT_COUNT } from "@/lib/projects";

type VortexSearchParams = Record<string, string | string[] | undefined>;

type VortexPrototypePageProps = {
  searchParams: Promise<VortexSearchParams>;
};

function readPopulation(searchParams: VortexSearchParams) {
  const raw = searchParams.count;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "33" ? 33 : 5;
}

export async function generateMetadata({
  searchParams,
}: VortexPrototypePageProps): Promise<Metadata> {
  const full = readPopulation(await searchParams) === 33;
  return {
    title: full ? "Full 33-card vortex study" : "Five-card vortex study",
    description: full
      ? "Stage 1E physics experiment for DARVINN STUDIO: all 33 project cards inside one invisible vortex."
      : "Stage 1D physics experiment for DARVINN STUDIO: five project cards inside an invisible vortex.",
    robots: { index: false, follow: false },
  };
}

export default async function VortexPrototypePage({
  searchParams,
}: VortexPrototypePageProps) {
  const full = readPopulation(await searchParams) === 33;
  const projects = full ? FULL_VORTEX_PROJECTS : VORTEX_PROJECTS;

  const notes = full
    ? ([
        ["Bodies", "33 independent rigid bodies, one per project"],
        ["Wind", "Tangential, radial and vertical air, curl-noise turbulence"],
        ["Containment", "Soft invisible boundaries, no walls or snapping"],
        ["Selection", "Damped spring, wind reduced, the other 32 keep moving"],
        ["Archive", `${PROJECT_COUNT} projects in total; all represented here`],
      ] as const)
    : ([
        ["Bodies", "Five independent rigid bodies, quaternion orientation"],
        ["Wind", "Tangential, radial and vertical air, curl-noise turbulence"],
        ["Containment", "Soft invisible boundaries, no walls or snapping"],
        ["Selection", "Damped spring, wind reduced, other cards keep moving"],
        ["Archive", `${PROJECT_COUNT} projects in total; five shown here`],
      ] as const);

  return (
    <main id="main-content">
      <VortexStage projects={projects} />

      <section className="shell pb-24 pt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
          <p className="mono-meta">
            {full ? "Prototype / Stage 1E" : "Prototype / Stage 1D revision"}
          </p>
          <Link
            href="/"
            className="mono-meta text-ash transition-colors hover:text-paper"
          >
            DARVINN STUDIO
          </Link>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <h2 className="display text-[clamp(2rem,4.6vw,3.2rem)] text-paper">
              An airflow, not a carousel.
            </h2>
            {full ? (
              <>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-silver">
                  All 33 projects are simulated as independent rigid bodies
                  inside one invisible airflow. Nothing is repeated to fill the
                  vortex and there is no second inventory: every card carries
                  its canonical number, title and category. There is no
                  rotating group, no visible funnel and no fixed track —
                  tangential, radial and vertical wind carry each card, while
                  coherent turbulence changes how it turns.
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-silver">
                  The viewport stays pinned as you scroll. Scrolling adds energy
                  to the air, scrolling up reverses its circulation, and the
                  field settles when you stop. Selecting a card brings it to a
                  readable foreground position with a damped spring without
                  stopping the other 32.
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash">
                  The homepage now renders this full 33-card vortex. This route
                  remains an isolated preview; the previous spiral stays in the
                  working tree as a rollback. The approved five-card study is
                  preserved at{" "}
                  <Link
                    href="/prototype/vortex?count=5"
                    className="link-underline pb-0.5 text-silver transition-colors hover:text-paper"
                  >
                    ?count=5
                  </Link>
                  .
                </p>
              </>
            ) : (
              <>
                <p className="mt-6 max-w-xl text-sm leading-relaxed text-silver">
                  Five projects are simulated as independent rigid bodies inside
                  one invisible airflow. There is no rotating group, no visible
                  funnel and no fixed track: tangential, radial and vertical
                  wind fields carry each card, while coherent turbulence changes
                  how it turns.
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-silver">
                  The viewport stays pinned as you scroll. Scrolling adds energy
                  to the air, scrolling up reverses its circulation, and the
                  field settles when you stop. Selecting a card brings it to a
                  readable foreground position with a damped spring without
                  stopping the other four.
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-ash">
                  The homepage renders the full 33-card vortex. This five-card
                  study remains available as the approved physical reference
                  and rollback comparison.
                </p>
              </>
            )}
          </div>

          <div className="lg:col-span-5">
            <dl className="border-t border-line">
              {notes.map(([term, description]) => (
                <div
                  key={term}
                  className="flex items-baseline justify-between gap-6 border-b border-line py-3"
                >
                  <dt className="mono-meta text-ash">{term}</dt>
                  <dd className="max-w-[15rem] text-right text-[13px] leading-relaxed text-silver">
                    {description}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
              {full ? (
                <>
                  <Link
                    href="/prototype/vortex?count=5"
                    className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
                  >
                    Five-card study
                  </Link>
                  <Link
                    href="/prototype/vortex?count=33&fallback=1"
                    className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
                  >
                    Static fallback
                  </Link>
                  <Link
                    href="/prototype/vortex?count=33&debug=1"
                    className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
                  >
                    Physics diagnostics
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/prototype/vortex?count=33"
                    className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
                  >
                    Full 33-card study
                  </Link>
                  <Link
                    href="/prototype/vortex?fallback=1"
                    className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
                  >
                    Static fallback
                  </Link>
                  <Link
                    href="/prototype/vortex?debug=1"
                    className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
                  >
                    Physics diagnostics
                  </Link>
                </>
              )}
              <Link
                href="/prototype/card"
                className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
              >
                Card study
              </Link>
              <Link
                href="/projects"
                className="mono-meta link-underline pb-1 text-silver transition-colors hover:text-paper"
              >
                Project archive
              </Link>
            </div>

            <p className="mono-meta mt-6 text-ash">
              WebGL is required for movement. Without it,{" "}
              {full
                ? "the 33 cards are shown as a static contact sheet"
                : "the five cards are shown as a static arrangement"}{" "}
              with the same keyboard controls.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
