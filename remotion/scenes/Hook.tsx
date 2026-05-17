import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FloatingShapes, HOOK_SHAPES } from "../FloatingShapes";

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const emojiOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const bgFlash = interpolate(frame, [0, 5, 10], [1, 0.3, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const subtitleY = interpolate(frame, [35, 55], [30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <FloatingShapes shapes={HOOK_SHAPES} />
      {/* Red flash overlay */}
      <AbsoluteFill
        style={{
          backgroundColor: "#cc0000",
          opacity: bgFlash * 0.15,
        }}
      />

      {/* Blood test icon */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 32,
        }}
      >
        {/* Test kit visual */}
        <div
          style={{
            width: 160,
            height: 260,
            background: "linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 40px rgba(204,0,0,0.5)",
            transform: `scale(${titleScale})`,
            gap: 12,
          }}
        >
          <div style={{ fontSize: 64 }}>🩸</div>
          <div
            style={{
              width: 80,
              height: 6,
              backgroundColor: "#cc0000",
              borderRadius: 3,
            }}
          />
          <div style={{ fontSize: 13, color: "#333", fontFamily: "sans-serif", fontWeight: 700 }}>
            ZINZINO TEST
          </div>
        </div>

        {/* Main headline */}
        <div
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 52,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            padding: "0 48px",
            transform: `scale(${titleScale})`,
          }}
        >
          I tested my blood and the results{" "}
          <span style={{ color: "#cc0000" }}>terrified me</span>
        </div>

        {/* Emoji */}
        <div style={{ fontSize: 72, opacity: emojiOpacity }}>😰</div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 30,
            color: "#aaaaaa",
            textAlign: "center",
            padding: "0 60px",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          Here's what I found out…
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
