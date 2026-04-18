import { interpolate, spring } from "remotion";

export const fadeIn = (frame, start, duration = 20) =>
  interpolate(frame, [start, start + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const slideUp = (frame, fps, start, config = {}) =>
  spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 120, mass: 0.8, ...config } });

export const slideInLeft = (frame, fps, start) =>
  interpolate(
    spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 100 } }),
    [0, 1],
    [-120, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
