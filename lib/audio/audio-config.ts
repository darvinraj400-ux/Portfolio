export type SoundSettings = {
  musicVolume: number;
  musicEnabled: boolean;
  clickEnabled: boolean;
};

export const DEFAULT_SETTINGS: SoundSettings = {
  musicVolume: 0.35,
  musicEnabled: true,
  clickEnabled: true,
};

export const SETTINGS_STORAGE_KEY = "darvin-sound-settings-v1";

export const MUSIC = {
  src: "/audio/music/late-night-studio",
  seconds: 30,
  fadeIn: 1.8,
} as const;

export const CLICK = {
  src: "/audio/interface/soft-click",
  gain: 0.55,
  cooldown: 0.12,
} as const;

const clampVolume = (value: number) =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

export function sanitizeSettings(value: unknown): SoundSettings | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.musicVolume !== "number") return null;
  return {
    musicVolume: clampVolume(record.musicVolume),
    musicEnabled:
      typeof record.musicEnabled === "boolean" ? record.musicEnabled : true,
    clickEnabled:
      typeof record.clickEnabled === "boolean" ? record.clickEnabled : true,
  };
}

export { clampVolume };
