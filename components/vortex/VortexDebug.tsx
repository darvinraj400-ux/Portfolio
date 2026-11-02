"use client";

import { useEffect, useState, type RefObject } from "react";
import type {
  VortexDebugHandle,
  VortexInput,
  VortexScenarioName,
  VortexSnapshot,
} from "@/lib/vortex-types";

type VortexDebugProps = {
  handleRef: RefObject<VortexDebugHandle | null>;
  inputRef: RefObject<VortexInput>;
  reduced: boolean;
  sceneActive: boolean;
};

const value = (input: number, digits = 2) =>
  Number.isFinite(input) ? input.toFixed(digits) : "NaN";

const vector = (input: [number, number, number], digits = 2) =>
  `${input.map((entry) => value(entry, digits)).join(", ")}`;

const buttonClass =
  "border border-line px-2 py-1 text-[10px] text-silver transition-colors hover:border-line-strong hover:text-paper disabled:cursor-default disabled:text-graphite";

export default function VortexDebug({
  handleRef,
  inputRef,
  reduced,
  sceneActive,
}: VortexDebugProps) {
  const [snapshot, setSnapshot] = useState<VortexSnapshot | null>(null);

  useEffect(() => {
    let activeHandle: VortexDebugHandle | null = null;
    const read = () => {
      activeHandle = handleRef.current;
      if (!activeHandle) {
        setSnapshot(null);
        return;
      }
      activeHandle.setDiagnostics(true);
      setSnapshot(activeHandle.snapshot());
    };
    read();
    const id = window.setInterval(read, 220);
    return () => {
      window.clearInterval(id);
      activeHandle?.setDiagnostics(false);
    };
  }, [handleRef]);

  useEffect(() => {
    const target = window as unknown as Record<string, unknown>;
    target.__vortexQa = {
      snapshot: () => handleRef.current?.snapshot() ?? null,
      restoreTrace: () => handleRef.current?.restoreTrace() ?? null,
      scene: () => handleRef.current?.scene() ?? null,
      inventory: () => handleRef.current?.inventory() ?? [],
      collision: () => handleRef.current?.collisionReport() ?? null,
      resetCollision: () =>
        handleRef.current?.resetCollisionMetrics() ?? undefined,
      scenario: (name: string) =>
        handleRef.current?.applyScenario(name as VortexScenarioName) ?? false,
      gust: (energy: number, direction: 1 | -1) =>
        handleRef.current?.setGust(energy, direction) ?? undefined,
      select: (index: number | null) =>
        handleRef.current?.select(index) ?? undefined,
      lamp: () => handleRef.current?.lamp() ?? null,
      setLamp: (enabled: boolean) =>
        handleRef.current?.setLamp(enabled) ?? undefined,
      setFrozen: (frozen: boolean) =>
        handleRef.current?.setFrozen(frozen) ?? undefined,
      input: inputRef.current,
    };
    return () => {
      delete target.__vortexQa;
    };
  }, [handleRef, inputRef]);

  return (
    <div
      role="region"
      aria-label="Physics diagnostics"
      className="pointer-events-auto absolute right-2 top-2 z-40 max-h-[72%] w-[min(23rem,calc(100%-1rem))] overflow-y-auto border border-line bg-black/92 p-3 font-mono text-[10px] leading-relaxed text-ash backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <p className="text-[10px] text-silver">Physics diagnostics</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            className={buttonClass}
            disabled={reduced}
            onClick={() => {
              inputRef.current.scrollImpulse = Math.min(
                1.8,
                inputRef.current.scrollImpulse + 0.6,
              );
            }}
          >
            Gust
          </button>
          <button
            type="button"
            className={buttonClass}
            disabled={reduced}
            onClick={() => {
              inputRef.current.scrollDirection =
                inputRef.current.scrollDirection === 1 ? -1 : 1;
              inputRef.current.scrollImpulse = Math.min(
                1.8,
                inputRef.current.scrollImpulse + 0.35,
              );
            }}
          >
            Reverse
          </button>
        </div>
      </div>

      {!sceneActive ? (
        <p className="pt-2">No WebGL simulation running; static preview.</p>
      ) : !snapshot ? (
        <p className="pt-2">Waiting for the first physics frame.</p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 pt-2">
            <dt>time</dt>
            <dd className="text-right text-silver">
              {value(snapshot.time, 1)} s
            </dd>
            <dt>fps</dt>
            <dd className="text-right text-silver">{value(snapshot.fps, 0)}</dd>
            <dt>wind level</dt>
            <dd className="text-right text-silver">
              {value(snapshot.windLevel)}
            </dd>
            <dt>direction</dt>
            <dd className="text-right text-silver">
              {value(snapshot.spinDirection)}
            </dd>
            <dt>energy</dt>
            <dd className="text-right text-silver">
              {value(snapshot.windEnergy)}
            </dd>
            <dt>turbulence</dt>
            <dd className="text-right text-silver">
              {value(snapshot.turbulenceLevel)}
            </dd>
            <dt>step</dt>
            <dd className="text-right text-silver">
              {(snapshot.fixedStep * 1000).toFixed(1)} ms fixed
            </dd>
            <dt>step cost</dt>
            <dd className="text-right text-silver">
              {snapshot.stepMs.toFixed(3)} ms avg
            </dd>
            <dt>step peak</dt>
            <dd className="text-right text-silver">
              {snapshot.peakStepMs.toFixed(3)} ms
            </dd>
            <dt>substeps</dt>
            <dd className="text-right text-silver">
              {snapshot.stepsLastFrame}
            </dd>
            <dt>selected</dt>
            <dd className="text-right text-silver">
              {snapshot.selected ?? "none"}
            </dd>
          </dl>

          <div className="mt-2 border-t border-line pt-2">
            <p>
              health: {snapshot.health.finite ? "finite" : "NON-FINITE"} / v{" "}
              {value(snapshot.health.maxSpeed)} / w{" "}
              {value(snapshot.health.maxAngularSpeed)} / r{" "}
              {value(snapshot.health.maxRadiusRatio)} / sep{" "}
              {value(snapshot.health.minSeparation)} / y{" "}
              {value(snapshot.health.verticalOverrun)}
            </p>
          </div>

          <div className="mt-2 border-t border-line pt-2">
            <p className="text-silver">
              collisions / {snapshot.collision.activePairs} active ·{" "}
              {snapshot.collision.contactSteps} contact steps ·{" "}
              {snapshot.collision.overlapSteps} overlap
            </p>
            <p>
              penetration {value(snapshot.collision.maxPenetration, 4)} / clear{" "}
              {snapshot.collision.minClearance > 90
                ? "none"
                : value(snapshot.collision.minClearance, 4)}
            </p>
            <p>
              solver {snapshot.collision.solverIterations} · pgs{" "}
              {snapshot.collision.internalPgsIterations} · ccd{" "}
              {snapshot.collision.ccdSubsteps} · steps{" "}
              {snapshot.collision.stepCount}
            </p>
            {snapshot.collision.contacts.map((contact) => (
              <p key={`${contact.a}-${contact.b}`}>
                {contact.a}:{contact.b} d {value(contact.distance, 4)} / j{" "}
                {value(contact.impulse, 4)}
              </p>
            ))}
          </div>

          <div className="mt-2 border-t border-line pt-2">
            <p className="text-silver">
              distribution / low {snapshot.distribution.lower} · mid{" "}
              {snapshot.distribution.middle} · high{" "}
              {snapshot.distribution.upper}
            </p>
            <p>
              radial {snapshot.distribution.inner}/{snapshot.distribution.mid}/
              {snapshot.distribution.outer} · depth{" "}
              {snapshot.distribution.depthBack}/{snapshot.distribution.depthMid}/
              {snapshot.distribution.depthFront}
            </p>
            <p>
              gap mean {value(snapshot.distribution.meanPairGap)} / min{" "}
              {value(snapshot.distribution.minGap)} / near{" "}
              {value(snapshot.distribution.meanNearestGap)}
            </p>
            <p>
              spread y {value(snapshot.distribution.verticalSpread)} / r{" "}
              {value(snapshot.distribution.radialSpread)} / z{" "}
              {value(snapshot.distribution.depthSpread)}
            </p>
            <p>
              crowd{" "}
              {snapshot.distribution.crowdings
                .map((entry) => value(entry))
                .join(" / ")}
            </p>
          </div>

          <ul className="mt-2 space-y-2 border-t border-line pt-2">
            {snapshot.bodies.map((body) => (
              <li
                key={body.id}
                className={
                  body.selected ? "border-l border-paper pl-2" : "pl-2"
                }
              >
                <p className="text-silver">
                  {body.id} {body.name}
                  {body.selected ? " / selected" : ""}
                </p>
                <p>p {vector(body.position)}</p>
                <p>y {value(body.position[1])} r {value(body.radiusRatio)}</p>
                <p>v {vector(body.velocity)} | {value(body.speed)}</p>
                <p>
                  w {vector(body.angularVelocity)} |{" "}
                  {value(body.angularSpeed)}
                </p>
                <p>
                  wind {value(body.localWindSpeed)} / m {value(body.mass)} / d{" "}
                  {value(body.drag)} / ad {value(body.angularDrag)} / wr{" "}
                  {value(body.windResponse)}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
