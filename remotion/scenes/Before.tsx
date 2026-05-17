import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const Symptom: React.FC<{ text: string; emoji: string; fromFrame: number }> = ({
  text,
  emoji,
  fromFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = spring({ frame: frame - fromFrame, fps, config: { damping: 14, stiffness: 180 } });
  const opacity = interpolate(frame, [fromFrame, fromFrame + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        opacity,
        transform: `translateX(${interpolate(frame, [fromFrame, fromFrame + 20], [-60, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}px) scale(${appear})`,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        padding: "18px 28px",
        width: "100%",
      }}
    >
      <span style={{ fontSize: 48 }}>{emoji}</span>
      <span
        style={{
          fontFamily: "'Arial', sans-serif",
          fontSize: 36,
          color: "#e0e0e0",
          fontWeight: 600,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const Before: React.FC = () => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #1a0a0a 0%, #0d0d0d 100%)",
      }}
    >
      {/* BEFORE tag */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 48,
          backgroundColor: "#cc0000",
          color: "white",
          fontFamily: "'Arial Black', sans-serif",
          fontSize: 30,
          fontWeight: 900,
          padding: "10px 24px",
          borderRadius: 8,
          letterSpacing: 2,
          opacity: tagOpacity,
        }}
      >
        BEFORE
      </div>

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 48px",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 52,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.15,
            opacity: titleOpacity,
            marginBottom: 16,
          }}
        >
          6 months ago I was{" "}
          <span style={{ color: "#cc0000" }}>exhausted every day</span>
        </div>

        <Symptom text="Constant fatigue" emoji="😴" fromFrame={20} />
        <Symptom text="Brain fog all day" emoji="🧠" fromFrame={50} />
        <Symptom text="Aching joints" emoji="🦵" fromFrame={80} />
        <Symptom text="Mood swings" emoji="😤" fromFrame={110} />

        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 28,
            color: "#888",
            textAlign: "center",
            marginTop: 16,
            opacity: interpolate(frame, [140, 160], [0, 1], { extrapolateRight: "clamp" }),
            fontStyle: "italic",
          }}
        >
          Doctors said everything looked "normal"
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
