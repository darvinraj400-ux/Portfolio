export type ChainState = {
  angle: number;
  angularVelocity: number;
  stretch: number;
  stretchVelocity: number;
  tilt: number;
  skew: number;
};

export const CHAIN = {
  arm: 92,
  maxAngle: 0.9,
  maxStretch: 46,
  gravity: 62,
  angularDamping: 3.4,
  stretchSpring: 210,
  stretchDamping: 16,
  releaseAngularMax: 7,
  releaseStretchMax: 300,
  settleAngle: 0.0025,
  settleAngularVelocity: 0.004,
  settleStretch: 0.2,
  settleStretchVelocity: 2,
  settleSecondary: 0.0015,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function createChainState(): ChainState {
  return {
    angle: 0,
    angularVelocity: 0,
    stretch: 0,
    stretchVelocity: 0,
    tilt: 0,
    skew: 0,
  };
}

export function releaseChain(
  state: ChainState,
  horizontalVelocity: number,
  verticalVelocity: number,
) {
  state.angularVelocity = clamp(
    horizontalVelocity / CHAIN.arm,
    -CHAIN.releaseAngularMax,
    CHAIN.releaseAngularMax,
  );
  state.stretchVelocity = clamp(
    verticalVelocity * 0.35,
    -260,
    CHAIN.releaseStretchMax,
  );
}

/** Advances the pendulum and cord spring. Returns true once motion has settled. */
export function stepChain(
  state: ChainState,
  elapsedSeconds: number,
  dragging: boolean,
) {
  const dt = Math.min(Math.max(elapsedSeconds, 0), 1 / 20);
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  const tiltRate = 1 - Math.exp(-h * 16);
  const skewRate = 1 - Math.exp(-h * 9);

  for (let step = 0; step < steps; step += 1) {
    if (!dragging) {
      const angularAccel =
        -CHAIN.gravity * Math.sin(state.angle) -
        CHAIN.angularDamping * state.angularVelocity;
      state.angularVelocity += angularAccel * h;
      state.angle += state.angularVelocity * h;
      if (Math.abs(state.angle) > CHAIN.maxAngle) {
        state.angle = Math.sign(state.angle) * CHAIN.maxAngle;
        state.angularVelocity *= -0.3;
      }

      const stretchAccel =
        -CHAIN.stretchSpring * state.stretch -
        CHAIN.stretchDamping * state.stretchVelocity;
      state.stretchVelocity += stretchAccel * h;
      state.stretch += state.stretchVelocity * h;
      if (state.stretch < 0) {
        state.stretch = 0;
        // The cord is taut: only a faint secondary bounce is possible.
        state.stretchVelocity = Math.abs(state.stretchVelocity) * 0.18;
      } else if (state.stretch > CHAIN.maxStretch + 12) {
        state.stretch = CHAIN.maxStretch + 12;
        state.stretchVelocity = Math.min(0, state.stretchVelocity);
      }
    }

    const tiltTarget = clamp(-state.angularVelocity * 0.04, -0.2, 0.2);
    state.tilt += (tiltTarget - state.tilt) * tiltRate;
    const skewTarget = clamp(-state.angularVelocity * 0.05, -0.06, 0.06);
    state.skew += (skewTarget - state.skew) * skewRate;
  }

  if (dragging) return false;

  return (
    Math.abs(state.angle) < CHAIN.settleAngle &&
    Math.abs(state.angularVelocity) < CHAIN.settleAngularVelocity &&
    state.stretch < CHAIN.settleStretch &&
    Math.abs(state.stretchVelocity) < CHAIN.settleStretchVelocity &&
    Math.abs(state.tilt) < CHAIN.settleSecondary &&
    Math.abs(state.skew) < CHAIN.settleSecondary
  );
}
