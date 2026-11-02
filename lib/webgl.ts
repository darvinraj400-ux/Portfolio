export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!context) return false;

    const loseContext = context.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
    return true;
  } catch {
    return false;
  }
}
