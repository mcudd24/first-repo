import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FloatingShapes, CTA_SHAPES } from "../FloatingShapes";

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const line1Opacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const line1Y = interpolate(frame, [10, 30], [40, 0], { extrapolateRight: "clamp" });

  const line2Opacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const line2Y = interpolate(frame, [40, 60], [40, 0], { extrapolateRight: "clamp" });

  const buttonScale = spring({ frame: frame - 70, fps, config: { damping: 10, stiffness: 220 } });
  const buttonOpacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: "clamp" });

  const logoOpacity = interpolate(frame, [110, 135], [0, 1], { extrapolateRight: "clamp" });
  const logoScale = spring({ frame: frame - 110, fps, config: { damping: 14, stiffness: 160 } });

  const arrowBounce = Math.sin(frame * 0.25) * 8;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #003087 0%, #001f5c 50%, #00587a 100%)",
        opacity: bgOpacity,
      }}
    >
      <FloatingShapes shapes={CTA_SHAPES} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 52px",
          gap: 32,
        }}
      >
        {/* Hook line */}
        <div
          style={{
            fontFamily: "'Arial Black', sans-serif",
            fontSize: 46,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.2,
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
          }}
        >
          Always tired and{" "}
          <span style={{ color: "#ff6666" }}>no one can tell you why?</span>
        </div>

        {/* Secondary line */}
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 32,
            color: "#c8e6ff",
            textAlign: "center",
            lineHeight: 1.4,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          This might be the answer.{"\n"}
          Know your Omega ratio.
        </div>

        {/* CTA Button */}
        <div
          style={{
            background: "linear-gradient(135deg, #00C4E8, #00e676)",
            borderRadius: 24,
            padding: "28px 48px",
            opacity: buttonOpacity,
            transform: `scale(${buttonScale})`,
            textAlign: "center",
            boxShadow: "0 8px 40px rgba(0,196,232,0.5)",
            width: "100%",
          }}
        >
          <div
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 34,
              fontWeight: 900,
              color: "#000000",
              lineHeight: 1.2,
            }}
          >
            🔗 Link in bio
          </div>
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 22,
              color: "#004040",
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            Get your FREE Balance Test
          </div>
        </div>

        {/* Bouncing arrow */}
        <div
          style={{
            fontSize: 52,
            opacity: buttonOpacity,
            transform: `translateY(${arrowBounce}px)`,
          }}
        >
          👇
        </div>

        {/* Zinzino logo area */}
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginTop: 8,
          }}
        >
          <div
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 42,
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: 4,
            }}
          >
            ZINZINO
          </div>
          <div
            style={{
              width: 180,
              height: 3,
              background: "linear-gradient(90deg, #00C4E8, #00e676)",
              borderRadius: 2,
            }}
          />
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 20,
              color: "#88ccdd",
              letterSpacing: 2,
            }}
          >
            zinzino.com
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
