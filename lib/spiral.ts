import type { ProjectCategoryId } from "@/lib/projects";

export type SpiralProject = {
  id: string;
  slug: string;
  name: string;
  category: ProjectCategoryId;
  categoryLabel: string;
  shortDescription: string;
  titleLines: string[];
};

export type SpiralProfileName = "desktop" | "mobile";

export type SpiralProfile = {
  turns: number;
  height: number;
  radiusBottom: number;
  radiusTop: number;
  pinch: number;
  scaleMin: number;
  scaleMax: number;
};

export type SpiralCardPlacement = {
  slot: number;
  projectIndex: number;
  angle: number;
  radius: number;
  y: number;
  scale: number;
  pitch: number;
  phase: number;
  floatSpeed: number;
};

export type SpiralLayout = {
  profile: SpiralProfileName;
  cards: SpiralCardPlacement[];
};

export const SPIRAL_PROFILES: Record<SpiralProfileName, SpiralProfile> = {
  desktop: {
    turns: 3.5,
    height: 7.4,
    radiusBottom: 5.6,
    radiusTop: 1.9,
    pinch: 0.65,
    scaleMin: 0.5,
    scaleMax: 0.8,
  },
  mobile: {
    turns: 3.8,
    height: 8.2,
    radiusBottom: 3.6,
    radiusTop: 1.35,
    pinch: 0.48,
    scaleMin: 0.46,
    scaleMax: 0.72,
  },
};

/** Coprime with 33, so every project lands in its own spiral slot. */
const SLOT_STRIDE = 13;

export function spiralSlot(projectIndex: number, projectCount: number): number {
  return (projectIndex * SLOT_STRIDE) % projectCount;
}

/**
 * Split a project name into at most two lines by choosing the break
 * with the shortest longest line. Short names stay on one line.
 */
export function splitTitle(name: string): string[] {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const words = trimmed.split(" ");
  if (words.length <= 1 || trimmed.length <= 14) return [trimmed];

  let bestBreak = 1;
  let bestLongest = Number.POSITIVE_INFINITY;

  for (let index = 1; index < words.length; index += 1) {
    const left = words.slice(0, index).join(" ");
    const right = words.slice(index).join(" ");
    const longest = Math.max(left.length, right.length);
    if (longest < bestLongest) {
      bestLongest = longest;
      bestBreak = index;
    }
  }

  return [
    words.slice(0, bestBreak).join(" "),
    words.slice(bestBreak).join(" "),
  ];
}

export function buildSpiralLayout(
  projectCount: number,
  profileName: SpiralProfileName,
): SpiralLayout {
  const profile = SPIRAL_PROFILES[profileName];
  const cards: SpiralCardPlacement[] = new Array(projectCount);
  const lastSlot = Math.max(projectCount - 1, 1);

  for (let projectIndex = 0; projectIndex < projectCount; projectIndex += 1) {
    const slot = spiralSlot(projectIndex, projectCount);
    const t = slot / lastSlot;

    // More air at the base, roughly a third tighter toward the crown.
    const vertical = (t - 0.18 * t * t) / 0.82;
    const y = (vertical - 0.5) * profile.height;

    const radius =
      profile.radiusBottom +
      (profile.radiusTop - profile.radiusBottom) * t -
      profile.pinch * Math.sin(Math.PI * t);

    const angle = t * profile.turns * Math.PI * 2 + 0.12 * Math.sin(t * 7.2 + 0.4);

    const span = profile.radiusBottom - profile.radiusTop;
    const taper = Math.pow(
      Math.max(0, Math.min(1, (radius - profile.radiusTop) / span)),
      0.8,
    );
    const scale =
      profile.scaleMin + (profile.scaleMax - profile.scaleMin) * taper;

    const dy = (profile.height * (1 - 0.36 * t)) / 0.82;
    const dAngle = profile.turns * Math.PI * 2 + 0.864 * Math.cos(t * 7.2 + 0.4);
    const pitch = -Math.atan2(dy, Math.max(radius * dAngle, 0.001)) * 0.55;

    cards[slot] = {
      slot,
      projectIndex,
      angle,
      radius,
      y,
      scale,
      pitch,
      phase: slot * 2.399963,
      floatSpeed: 0.21 + ((slot * 7) % 11) * 0.012,
    };
  }

  return { profile: profileName, cards };
}
