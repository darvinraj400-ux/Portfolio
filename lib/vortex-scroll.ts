import type { VortexInput } from "./vortex-types";

/**
 * Scroll is measured, not inferred. A wheel event is only provisional intent:
 * it can turn the wind at once, but energy comes from page movement that
 * actually happened. Intent and scroll distance are reconciled, so the same
 * gesture cannot be counted twice and a gesture that scrolls nothing leaves
 * no energy behind.
 */

/** Wheel distance stops being provisional after this much silence. */
const INTENT_TTL_MS = 320;
/** Unadmitted scroll distance is dropped after this much silence. */
const CREDIT_TTL_MS = 220;
/** Ignore input while the page settles after mount or a zoom gesture. */
const STARTUP_GRACE_MS = 350;
/** Long enough to cover the smoothed scroll a zoom gesture leaves behind. */
const ZOOM_SUPPRESS_MS = 1200;
/** Wind energy admitted per second and available immediately, in energy units. */
const MAX_RATE = 2.6;
const BURST = 0.6;

export type VortexScrollConfig = {
  /** Energy per pixel of confirmed page scroll. */
  gain: number;
  /** A per-event jump beyond this is navigation or restoration, not scrolling. */
  teleportPx: number;
};

export type VortexScrollModel = {
  scroll: (position: number, now: number, active: boolean) => void;
  wheel: (deltaPx: number, now: number) => void;
  suppress: (now: number) => void;
};

export function createVortexScrollModel(
  input: VortexInput,
  config: VortexScrollConfig,
  position: number,
  now: number,
): VortexScrollModel {
  const gain = Math.max(config.gain, 0.0001);
  const teleportPx = Math.max(config.teleportPx, 1200);

  let lastY = position;
  const startedAt = now;
  let suppressUntil = 0;
  let tokens = BURST;
  let lastRefill = now;
  let credit = 0;
  let creditAt = now;
  let intent = 0;
  let intentAt = 0;

  const refill = (time: number) => {
    const elapsed = Math.min(Math.max(time - lastRefill, 0), 1000) / 1000;
    tokens = Math.min(BURST, tokens + elapsed * MAX_RATE);
    lastRefill = time;
  };

  const admit = (time: number) => {
    if (credit === 0) return;
    refill(time);
    const admitDirection: 1 | -1 = credit > 0 ? 1 : -1;
    const demand = Math.abs(credit) * gain;
    const admitted = Math.min(demand, tokens);
    if (admitted <= 0) return;
    tokens -= admitted;
    input.scrollImpulse += admitted;
    credit = admitDirection * (Math.abs(credit) - admitted / gain);
  };

  return {
    scroll(positionValue, time, active) {
      const delta = positionValue - lastY;
      lastY = positionValue;
      if (delta === 0 || !Number.isFinite(delta)) return;
      if (
        time - startedAt < STARTUP_GRACE_MS ||
        time < suppressUntil ||
        !active
      ) {
        credit = 0;
        return;
      }
      if (Math.abs(delta) > teleportPx) {
        credit = 0;
        return;
      }

      if (intent !== 0) {
        if (time - intentAt > INTENT_TTL_MS) {
          intent = 0;
        } else if (Math.sign(intent) === Math.sign(delta)) {
          intent =
            Math.sign(intent) *
            Math.max(0, Math.abs(intent) - Math.abs(delta));
        }
      }

      if (
        credit !== 0 &&
        (Math.sign(credit) !== Math.sign(delta) ||
          time - creditAt > CREDIT_TTL_MS)
      ) {
        credit = 0;
      }
      credit += delta;
      creditAt = time;

      if (Math.abs(delta) >= 2) {
        input.scrollDirection = delta > 0 ? 1 : -1;
      }
      admit(time);
    },

    wheel(deltaPx, time) {
      if (!Number.isFinite(deltaPx) || Math.abs(deltaPx) < 0.5) return;
      if (time - startedAt < STARTUP_GRACE_MS || time < suppressUntil) return;
      const direction: 1 | -1 = deltaPx > 0 ? 1 : -1;
      if (intent !== 0 && Math.sign(intent) !== direction) intent = 0;
      intent += deltaPx;
      intentAt = time;
      if (Math.abs(deltaPx) >= 2) input.scrollDirection = direction;
    },

    suppress(time) {
      suppressUntil = time + ZOOM_SUPPRESS_MS;
      credit = 0;
      intent = 0;
    },
  };
}
