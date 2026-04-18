import { Composition } from "remotion";
import { RealEstateVideo } from "./RealEstate";

export const RemotionRoot = () => {
  return (
    <Composition
      id="RealEstate"
      component={RealEstateVideo}
      durationInFrames={360}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
