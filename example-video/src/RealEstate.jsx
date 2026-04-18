import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Hero } from "./scenes/Hero";
import { Stats } from "./scenes/Stats";
import { Features } from "./scenes/Features";
import { CTA } from "./scenes/CTA";

const SCENE_DURATION = 90; // 3s each at 30fps
const TRANSITION = 15;

const FadeTransition = ({ children, startFrame, endFrame }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [startFrame, startFrame + TRANSITION, endFrame - TRANSITION, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const RealEstateVideo = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      <Sequence from={0} durationInFrames={SCENE_DURATION + TRANSITION}>
        <FadeTransition startFrame={0} endFrame={SCENE_DURATION + TRANSITION}>
          <Hero />
        </FadeTransition>
      </Sequence>

      <Sequence from={SCENE_DURATION} durationInFrames={SCENE_DURATION + TRANSITION}>
        <FadeTransition startFrame={0} endFrame={SCENE_DURATION + TRANSITION}>
          <Stats />
        </FadeTransition>
      </Sequence>

      <Sequence from={SCENE_DURATION * 2} durationInFrames={SCENE_DURATION + TRANSITION}>
        <FadeTransition startFrame={0} endFrame={SCENE_DURATION + TRANSITION}>
          <Features />
        </FadeTransition>
      </Sequence>

      <Sequence from={SCENE_DURATION * 3} durationInFrames={SCENE_DURATION}>
        <FadeTransition startFrame={0} endFrame={SCENE_DURATION}>
          <CTA />
        </FadeTransition>
      </Sequence>
    </AbsoluteFill>
  );
};
