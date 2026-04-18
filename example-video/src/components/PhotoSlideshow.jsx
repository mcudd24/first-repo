import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, interpolate, Sequence } from "remotion";
import { fadeIn } from "../animations";

const PHOTO_DURATION = 90; // 3s per photo at 30fps
const TRANSITION = 20;

const KenBurnsPhoto = ({ src, zoom = "in", panX = 0, panY = 0 }) => {
  const frame = useCurrentFrame();
  const total = PHOTO_DURATION + TRANSITION;

  const scale = zoom === "in"
    ? interpolate(frame, [0, total], [1.08, 1.22], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(frame, [0, total], [1.22, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const x = interpolate(frame, [0, total], [0, panX], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, total], [0, panY], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const opacity = interpolate(frame, [0, TRANSITION, total - TRANSITION, total], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
          transformOrigin: "center center",
        }}
      >
        <Img
          src={src}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
      {/* Dark overlay for text readability */}
      <AbsoluteFill style={{ background: "rgba(0,0,0,0.38)" }} />
    </AbsoluteFill>
  );
};

export const PhotoSlideshow = ({ photos }) => {
  return (
    <AbsoluteFill>
      {photos.map((photo, i) => (
        <Sequence key={i} from={i * PHOTO_DURATION} durationInFrames={PHOTO_DURATION + TRANSITION}>
          <KenBurnsPhoto {...photo} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
