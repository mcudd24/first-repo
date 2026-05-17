import React from "react";
import { Composition } from "remotion";
import { ZinzinoVideo } from "./ZinzinoVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ZinzinoViral"
      component={ZinzinoVideo}
      durationInFrames={1800}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
