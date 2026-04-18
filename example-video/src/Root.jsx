import { Composition, registerRoot } from "remotion";
import { RealEstateVideo } from "./RealEstate";

const RemotionRoot = () => {
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

registerRoot(RemotionRoot);
