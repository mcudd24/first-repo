import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { fadeIn, slideInLeft } from "../animations";

const Feature = ({ text, frame, fps, delay }) => {
  const x = slideInLeft(frame, fps, delay);
  const opacity = fadeIn(frame, delay, 18);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, opacity, transform: `translateX(${x}px)` }}>
      <div style={{ width: 8, height: 8, background: "#b88e4a", borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 26, fontFamily: "sans-serif", fontWeight: 300 }}>{text}</div>
    </div>
  );
};

export const Features = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = fadeIn(frame, 0, 20);
  const lineScale = interpolate(frame, [10, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const features = [
    { text: "Chef's kitchen with Sub-Zero & Wolf appliances", delay: 20 },
    { text: "Floor-to-ceiling windows with panoramic views", delay: 32 },
    { text: "Resort-style pool & outdoor entertaining area", delay: 44 },
    { text: "Primary suite with spa bath & walk-in closet", delay: 56 },
    { text: "Smart home automation throughout", delay: 68 },
    { text: "3-car garage with EV charging stations", delay: 80 },
  ];

  return (
    <AbsoluteFill style={{ background: "#0c0b09", justifyContent: "center", padding: "0 140px" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(184,142,74,0.1) 0%, transparent 55%)" }} />

      <div style={{ zIndex: 1 }}>
        {/* Header */}
        <div style={{ opacity: titleOpacity, marginBottom: 50 }}>
          <div style={{ color: "#b88e4a", fontSize: 16, letterSpacing: 6, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 18 }}>
            Property Highlights
          </div>
          <div style={{ width: 60 * lineScale, height: 2, background: "#b88e4a" }} />
        </div>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {features.map((f) => (
            <Feature key={f.text} {...f} frame={frame} fps={fps} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
