"use client";

import { useEffect, useRef, useState } from "react";

type Drop = {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
};

type LayerSpec = {
  baseCount: number;
  cap: number;
  thickness: number;
  minLen: number;
  maxLen: number;
  minSpeed: number;
  maxSpeed: number;
  minAlpha: number;
  maxAlpha: number;
  color: [number, number, number];
};

// Calibrated for 1440x900; counts scale with viewport area.
const FAR: LayerSpec = {
  baseCount: 120,
  cap: 200,
  thickness: 1,
  minLen: 8,
  maxLen: 14,
  minSpeed: 240,
  maxSpeed: 360,
  minAlpha: 0.05,
  maxAlpha: 0.12,
  color: [180, 200, 230],
};

const NEAR: LayerSpec = {
  baseCount: 60,
  cap: 100,
  thickness: 1.5,
  minLen: 18,
  maxLen: 32,
  minSpeed: 600,
  maxSpeed: 900,
  minAlpha: 0.12,
  maxAlpha: 0.25,
  color: [220, 225, 235],
};

const REF_AREA = 1440 * 900;
const MAX_INTENSITY = 1.4;

const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);

function makeDrops(spec: LayerSpec, width: number, height: number): Drop[] {
  const areaScale = (width * height) / REF_AREA;
  const mobile = width < 768;
  let count = Math.round(spec.baseCount * areaScale * MAX_INTENSITY);
  if (mobile) count = Math.round(count / 2);
  count = Math.max(8, Math.min(spec.cap, count));
  return Array.from({ length: count }, () => spawn(spec, width, height));
}

function spawn(spec: LayerSpec, width: number, height: number): Drop {
  return {
    x: Math.random() * (width + 80) - 40,
    // Distributed over the full height so resizes never leave the
    // lower screen empty; recycle (not spawn) keeps the top fed.
    y: Math.random() * (height + 100) - 100,
    len: rand(spec.minLen, spec.maxLen),
    speed: rand(spec.minSpeed, spec.maxSpeed),
    alpha: rand(spec.minAlpha, spec.maxAlpha),
    width: spec.thickness,
  };
}

export type RainStats = {
  dropsDrawn: number;
  throttleScale: number;
  avgDrawMs: number;
  fps: number;
};

const stats: RainStats = {
  dropsDrawn: 0,
  throttleScale: 1,
  avgDrawMs: 0,
  fps: 0,
};

/** Debug/verification handle (mirrors getActivePaletteKey precedent). */
export function getRainStats(): RainStats {
  return { ...stats };
}

/**
 * Cinematic rain: fixed canvas behind all content, two depth layers,
 * wind drift, palette-driven intensity. Pure canvas + RAF — no library.
 * Pauses when the tab hides; throttles itself under sustained load.
 */
export default function RainBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lightningRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Initial false matches SSR so hydration agrees; the swap happens
    // before anything visible paints (the canvas starts transparent).
    setReducedMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let far = makeDrops(FAR, width, height);
    let near = makeDrops(NEAR, width, height);
    // Shared wind direction: 8-14deg from vertical, drifting +-2deg
    // on a 20s sine for an organic feel.
    const baseAngle = rand(8, 14) * (Math.PI / 180);
    const startTime = performance.now();

    let raf = 0;
    let running = true;
    let last = startTime;
    let slowStreak = 0;
    let goodStreak = 0;
    let throttleScale = 1;
    let drawAccum = 0;
    let drawFrames = 0;
    let fpsAccum = 0;
    let fpsFrames = 0;
    let nextFlash =
      startTime + 25000 + Math.random() * 25000;
    let flashStart = -1;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      far = makeDrops(FAR, width, height);
      near = makeDrops(NEAR, width, height);
    };
    resize();

    // Debounced: resize drags would otherwise reallocate every frame
    // and starve the screen. Also covers mobile URL-bar / zoom /
    // monitor moves via visualViewport (recomputes DPR too).
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeTimer = null;
        resize();
      }, 150);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        // Rebase the lightning clock: rAF timestamps jump forward
        // across the hide, which would otherwise guarantee an instant
        // flash (or freeze a mid-flash opacity) on return.
        const now = performance.now();
        last = now;
        flashStart = -1;
        if (lightningRef.current) lightningRef.current.style.opacity = "0";
        nextFlash = Math.max(nextFlash, now + 25000 + Math.random() * 25000);
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    const drawLayer = (
      drops: Drop[],
      spec: LayerSpec,
      intensity: number,
      angle: number,
    ) => {
      // Intensity modulates how many streaks render and how bright
      // they are. Count is normalized so 1.0 renders exactly the
      // allocated baseline and 1.4 renders the full allocation.
      // (Speed is modulated in stepLayer, not here.)
      const frac = Math.min(1, Math.max(0.06, intensity / MAX_INTENSITY));
      const alphaMult = Math.min(1.15, Math.max(0.35, intensity));
      const active = Math.round(drops.length * frac * throttleScale);
      const dx = Math.sin(angle);
      const dy = Math.cos(angle);
      for (let i = 0; i < active; i++) {
        const d = drops[i];
        const x2 = d.x - dx * d.len;
        const y2 = d.y - dy * d.len;
        const [r, g, b] = spec.color;
        const a = Math.min(1, d.alpha * alphaMult);
        const grad = ctx.createLinearGradient(x2, y2, d.x, d.y);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${a.toFixed(3)})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = d.width;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }
      return active;
    };

    const stepLayer = (
      drops: Drop[],
      widthBound: number,
      heightBound: number,
      dt: number,
      angle: number,
      speedMult: number,
    ) => {
      const dx = Math.sin(angle) * speedMult;
      const dy = Math.cos(angle) * speedMult;
      for (const d of drops) {
        d.x += dx * d.speed * dt;
        d.y += dy * d.speed * dt;
        if (d.y - d.len > heightBound) {
          d.y = -d.len - Math.random() * 40;
          d.x = Math.random() * (widthBound + 80) - 40;
        }
        if (d.x > widthBound + 40) d.x -= widthBound + 80;
        if (d.x < -40) d.x += widthBound + 80;
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      const delta = now - last;
      last = now;

      // Adaptive throttle with hysteresis: shed fast (two slow frames),
      // recover slow (180 smooth frames). A sustained marginal regime
      // (~25ms) pins the current scale rather than oscillating.
      // Stepping runs over ALL allocated drops even when culled from
      // drawing — deliberate, so intensity ramps resume seamlessly.
      if (delta > 33) {
        slowStreak++;
        goodStreak = 0;
        if (slowStreak >= 2) {
          throttleScale = Math.max(0.4, throttleScale * 0.7);
          slowStreak = 0;
        }
      } else {
        slowStreak = 0;
        if (delta < 20) {
          goodStreak++;
          if (goodStreak >= 180) {
            throttleScale = Math.min(1, throttleScale * 1.3);
            goodStreak = 0;
          }
        } else {
          goodStreak = 0;
        }
      }
      fpsAccum += delta;
      fpsFrames++;

      const dt = Math.min(delta / 1000, 0.05);
      const rawIntensity =
        typeof window !== "undefined" ? Number(window.__rainIntensity) : NaN;
      const intensity = Number.isFinite(rawIntensity) ? rawIntensity : 1;
      const speedMult = Math.min(1.4, Math.max(0.3, intensity));
      const angle =
        baseAngle +
        Math.sin(((now - startTime) / 20000) * Math.PI * 2) *
          (2 * (Math.PI / 180));

      stepLayer(far, width, height, dt, angle, speedMult);
      stepLayer(near, width, height, dt, angle, speedMult);

      const drawStart = performance.now();
      ctx.clearRect(0, 0, width, height);
      let drawn = 0;
      drawn += drawLayer(far, FAR, intensity, angle);
      drawn += drawLayer(near, NEAR, intensity, angle);
      const drawMs = performance.now() - drawStart;
      drawAccum += drawMs;
      drawFrames++;
      stats.dropsDrawn = drawn;
      stats.throttleScale = Math.round(throttleScale * 100) / 100;
      stats.avgDrawMs =
        drawFrames > 0
          ? Math.round((drawAccum / drawFrames) * 100) / 100
          : 0;
      stats.fps =
        fpsFrames > 0
          ? Math.round(1000 / (fpsAccum / fpsFrames))
          : 0;

      // Double-flash lightning every 25-50s: primary ramps 0-80ms
      // and decays by 200ms; secondary ramps 200-240ms to 60% peak
      // and fades by 320ms. Single smooth envelope, no popping.
      const flashEl = lightningRef.current;
      if (flashEl) {
        if (flashStart < 0 && now >= nextFlash) {
          flashStart = now;
        }
        if (flashStart >= 0) {
          const t = now - flashStart;
          const peak = width < 768 ? 0.18 : 0.22;
          if (t < 80) {
            flashEl.style.opacity = `${((t / 80) * peak).toFixed(3)}`;
          } else if (t < 200) {
            flashEl.style.opacity = `${(peak * (1 - (t - 80) / 120)).toFixed(3)}`;
          } else if (t < 240) {
            flashEl.style.opacity = `${(((t - 200) / 40) * peak * 0.6).toFixed(3)}`;
          } else if (t < 320) {
            flashEl.style.opacity = `${(peak * 0.6 * (1 - (t - 240) / 80)).toFixed(3)}`;
          } else {
            flashEl.style.opacity = "0";
            flashStart = -1;
            nextFlash = now + 25000 + Math.random() * 25000;
          }
        }
      }
    };

    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    raf = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (resizeTimer !== null) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 print:hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] to-[#14131a]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 print:hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Warm lamp glow, bottom-left. The element breathes 0.06-0.10;
          composed with the gradient stop this peaks at ~0.08 effective. */}
      <div
        className="animate-lamp-breathe absolute inset-0"
        style={{
          background:
            "radial-gradient(600px at 0% 100%, rgba(255,180,100,0.8), transparent 70%)",
        }}
      />
      {/* Vignette above rain, below content. Static. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* Lightning wash, driven from the RAF loop. Starts hidden.
          Element opacity carries the flash peaks (gradient is full
          strength so peaks read exactly). */}
      <div
        ref={lightningRef}
        className="absolute inset-x-0 top-0 h-[40vh]"
        style={{
          opacity: 0,
          background:
            "linear-gradient(to bottom, rgba(200,220,255,1), transparent 40%)",
        }}
      />
    </div>
  );
}
