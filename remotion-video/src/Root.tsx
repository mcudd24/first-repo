import { Composition } from "remotion";
import { WoodlandHills } from "./WoodlandHills";

export const Root = () => (
  <Composition
    id="WoodlandHills"
    component={WoodlandHills}
    durationInFrames={1350}
    fps={30}
    width={960}
    height={540}
    defaultProps={{}}
  />
);
