import React from "react";
import { AbsoluteFill, Audio, Sequence } from "remotion";
import { Hook } from "./scenes/Hook";
import { Before } from "./scenes/Before";
import { Discovery } from "./scenes/Discovery";
import { Montage } from "./scenes/Montage";
import { AfterReveal } from "./scenes/AfterReveal";
import { CTA } from "./scenes/CTA";

// 30fps — scene layout (frames):
// Hook       0   → 90   (3s)
// Before     90  → 360  (9s)
// Discovery  360 → 660  (10s)
// Montage    660 → 1050 (13s)
// AfterReveal 1050→ 1440 (13s)
// CTA        1440→ 1800 (12s)

export const ZinzinoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Audio src={require("../public/background.wav")} volume={0.55} />

      <Sequence from={0} durationInFrames={90}>
        <Hook />
      </Sequence>

      <Sequence from={90} durationInFrames={270}>
        <Before />
      </Sequence>

      <Sequence from={360} durationInFrames={300}>
        <Discovery />
      </Sequence>

      <Sequence from={660} durationInFrames={390}>
        <Montage />
      </Sequence>

      <Sequence from={1050} durationInFrames={390}>
        <AfterReveal />
      </Sequence>

      <Sequence from={1440} durationInFrames={360}>
        <CTA />
      </Sequence>
    </AbsoluteFill>
  );
};
