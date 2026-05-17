import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FloatingShapes, AFTER_SHAPES } from "../FloatingShapes";

export const AfterReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Before card
  const beforeScale = spring({ frame: frame - 20, fps, config: { damping: 14, stiffness: 180 } });
  const beforeOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  // VS divider
  const vsOpacity = interpolate(frame, [55, 70], [0, 1], { extrapolateRight: "clamp" });

  // After card
  const afterScale = spring({ frame: frame - 70, fps, config: { damping: 14, stiffness: 180 } });
  const afterOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });

  // Verdict
  const verdictOpacity = interpolate(frame, [130, 155], [0, 1], { extrapolateRight: "clamp" });
  const verdictScale = spring({ frame: frame - 130, fps, config: { damping: 10, stiffness: 200 } });

  // Tagline
  const taglineOpacity = interpolate(frame, [180, 210], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #001a00 0%, #0a2a0a 50%, #001a00 100%)",
      }}
    >
      <FloatingShapes shapes={AFTER_SHAPES} />
      {/* AFTER tag */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 48,
          backgroundColor: "#00c853",
          color: "#000",
          fontFamily: "'Arial Black', sans-serif",
          fontSize: 30,
          fontWeight: 900,
          padding: "10px 24px",
          borderRadius: 8,
          letterSpacing: 2,
          opacity: tagOpacity,
        }}
      >
        AFTER ✅
      </div>

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 48px",
          gap: 28,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 44,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            opacity: titleOpacity,
          }}
        >
          90 days later… I re-tested
        </div>

        {/* Side-by-side ratio cards */}
        <div style={{ display: "flex", gap: 24, alignItems: "center", width: "100%" }}>
          {/* Before card */}
          <div
            style={{
              flex: 1,
              background: "rgba(204,0,0,0.15)",
              border: "2px solid rgba(204,0,0,0.5)",
              borderRadius: 20,
              padding: "24px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity: beforeOpacity,
              transform: `scale(${beforeScale})`,
            }}
          >
            <div style={{ fontFamily: "sans-serif", fontSize: 18, color: "#ff6666" }}>BEFORE</div>
            <div
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 56,
                fontWeight: 900,
                color: "#ff4444",
                lineHeight: 1,
              }}
            >
              20:1
            </div>
            <div style={{ fontSize: 36 }}>😰</div>
            <div style={{ fontFamily: "sans-serif", fontSize: 18, color: "#888", textAlign: "center" }}>
              Highly inflamed
            </div>
          </div>

          {/* VS */}
          <div
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 32,
              color: "#ffffff",
              opacity: vsOpacity,
              fontWeight: 900,
            }}
          >
            →
          </div>

          {/* After card */}
          <div
            style={{
              flex: 1,
              background: "rgba(0,200,83,0.15)",
              border: "2px solid rgba(0,200,83,0.5)",
              borderRadius: 20,
              padding: "24px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              opacity: afterOpacity,
              transform: `scale(${afterScale})`,
            }}
          >
            <div style={{ fontFamily: "sans-serif", fontSize: 18, color: "#00e676" }}>AFTER</div>
            <div
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 56,
                fontWeight: 900,
                color: "#00e676",
                lineHeight: 1,
              }}
            >
              4:1
            </div>
            <div style={{ fontSize: 36 }}>🎉</div>
            <div style={{ fontFamily: "sans-serif", fontSize: 18, color: "#888", textAlign: "center" }}>
              Near optimal
            </div>
          </div>
        </div>

        {/* Verdict badge */}
        <div
          style={{
            background: "linear-gradient(135deg, #00c853, #00e676)",
            borderRadius: 20,
            padding: "20px 40px",
            opacity: verdictOpacity,
            transform: `scale(${verdictScale})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 40,
              fontWeight: 900,
              color: "#000",
              lineHeight: 1,
            }}
          >
            4:1 in 90 days
          </div>
          <div style={{ fontFamily: "sans-serif", fontSize: 22, color: "#004d00", marginTop: 6 }}>
            With BalanceOil
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 38,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            opacity: taglineOpacity,
          }}
        >
          I feel like a{" "}
          <span style={{ color: "#00e676" }}>completely different person</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
