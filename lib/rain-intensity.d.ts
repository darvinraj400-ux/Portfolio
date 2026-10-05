/**
 * Rain intensity channel shared between the palette system (writer)
 * and the rain canvas (reader). Written by `setActivePalette` on every
 * tween tick so the rain swells and calms with the page — never
 * restarted, only modulated.
 */
declare global {
  interface Window {
    __rainIntensity?: number;
  }
}

export {};
