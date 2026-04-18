import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { fadeIn, slideUp } from "../animations";

export const Hero = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = fadeIn(frame, 0, 30);
  const lineScale = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const titleY = interpolate(slideUp(frame, fps, 15), [0, 1], [60, 0]);
  const titleOpacity = fadeIn(frame, 15, 25);
  const subtitleY = interpolate(slideUp(frame, fps, 35), [0, 1], [40, 0]);
  const subtitleOpacity = fadeIn(frame, 35, 25);
  const tagOpacity = fadeIn(frame, 50, 20);

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", justifyContent: "center", alignItems: "center" }}>
      {/* Background gradient overlay */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 60% 40%, rgba(184,142,74,0.18) 0%, transparent 70%)",
          opacity: bgOpacity,
        }}
      />

      {/* Content */}
      <div style={{ textAlign: "center", zIndex: 1, padding: "0 120px" }}>
        {/* Tag */}
        <div
          style={{
            opacity: tagOpacity,
            display: "inline-block",
            border: "1px solid #b88e4a",
            color: "#b88e4a",
            fontSize: 18,
            letterSpacing: 6,
            padding: "8px 28px",
            marginBottom: 40,
            textTransform: "uppercase",
            fontFamily: "Georgia, serif",
          }}
        >
          Exclusive Listing
        </div>

        {/* Accent line */}
        <div
          style={{
            width: 80 * lineScale,
            height: 2,
            background: "#b88e4a",
            margin: "0 auto 40px",
          }}
        />

        {/* Address */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            color: "white",
            fontSize: 72,
            fontWeight: 300,
            fontFamily: "Georgia, serif",
            letterSpacing: 2,
            lineHeight: 1.1,
            marginBottom: 24,
          }}
        >
          142 Lakeview Drive
        </div>

        {/* Location */}
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            color: "rgba(255,255,255,0.55)",
            fontSize: 28,
            fontFamily: "sans-serif",
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          Beverly Hills, CA 90210
        </div>
      </div>
    </AbsoluteFill>
  );
};
