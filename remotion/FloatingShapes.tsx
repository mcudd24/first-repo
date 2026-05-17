import React from "react";
import { useCurrentFrame } from "remotion";

type ShapeDef = {
  x: number;   // % from left
  y: number;   // % from top
  size: number;
  color: string;
  speed: number;
  phase: number;
  opacity: number;
  blur: number;
};

export const FloatingShapes: React.FC<{ shapes: ShapeDef[] }> = ({ shapes }) => {
  const frame = useCurrentFrame();

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {shapes.map((s, i) => {
        const x = s.x + Math.sin(frame * s.speed * 0.018 + s.phase) * 6;
        const y = s.y + Math.cos(frame * s.speed * 0.013 + s.phase * 1.3) * 5;
        const scale = 1 + Math.sin(frame * 0.025 + s.phase) * 0.12;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: s.color,
              opacity: s.opacity,
              transform: `translate(-50%, -50%) scale(${scale})`,
              filter: `blur(${s.blur}px)`,
            }}
          />
        );
      })}
    </div>
  );
};

// ── preset shape palettes per scene ─────────────────────────────────────────

export const HOOK_SHAPES: ShapeDef[] = [
  { x: 15, y: 20, size: 320, color: "#cc0000", speed: 1.0, phase: 0.0, opacity: 0.18, blur: 70 },
  { x: 80, y: 70, size: 280, color: "#880000", speed: 0.7, phase: 2.1, opacity: 0.14, blur: 60 },
  { x: 50, y: 90, size: 200, color: "#ff4400", speed: 1.3, phase: 4.2, opacity: 0.10, blur: 50 },
  { x: 85, y: 15, size: 150, color: "#cc2200", speed: 0.9, phase: 1.1, opacity: 0.12, blur: 45 },
];

export const BEFORE_SHAPES: ShapeDef[] = [
  { x: 10, y: 30, size: 260, color: "#441111", speed: 0.8, phase: 0.5, opacity: 0.25, blur: 65 },
  { x: 75, y: 20, size: 200, color: "#220000", speed: 1.1, phase: 3.0, opacity: 0.20, blur: 55 },
  { x: 50, y: 75, size: 300, color: "#331100", speed: 0.6, phase: 1.8, opacity: 0.18, blur: 70 },
  { x: 90, y: 60, size: 140, color: "#550022", speed: 1.4, phase: 5.0, opacity: 0.14, blur: 40 },
];

export const DISCOVERY_SHAPES: ShapeDef[] = [
  { x: 20, y: 15, size: 350, color: "#004499", speed: 1.0, phase: 0.3, opacity: 0.20, blur: 80 },
  { x: 80, y: 80, size: 300, color: "#006699", speed: 0.8, phase: 2.5, opacity: 0.18, blur: 75 },
  { x: 55, y: 45, size: 180, color: "#00AACC", speed: 1.2, phase: 1.1, opacity: 0.12, blur: 50 },
  { x: 15, y: 75, size: 220, color: "#003399", speed: 0.9, phase: 4.0, opacity: 0.15, blur: 60 },
  { x: 85, y: 25, size: 160, color: "#0077AA", speed: 1.5, phase: 0.8, opacity: 0.10, blur: 45 },
];

export const MONTAGE_SHAPES: ShapeDef[] = [
  { x: 20, y: 20, size: 280, color: "#004477", speed: 1.1, phase: 0.2, opacity: 0.22, blur: 70 },
  { x: 75, y: 65, size: 260, color: "#006688", speed: 0.9, phase: 2.8, opacity: 0.18, blur: 65 },
  { x: 45, y: 85, size: 200, color: "#00C4E8", speed: 1.3, phase: 1.5, opacity: 0.10, blur: 55 },
  { x: 88, y: 30, size: 170, color: "#002255", speed: 0.7, phase: 3.5, opacity: 0.16, blur: 50 },
];

export const AFTER_SHAPES: ShapeDef[] = [
  { x: 15, y: 25, size: 300, color: "#004400", speed: 0.9, phase: 0.4, opacity: 0.22, blur: 75 },
  { x: 78, y: 72, size: 280, color: "#006600", speed: 1.1, phase: 2.2, opacity: 0.18, blur: 70 },
  { x: 50, y: 50, size: 220, color: "#00aa44", speed: 0.7, phase: 1.6, opacity: 0.12, blur: 60 },
  { x: 88, y: 18, size: 160, color: "#00cc66", speed: 1.4, phase: 4.5, opacity: 0.10, blur: 45 },
  { x: 10, y: 80, size: 190, color: "#003322", speed: 1.0, phase: 3.0, opacity: 0.14, blur: 55 },
];

export const CTA_SHAPES: ShapeDef[] = [
  { x: 12, y: 18, size: 320, color: "#003399", speed: 0.8, phase: 0.6, opacity: 0.22, blur: 80 },
  { x: 82, y: 75, size: 290, color: "#006699", speed: 1.0, phase: 2.0, opacity: 0.18, blur: 75 },
  { x: 50, y: 92, size: 250, color: "#00AACC", speed: 1.2, phase: 1.4, opacity: 0.14, blur: 65 },
  { x: 90, y: 35, size: 180, color: "#004488", speed: 0.7, phase: 3.8, opacity: 0.16, blur: 55 },
  { x: 25, y: 60, size: 200, color: "#0055BB", speed: 1.3, phase: 0.9, opacity: 0.12, blur: 50 },
];
