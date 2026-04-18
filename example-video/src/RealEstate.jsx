import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Sequence, staticFile } from "remotion";
import { fadeIn, slideUp } from "./animations";
import { PhotoSlideshow } from "./components/PhotoSlideshow";

const PHOTO_DURATION = 90;
const TOTAL_PHOTOS = 5;
const SLIDESHOW_DURATION = PHOTO_DURATION * TOTAL_PHOTOS;

const PHOTOS = [
  { src: staticFile("photo1.jpg"), zoom: "in",  panX: -20, panY: 0   },
  { src: staticFile("photo2.jpg"), zoom: "out", panX: 10,  panY: -10 },
  { src: staticFile("photo3.jpg"), zoom: "in",  panX: 15,  panY: 10  },
  { src: staticFile("photo4.jpg"), zoom: "out", panX: -10, panY: 5   },
  { src: staticFile("photo5.jpg"), zoom: "in",  panX: 0,   panY: -15 },
];

// Persistent overlay shown throughout
const PersistentOverlay = () => {
  const frame = useCurrentFrame();

  const headerOpacity = fadeIn(frame, 20, 30);
  const headerY = interpolate(frame, [20, 50], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // CTA fades in during last photo
  const ctaStart = PHOTO_DURATION * 4 + 30;
  const ctaOpacity = fadeIn(frame, ctaStart, 30);
  const ctaY = interpolate(frame, [ctaStart, ctaStart + 30], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          padding: "40px 80px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          opacity: headerOpacity,
          transform: `translateY(${headerY}px)`,
        }}
      >
        {/* Address */}
        <div>
          <div style={{ color: "#e8c97a", fontSize: 15, letterSpacing: 5, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 10 }}>
            For Sale
          </div>
          <div style={{ color: "white", fontSize: 52, fontWeight: 300, fontFamily: "Georgia, serif", lineHeight: 1.1, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
            Your Property Address
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 22, fontFamily: "sans-serif", marginTop: 8, letterSpacing: 2 }}>
            City, TX
          </div>
        </div>

        {/* Price */}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 4, textTransform: "uppercase", fontFamily: "sans-serif", marginBottom: 8 }}>
            Asking Price
          </div>
          <div style={{ color: "#e8c97a", fontSize: 52, fontWeight: 300, fontFamily: "Georgia, serif", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
            $000,000
          </div>
        </div>
      </div>

      {/* Stats bar — always visible */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 80, right: 80,
          display: "flex",
          gap: 2,
          opacity: headerOpacity,
        }}
      >
        {[
          { label: "Beds", value: "3" },
          { label: "Baths", value: "2" },
          { label: "Sq Ft", value: "0,000" },
          { label: "Lot", value: "0.0 ac" },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.55)",
              borderTop: "2px solid #e8c97a",
              padding: "18px 24px",
              textAlign: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            <div style={{ color: "#e8c97a", fontSize: 32, fontWeight: 300, fontFamily: "Georgia, serif" }}>{value}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* CTA bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 80, right: 80,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 3, textTransform: "uppercase", fontFamily: "sans-serif" }}>
          Schedule a Showing
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, letterSpacing: 3, fontFamily: "sans-serif" }}>
          (000) 000-0000 · your@email.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const RealEstateVideo = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <PhotoSlideshow photos={PHOTOS} />
      <PersistentOverlay />
    </AbsoluteFill>
  );
};
