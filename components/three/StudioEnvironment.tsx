"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import type { Theme } from "@/lib/theme";

/**
 * One procedural softbox environment, generated once per theme per canvas and
 * reused by every card material in that scene.
 */
export default function StudioEnvironment({
  theme = "dark",
}: {
  theme?: Theme;
}) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const light = theme === "light";

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = light ? "#d8d7d2" : "#030303";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (light) {
      sky.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      sky.addColorStop(0.32, "rgba(255, 255, 255, 0.35)");
      sky.addColorStop(0.68, "rgba(255, 255, 255, 0.08)");
      sky.addColorStop(1, "rgba(38, 38, 36, 0.42)");
    } else {
      sky.addColorStop(0, "rgba(255, 255, 255, 0.12)");
      sky.addColorStop(0.32, "rgba(255, 255, 255, 0.03)");
      sky.addColorStop(0.68, "rgba(0, 0, 0, 0)");
      sky.addColorStop(1, "rgba(255, 255, 255, 0.06)");
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.filter = "blur(46px)";

    const key = ctx.createRadialGradient(250, 140, 16, 250, 140, 200);
    key.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    key.addColorStop(0.45, "rgba(255, 255, 255, 0.32)");
    key.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, 500, 340);

    const fill = ctx.createRadialGradient(770, 200, 10, 770, 200, 170);
    fill.addColorStop(
      0,
      light ? "rgba(255, 255, 255, 0.85)" : "rgba(226, 232, 238, 0.6)",
    );
    fill.addColorStop(
      0.5,
      light ? "rgba(255, 255, 255, 0.4)" : "rgba(226, 232, 238, 0.16)",
    );
    fill.addColorStop(1, "rgba(226, 232, 238, 0)");
    ctx.fillStyle = fill;
    ctx.fillRect(540, 20, 480, 380);

    const bounce = ctx.createRadialGradient(500, 480, 10, 500, 480, 260);
    bounce.addColorStop(
      0,
      light ? "rgba(22, 22, 21, 0.5)" : "rgba(255, 255, 255, 0.16)",
    );
    bounce.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = bounce;
    ctx.fillRect(180, 320, 660, 200);
    ctx.restore();

    const source = new THREE.CanvasTexture(canvas);
    source.mapping = THREE.EquirectangularReflectionMapping;
    source.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    const target = pmrem.fromEquirectangular(source);
    scene.environment = target.texture;

    source.dispose();
    pmrem.dispose();

    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, light, scene]);

  return null;
}
