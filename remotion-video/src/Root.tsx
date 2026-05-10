import { Composition } from "remotion";
import { WoodlandHills } from "./WoodlandHills";

export const Root = () => (
  <Composition
    id="WoodlandHills"
    component={WoodlandHills}
    durationInFrames={1800}
    fps={30}
    width={1280}
    height={720}
    defaultProps={{}}
  />
);
