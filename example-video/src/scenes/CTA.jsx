import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { fadeIn, slideUp } from "../animations";

export const CTA = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgOpacity = fadeIn(frame, 0, 30);
  const titleOpacity = fadeIn(frame, 10, 25);
  const titleY = interpolate(slideUp(frame, fps, 10), [0, 1], [40, 0]);
  const dividerScale = interpolate(frame, [30, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const contactOpacity = fadeIn(frame, 45, 25);
  const contactY = interpolate(slideUp(frame, fps, 45), [0, 1], [30, 0]);
  const btnOpacity = fadeIn(frame, 65, 25);
  const btnY = interpolate(slideUp(frame, fps, 65), [0, 1], [20, 0]);
  const logoOpacity = fadeIn(frame, 80, 20);

  return (
    <AbsoluteFill style={{ background: "#060606", justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 50% 50%, rgba(184,142,74,0.15) 0%, transparent 65%)",
          opacity: bgOpacity,
        }}
      />

      <div style={{ textAlign: "center", zIndex: 1, padding: "0 100px" }}>
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            color: "white",
            fontSize: 56,
            fontWeight: 300,
            fontFamily: "Georgia, serif",
            letterSpacing: 2,
            marginBottom: 16,
          }}
        >
          Schedule a Private Showing
        </div>

        <div style={{ width: 100 * dividerScale, height: 1, background: "#b88e4a", margin: "0 auto 40px" }} />

        <div
          style={{
            opacity: contactOpacity,
            transform: `translateY(${contactY}px)`,
            display: "flex",
            justifyContent: "center",
            gap: 60,
            marginBottom: 50,
          }}
        >
          {[
            { label: "Call", value: "(310) 555-0192" },
            { label: "Email", value: "frank@luxerealty.com" },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ color: "#b88e4a", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", marginBottom: 8, fontFamily: "sans-serif" }}>
                {label}
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 24, fontFamily: "sans-serif", fontWeight: 300 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div
          style={{
            opacity: btnOpacity,
            transform: `translateY(${btnY}px)`,
            display: "inline-block",
            border: "1px solid #b88e4a",
            color: "#b88e4a",
            fontSize: 16,
            letterSpacing: 5,
            padding: "18px 56px",
            textTransform: "uppercase",
            fontFamily: "sans-serif",
            marginBottom: 70,
          }}
        >
          Book Viewing
        </div>

        {/* Logo / Brokerage */}
        <div
          style={{
            opacity: logoOpacity,
            color: "rgba(255,255,255,0.25)",
            fontSize: 14,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontFamily: "sans-serif",
          }}
        >
          Luxe Realty Group · DRE #01234567
        </div>
      </div>
    </AbsoluteFill>
  );
};
