import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { fadeIn, slideUp } from "../animations";

const StatCard = ({ icon, value, label, frame, fps, delay }) => {
  const y = interpolate(slideUp(frame, fps, delay), [0, 1], [50, 0]);
  const opacity = fadeIn(frame, delay, 20);
  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        textAlign: "center",
        padding: "40px 50px",
        border: "1px solid rgba(184,142,74,0.3)",
        background: "rgba(255,255,255,0.03)",
        minWidth: 200,
      }}
    >
      <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>
      <div style={{ color: "#b88e4a", fontSize: 52, fontWeight: 300, fontFamily: "Georgia, serif" }}>{value}</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, letterSpacing: 3, textTransform: "uppercase", marginTop: 8 }}>{label}</div>
    </div>
  );
};

export const Stats = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = fadeIn(frame, 5, 20);
  const priceY = interpolate(slideUp(frame, fps, 0), [0, 1], [30, 0]);
  const priceOpacity = fadeIn(frame, 0, 25);

  const stats = [
    { icon: "🛏", value: "5", label: "Bedrooms", delay: 15 },
    { icon: "🛁", value: "4", label: "Bathrooms", delay: 25 },
    { icon: "📐", value: "6,200", label: "Sq Ft", delay: 35 },
    { icon: "🌳", value: "0.8", label: "Acre Lot", delay: 45 },
  ];

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 60 }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(184,142,74,0.12) 0%, transparent 60%)" }} />

      {/* Price */}
      <div style={{ opacity: priceOpacity, transform: `translateY(${priceY}px)`, textAlign: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, letterSpacing: 5, textTransform: "uppercase", marginBottom: 12, fontFamily: "sans-serif" }}>
          Listed At
        </div>
        <div style={{ color: "white", fontSize: 80, fontWeight: 300, fontFamily: "Georgia, serif", letterSpacing: 2 }}>
          $4,850,000
        </div>
      </div>

      {/* Divider */}
      <div style={{ opacity: headerOpacity, width: 1, height: 60, background: "rgba(184,142,74,0.4)" }} />

      {/* Stats row */}
      <div style={{ display: "flex", gap: 24, zIndex: 1 }}>
        {stats.map((s) => (
          <StatCard key={s.label} {...s} frame={frame} fps={fps} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
