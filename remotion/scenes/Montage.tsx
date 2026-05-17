import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FloatingShapes, MONTAGE_SHAPES } from "../FloatingShapes";

const MilestoneCard: React.FC<{
  week: string;
  text: string;
  emoji: string;
  fromFrame: number;
  color: string;
}> = ({ week, text, emoji, fromFrame, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame: frame - fromFrame, fps, config: { damping: 14, stiffness: 200 } });
  const opacity = interpolate(frame, [fromFrame, fromFrame + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < fromFrame) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        opacity,
        transform: `translateX(${interpolate(frame, [fromFrame, fromFrame + 18], [-80, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px)`,
        background: `rgba(255,255,255,0.08)`,
        borderLeft: `5px solid ${color}`,
        borderRadius: 14,
        padding: "16px 24px",
        width: "100%",
      }}
    >
      <span style={{ fontSize: 42 }}>{emoji}</span>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 20,
            color,
            fontWeight: 900,
            letterSpacing: 1,
          }}
        >
          {week}
        </span>
        <span
          style={{
            fontFamily: "sans-serif",
            fontSize: 30,
            color: "#ffffff",
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

export const Montage: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  const bottleScale = spring({ frame: frame - 5, fps: 30, config: { damping: 12, stiffness: 160 } });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0a1628 0%, #0d2040 60%, #0a1628 100%)",
      }}
    >
      <FloatingShapes shapes={MONTAGE_SHAPES} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 44px",
          gap: 20,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 40,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            opacity: titleOpacity,
            marginBottom: 4,
          }}
        >
          I started{" "}
          <span style={{ color: "#00C4E8" }}>BalanceOil</span>{" "}
          every morning
        </div>

        {/* Bottle visual */}
        <div
          style={{
            transform: `scale(${bottleScale})`,
            background: "linear-gradient(160deg, #003087, #00587a)",
            borderRadius: 60,
            width: 90,
            height: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(0,196,232,0.4)",
            fontSize: 44,
            marginBottom: 8,
          }}
        >
          💧
        </div>

        {/* Milestone cards */}
        <MilestoneCard week="WEEK 2" text="Less inflammation" emoji="🔥" fromFrame={30} color="#ff9800" />
        <MilestoneCard week="WEEK 6" text="Sleeping through the night" emoji="😴" fromFrame={70} color="#7c4dff" />
        <MilestoneCard week="WEEK 10" text="Joint pain? Gone." emoji="💪" fromFrame={110} color="#00e676" />
        <MilestoneCard week="DAY 90" text="Re-tested 🧪" emoji="📊" fromFrame={150} color="#00C4E8" />

        {/* Energy bar */}
        <div
          style={{
            width: "100%",
            marginTop: 8,
            opacity: interpolate(frame, [180, 200], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontFamily: "sans-serif", fontSize: 22, color: "#aaa", marginBottom: 8 }}>
            Energy levels
          </div>
          <div
            style={{
              width: "100%",
              height: 18,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 9,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${interpolate(frame, [180, 250], [10, 95], { extrapolateRight: "clamp" })}%`,
                background: "linear-gradient(90deg, #00C4E8, #00e676)",
                borderRadius: 9,
                transition: "width 0.1s",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "sans-serif",
              fontSize: 18,
              color: "#666",
              marginTop: 4,
            }}
          >
            <span>Before</span>
            <span style={{ color: "#00e676", fontWeight: 700 }}>Now</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
