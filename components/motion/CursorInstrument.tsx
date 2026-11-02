"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { CARD_HOVER_EVENT } from "@/lib/cursor-signal";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const TARGET_SELECTOR =
  "a[href], button, [role='button'], summary, label, [data-cursor-target]";
const NATIVE_SELECTOR =
  "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
const RING_TAU = 0.03;

export default function CursorInstrument() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { reduced } = useMotionPreference();

  useEffect(() => {
    const root = rootRef.current;
    if (root) root.dataset.target = "false";
  }, [pathname]);

  useEffect(() => {
    const root = rootRef.current;
    const ring = root?.querySelector<HTMLElement>(".reticle-ring");
    if (!root || !ring || reduced) return;
    if (!window.matchMedia(FINE_POINTER).matches) return;

    const doc = document.documentElement;
    let visible = false;
    let pressed = false;
    let dialogOpen = false;
    let frame = 0;
    let lastTime = 0;
    let pointX = 0;
    let pointY = 0;
    let ringX = 0;
    let ringY = 0;

    const setTarget = (value: boolean) => {
      const next = value ? "true" : "false";
      if (root.dataset.target !== next) root.dataset.target = next;
    };

    const stopFrame = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const hide = () => {
      stopFrame();
      if (!visible) return;
      visible = false;
      root.dataset.visible = "false";
    };

    const step = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const ease = 1 - Math.exp(-dt / RING_TAU);
      ringX += (pointX - ringX) * ease;
      ringY += (pointY - ringY) * ease;
      const dx = ringX - pointX;
      const dy = ringY - pointY;
      if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15) {
        ringX = pointX;
        ringY = pointY;
        ring.style.transform = "translate3d(0, 0, 0)";
        frame = 0;
        return;
      }
      ring.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
      frame = requestAnimationFrame(step);
    };

    const startFrame = () => {
      if (frame) return;
      lastTime = performance.now();
      frame = requestAnimationFrame(step);
    };

    const showAt = (x: number, y: number, element: Element | null) => {
      const overControl =
        Boolean(element?.closest(TARGET_SELECTOR)) ||
        (element instanceof HTMLCanvasElement &&
          element.dataset.hover === "true");
      setTarget(overControl);
      pointX = x;
      pointY = y;
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!visible) {
        visible = true;
        ringX = x;
        ringY = y;
        ring.style.transform = "translate3d(0, 0, 0)";
        root.dataset.visible = "true";
      }
      if (!doc.dataset.cursor) doc.dataset.cursor = "instrument";
      startFrame();
    };

    const evaluate = (x: number, y: number, element: Element | null) => {
      pointX = x;
      pointY = y;
      if (dialogOpen || doc.hasAttribute("data-intro")) {
        hide();
        return;
      }
      const node =
        element ?? (document.elementFromPoint(x, y) as Element | null);
      if (node?.closest(NATIVE_SELECTOR)) {
        hide();
        return;
      }
      showAt(x, y, node);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      evaluate(
        event.clientX,
        event.clientY,
        event.target instanceof Element ? event.target : null,
      );
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || !visible || pressed) return;
      pressed = true;
      root.dataset.pressed = "true";
    };

    const clearPress = () => {
      if (!pressed) return;
      pressed = false;
      root.dataset.pressed = "false";
    };

    const onVisibility = () => {
      if (!document.hidden) return;
      hide();
      clearPress();
    };

    const onCardHover = (event: Event) => {
      if (!visible || dialogOpen || doc.hasAttribute("data-intro")) return;
      if ((event as CustomEvent<boolean>).detail) {
        setTarget(true);
        return;
      }
      const node = document.elementFromPoint(pointX, pointY);
      setTarget(Boolean(node?.closest(TARGET_SELECTOR)));
    };

    const syncDialog = () => {
      const open = Boolean(document.querySelector("dialog[open]"));
      if (open === dialogOpen) return;
      dialogOpen = open;
      if (open) {
        hide();
        return;
      }
      if (doc.dataset.cursor) evaluate(pointX, pointY, null);
    };

    const observer = new MutationObserver(syncDialog);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["open"],
      subtree: true,
    });

    window.addEventListener("pointermove", onMove, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointerdown", onDown, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointerup", clearPress, {
      capture: true,
      passive: true,
    });
    window.addEventListener("pointercancel", clearPress, {
      capture: true,
      passive: true,
    });
    window.addEventListener("blur", clearPress);
    window.addEventListener(CARD_HOVER_EVENT, onCardHover);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", clearPress, true);
      window.removeEventListener("pointercancel", clearPress, true);
      window.removeEventListener("blur", clearPress);
      window.removeEventListener(CARD_HOVER_EVENT, onCardHover);
      document.removeEventListener("visibilitychange", onVisibility);
      stopFrame();
      delete doc.dataset.cursor;
      delete root.dataset.visible;
      delete root.dataset.pressed;
      root.dataset.target = "false";
    };
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="reticle"
      data-visible="false"
      data-target="false"
      data-pressed="false"
    >
      <div className="reticle-ring">
        <div className="reticle-ticks">
          {["tl", "tr", "bl", "br"].map((corner) => (
            <span
              key={corner}
              className={`reticle-corner reticle-corner-${corner}`}
            >
              <span className="reticle-arm reticle-arm-x" />
              <span className="reticle-arm reticle-arm-y" />
            </span>
          ))}
        </div>
      </div>
      <span className="reticle-dot" />
    </div>
  );
}
