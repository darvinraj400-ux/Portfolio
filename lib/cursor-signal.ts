export const CARD_HOVER_EVENT = "vortex-card-hover";

export function reportCardHover(hovered: boolean) {
  window.dispatchEvent(
    new CustomEvent<boolean>(CARD_HOVER_EVENT, { detail: hovered }),
  );
}
