import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const MyComposition = () => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 30], [0.5, 1], { extrapolateRight: "clamp" });
  const hue = interpolate(frame, [0, 90], [200, 360]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 20%), hsl(${hue + 60}, 70%, 10%))`,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          color: "white",
          fontSize: 80,
          fontFamily: "sans-serif",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Hello, Remotion!
      </div>
      <div
        style={{
          opacity,
          color: "rgba(255,255,255,0.7)",
          fontSize: 30,
          fontFamily: "sans-serif",
        }}
      >
        Frame {frame}
      </div>
    </AbsoluteFill>
  );
};
