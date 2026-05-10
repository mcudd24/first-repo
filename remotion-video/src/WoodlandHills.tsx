import {
  AbsoluteFill,
  Audio,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Scene boundaries in frames (30fps)
// 0-4s=intro, 5-12s=exterior, 13-20s=living, 21-28s=kitchen, 29-36s=bedroom, 37-42s=shed, 43-45s=CTA
const SCENES = [
  { start: 0,    end: 150,  label: "Intro" },
  { start: 150,  end: 390,  label: "Exterior" },
  { start: 390,  end: 630,  label: "Living Room" },
  { start: 630,  end: 870,  label: "Kitchen" },
  { start: 870,  end: 1110, label: "Master Bedroom" },
  { start: 1110, end: 1290, label: "Backyard & Shed" },
  { start: 1290, end: 1350, label: "CTA" },
];

const PHOTOS = {
  drone2: staticFile("photos/web_drone2.jpg"),   // exterior front
  drone1: staticFile("photos/web_drone1.jpg"),   // aerial/shed view
  interior1: staticFile("photos/web_interior1.jpg"), // living room
  interior2: staticFile("photos/web_interior2.jpg"), // kitchen
  interior3: staticFile("photos/web_interior3.jpg"), // master bedroom
};

const GREEN = "#8db87a";
const DARK  = "#1a2a1a";

function fade(frame: number, inStart: number, inEnd: number, outStart = -1, outEnd = -1): number {
  let o = interpolate(frame, [inStart, inEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (outStart >= 0 && outEnd >= 0) {
    o *= interpolate(frame, [outStart, outEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  }
  return o;
}

function KenBurns({
  src,
  frame,
  localFrame,
  duration,
  direction = "right",
}: {
  src: string;
  frame: number;
  localFrame: number;
  duration: number;
  direction?: "right" | "left" | "up";
}) {
  const progress = localFrame / duration;
  const scale = interpolate(progress, [0, 1], [1.08, 1.0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tx = direction === "right"
    ? interpolate(progress, [0, 1], [-2, 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : direction === "left"
    ? interpolate(progress, [0, 1], [2, -2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const ty = direction === "up"
    ? interpolate(progress, [0, 1], [2, -2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${tx}%, ${ty}%)`,
          willChange: "transform",
        }}
      />
    </AbsoluteFill>
  );
}

function Overlay({ opacity }: { opacity: number }) {
  return (
    <AbsoluteFill
      style={{ background: `rgba(0,0,0,${0.35 * opacity})` }}
    />
  );
}

function ProgressBar({ frame, total }: { frame: number; total: number }) {
  const pct = (frame / total) * 100;
  const secs = Math.floor(frame / 30);
  const totalSecs = Math.floor(total / 30);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <AbsoluteFill style={{ top: "auto", bottom: 0, height: 44, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 4, background: "rgba(255,255,255,0.15)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: GREEN, transition: "none" }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 20px", background: "rgba(0,0,0,0.7)", flex: 1,
      }}>
        {SCENES.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            color: frame >= s.start ? GREEN : "rgba(255,255,255,0.4)",
            fontSize: 11, fontWeight: frame >= s.start ? 600 : 400,
            fontFamily: "system-ui, sans-serif",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: frame >= s.start && frame < s.end ? GREEN : frame >= s.end ? "rgba(141,184,122,0.5)" : "rgba(255,255,255,0.2)",
            }} />
            {s.label}
          </div>
        ))}
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "monospace", marginLeft: "auto", paddingLeft: 16 }}>
          {fmt(secs)} / {fmt(totalSecs)}
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 1: Intro (0–149) ─────────────────────────────────────────────────
function SceneIntro({ frame }: { frame: number }) {
  const local = frame;
  const logoSpring = spring({ frame: local, fps: 30, config: { damping: 14, stiffness: 80 } });
  const textOpacity = fade(local, 20, 50);
  const taglineOpacity = fade(local, 40, 70);
  const exitOpacity = fade(local, 120, 149);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: 1 - exitOpacity }}>
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          color: GREEN,
          letterSpacing: "-1px",
          fontFamily: "Georgia, serif",
          transform: `scale(${0.4 + 0.6 * logoSpring})`,
          textAlign: "center",
        }}>
          Cudd Realty
        </div>
        <div style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: 4,
          textTransform: "uppercase",
          textAlign: "center",
          marginTop: 8,
          fontFamily: "system-ui, sans-serif",
          opacity: textOpacity,
        }}>
          Denton, Texas
        </div>
        <div style={{
          width: 60, height: 2, background: GREEN, margin: "20px auto",
          opacity: textOpacity,
        }} />
        <div style={{
          fontSize: 22,
          color: "white",
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          opacity: taglineOpacity,
        }}>
          Presenting an Exceptional Property
        </div>
        <div style={{
          fontSize: 16,
          color: "rgba(255,255,255,0.5)",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          marginTop: 12,
          opacity: taglineOpacity,
        }}>
          5528 Woodland Hills Dr, Denton, TX 76208
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 2: Exterior (150–389) ────────────────────────────────────────────
function SceneExterior({ frame }: { frame: number }) {
  const local = frame - 150;
  const duration = 240;
  const imgOpacity = fade(local, 0, 20, 220, 240);
  const textOpacity = fade(local, 25, 55, 210, 240);
  const badgeOpacity = fade(local, 45, 75, 210, 240);

  return (
    <AbsoluteFill>
      <div style={{ opacity: imgOpacity, position: "absolute", inset: 0 }}>
        <KenBurns src={PHOTOS.drone2} frame={frame} localFrame={local} duration={duration} direction="right" />
      </div>
      <Overlay opacity={imgOpacity} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 80px" }}>
        <div style={{ opacity: textOpacity }}>
          <div style={{ color: GREEN, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
            Exterior
          </div>
          <div style={{ color: "white", fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
            Stunning Curb Appeal
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginTop: 10, fontFamily: "system-ui, sans-serif" }}>
            4 Bed · 2 Bath · 2,184 sq ft · 0.46 Acres
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20, opacity: badgeOpacity }}>
          {["$424,900", "Built 1999", "2-Car Garage"].map((b, i) => (
            <div key={i} style={{
              background: "rgba(141,184,122,0.2)", border: "1px solid rgba(141,184,122,0.5)",
              borderRadius: 6, padding: "6px 16px", color: "white",
              fontSize: 13, fontFamily: "system-ui, sans-serif",
            }}>
              {b}
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Scene 3: Living Room (390–629) ─────────────────────────────────────────
function SceneLiving({ frame }: { frame: number }) {
  const local = frame - 390;
  const duration = 240;
  const imgOpacity = fade(local, 0, 20, 220, 240);
  const textOpacity = fade(local, 25, 55, 210, 240);

  return (
    <AbsoluteFill>
      <div style={{ opacity: imgOpacity, position: "absolute", inset: 0 }}>
        <KenBurns src={PHOTOS.interior1} frame={frame} localFrame={local} duration={duration} direction="left" />
      </div>
      <Overlay opacity={imgOpacity} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 80px" }}>
        <div style={{ opacity: textOpacity }}>
          <div style={{ color: GREEN, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
            Living Room
          </div>
          <div style={{ color: "white", fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
            Warm & Inviting Spaces
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginTop: 10, fontFamily: "system-ui, sans-serif" }}>
            Brick fireplace · Open floor plan · Natural light
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Scene 4: Kitchen (630–869) ─────────────────────────────────────────────
function SceneKitchen({ frame }: { frame: number }) {
  const local = frame - 630;
  const duration = 240;
  const imgOpacity = fade(local, 0, 20, 220, 240);
  const textOpacity = fade(local, 25, 55, 210, 240);

  return (
    <AbsoluteFill>
      <div style={{ opacity: imgOpacity, position: "absolute", inset: 0 }}>
        <KenBurns src={PHOTOS.interior2} frame={frame} localFrame={local} duration={duration} direction="right" />
      </div>
      <Overlay opacity={imgOpacity} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 80px" }}>
        <div style={{ opacity: textOpacity }}>
          <div style={{ color: GREEN, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
            Kitchen
          </div>
          <div style={{ color: "white", fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
            Chef-Ready Kitchen
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginTop: 10, fontFamily: "system-ui, sans-serif" }}>
            Modern appliances · Ample counter space · Dining area
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Scene 5: Master Bedroom (870–1109) ─────────────────────────────────────
function SceneBedroom({ frame }: { frame: number }) {
  const local = frame - 870;
  const duration = 240;
  const imgOpacity = fade(local, 0, 20, 220, 240);
  const textOpacity = fade(local, 25, 55, 210, 240);

  return (
    <AbsoluteFill>
      <div style={{ opacity: imgOpacity, position: "absolute", inset: 0 }}>
        <KenBurns src={PHOTOS.interior3} frame={frame} localFrame={local} duration={duration} direction="up" />
      </div>
      <Overlay opacity={imgOpacity} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 80px" }}>
        <div style={{ opacity: textOpacity }}>
          <div style={{ color: GREEN, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
            Master Bedroom
          </div>
          <div style={{ color: "white", fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
            Peaceful Retreat
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginTop: 10, fontFamily: "system-ui, sans-serif" }}>
            Spacious layout · Walk-in closet · En-suite bath
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Scene 6: Shed / Backyard (1110–1289) ───────────────────────────────────
function SceneShed({ frame }: { frame: number }) {
  const local = frame - 1110;
  const duration = 180;
  const imgOpacity = fade(local, 0, 20, 160, 180);
  const textOpacity = fade(local, 25, 55, 155, 180);

  return (
    <AbsoluteFill>
      <div style={{ opacity: imgOpacity, position: "absolute", inset: 0 }}>
        <KenBurns src={PHOTOS.drone1} frame={frame} localFrame={local} duration={duration} direction="left" />
      </div>
      <Overlay opacity={imgOpacity} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 80px" }}>
        <div style={{ opacity: textOpacity }}>
          <div style={{ color: GREEN, fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: 8 }}>
            Backyard & Outbuilding
          </div>
          <div style={{ color: "white", fontSize: 38, fontWeight: 700, fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
            Expansive Outdoor Space
          </div>
          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, marginTop: 10, fontFamily: "system-ui, sans-serif" }}>
            Workshop / storage shed · Mature trees · 0.46-acre lot
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Scene 7: CTA (1290–1349) ───────────────────────────────────────────────
function SceneCTA({ frame }: { frame: number }) {
  const local = frame - 1290;
  const logoSpring = spring({ frame: local, fps: 30, config: { damping: 14, stiffness: 80 } });
  const textOpacity = fade(local, 15, 40);
  const detailsOpacity = fade(local, 30, 55);

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        fontSize: 46, fontWeight: 800, color: GREEN,
        fontFamily: "Georgia, serif", textAlign: "center",
        transform: `scale(${0.5 + 0.5 * logoSpring})`,
      }}>
        Cudd Realty
      </div>
      <div style={{ width: 60, height: 2, background: GREEN, margin: "16px auto", opacity: textOpacity }} />
      <div style={{ color: "white", fontSize: 28, fontFamily: "Georgia, serif", fontStyle: "italic", opacity: textOpacity, textAlign: "center" }}>
        5528 Woodland Hills Dr
      </div>
      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, fontFamily: "system-ui, sans-serif", marginTop: 4, opacity: textOpacity, textAlign: "center" }}>
        Denton, TX 76208 · $424,900
      </div>
      <div style={{ marginTop: 28, opacity: detailsOpacity, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ color: GREEN, fontSize: 16, fontFamily: "system-ui, sans-serif" }}>
          Mariella Cudd, Realtor
        </div>
        <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, fontFamily: "system-ui, sans-serif" }}>
          (940) 595-5550 · cuddrealtyinc.com
        </div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "system-ui, sans-serif" }}>
          2412 Old North Rd Bldg #104, Denton, TX 76209
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Main Composition ───────────────────────────────────────────────────────
export const WoodlandHills = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentScene = SCENES.reduce((acc, s, i) => (frame >= s.start ? i : acc), 0);

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: "system-ui, sans-serif" }}>
      <Audio src={staticFile("bg-music.mp3")} volume={0.8} />

      {currentScene === 0 && <SceneIntro frame={frame} />}
      {currentScene === 1 && <SceneExterior frame={frame} />}
      {currentScene === 2 && <SceneLiving frame={frame} />}
      {currentScene === 3 && <SceneKitchen frame={frame} />}
      {currentScene === 4 && <SceneBedroom frame={frame} />}
      {currentScene === 5 && <SceneShed frame={frame} />}
      {currentScene === 6 && <SceneCTA frame={frame} />}

      <ProgressBar frame={frame} total={durationInFrames} />
    </AbsoluteFill>
  );
};
