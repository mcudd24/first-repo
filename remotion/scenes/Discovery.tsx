import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Discovery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const kitScale = spring({ frame: frame - 10, fps, config: { damping: 12, stiffness: 160 } });

  const ratio1Opacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });
  const ratio1Scale = spring({ frame: frame - 60, fps, config: { damping: 10, stiffness: 200 } });

  const arrowOpacity = interpolate(frame, [100, 115], [0, 1], { extrapolateRight: "clamp" });

  const ratio2Opacity = interpolate(frame, [120, 140], [0, 1], { extrapolateRight: "clamp" });
  const ratio2Scale = spring({ frame: frame - 120, fps, config: { damping: 10, stiffness: 200 } });

  const statOpacity = interpolate(frame, [160, 185], [0, 1], { extrapolateRight: "clamp" });
  const statY = interpolate(frame, [160, 185], [30, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #001f5c 0%, #003087 50%, #00587a 100%)",
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 48px",
          gap: 32,
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
          A friend sent me a{" "}
          <span style={{ color: "#00C4E8" }}>Zinzino Balance Test</span>
        </div>

        {/* Test kit */}
        <div
          style={{
            transform: `scale(${kitScale})`,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 24,
            padding: "32px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            border: "2px solid rgba(0,196,232,0.4)",
          }}
        >
          <div style={{ fontSize: 56 }}>🧪</div>
          <div
            style={{
              fontFamily: "'Arial Black', sans-serif",
              fontSize: 22,
              color: "#00C4E8",
              letterSpacing: 3,
              fontWeight: 900,
            }}
          >
            ZINZINO TEST
          </div>
          <div style={{ fontFamily: "sans-serif", fontSize: 20, color: "#ccc", textAlign: "center" }}>
            Omega-6 : Omega-3 ratio
          </div>
        </div>

        {/* Ratio comparison */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            width: "100%",
            justifyContent: "center",
          }}
        >
          {/* My ratio */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: ratio1Opacity,
              transform: `scale(${ratio1Scale})`,
            }}
          >
            <div style={{ fontFamily: "sans-serif", fontSize: 20, color: "#aaa", marginBottom: 6 }}>
              My result
            </div>
            <div
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 64,
                fontWeight: 900,
                color: "#ff4444",
                lineHeight: 1,
              }}
            >
              20:1
            </div>
          </div>

          {/* Arrow */}
          <div
            style={{
              fontSize: 48,
              opacity: arrowOpacity,
              color: "#ffffff",
            }}
          >
            →
          </div>

          {/* Optimal ratio */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              opacity: ratio2Opacity,
              transform: `scale(${ratio2Scale})`,
            }}
          >
            <div style={{ fontFamily: "sans-serif", fontSize: 20, color: "#aaa", marginBottom: 6 }}>
              Optimal
            </div>
            <div
              style={{
                fontFamily: "'Arial Black', sans-serif",
                fontSize: 64,
                fontWeight: 900,
                color: "#00e676",
                lineHeight: 1,
              }}
            >
              3:1
            </div>
          </div>
        </div>

        {/* Stat callout */}
        <div
          style={{
            background: "rgba(255,68,68,0.18)",
            border: "2px solid rgba(255,68,68,0.6)",
            borderRadius: 16,
            padding: "18px 32px",
            opacity: statOpacity,
            transform: `translateY(${statY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "sans-serif",
              fontSize: 24,
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            😳 The average in the West is{" "}
            <span style={{ color: "#ff6666", fontWeight: 900 }}>15:1</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
