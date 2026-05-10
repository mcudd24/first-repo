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

// 60-second video at 30fps = 1800 frames
// Scene layout:
//  0- 150  Intro
//  150- 390  Exterior
//  390- 630  Living Room
//  630- 870  Kitchen
//  870-1110  Master Bedroom
// 1110-1290  Backyard/Shed
// 1290-1530  Neighborhood Highlights (landmark info)
// 1530-1710  Location Map / Distance
// 1710-1800  CTA

const SCENES = [
  { start: 0,    end: 150,  label: "Intro" },
  { start: 150,  end: 390,  label: "Exterior" },
  { start: 390,  end: 630,  label: "Living Room" },
  { start: 630,  end: 870,  label: "Kitchen" },
  { start: 870,  end: 1110, label: "Master Bedroom" },
  { start: 1110, end: 1290, label: "Backyard & Shed" },
  { start: 1290, end: 1530, label: "Neighborhood" },
  { start: 1530, end: 1710, label: "Location" },
  { start: 1710, end: 1800, label: "Contact" },
];

const PHOTOS = {
  drone2:    staticFile("photos/web_drone2.jpg"),
  drone1:    staticFile("photos/web_drone1.jpg"),
  interior1: staticFile("photos/web_interior1.jpg"),
  interior2: staticFile("photos/web_interior2.jpg"),
  interior3: staticFile("photos/web_interior3.jpg"),
};

const GREEN = "#8db87a";
const DARK  = "#1a2a1a";

function fade(frame: number, inStart: number, inEnd: number, outStart = -1, outEnd = -1) {
  let o = interpolate(frame, [inStart, inEnd], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (outStart >= 0 && outEnd >= 0)
    o *= interpolate(frame, [outStart, outEnd], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return o;
}

function KenBurns({ src, localFrame, duration, direction = "right" }: {
  src: string; localFrame: number; duration: number; direction?: "right" | "left" | "up" | "down";
}) {
  const p = localFrame / duration;
  const scale = interpolate(p, [0, 1], [1.10, 1.00], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const tx = direction === "right" ? interpolate(p, [0, 1], [-3, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
           : direction === "left"  ? interpolate(p, [0, 1],  [3,-3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
           : 0;
  const ty = direction === "up"   ? interpolate(p, [0, 1],  [3,-3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
           : direction === "down" ? interpolate(p, [0, 1], [-3, 3], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
           : 0;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover",
        transform: `scale(${scale}) translate(${tx}%, ${ty}%)` }} />
    </AbsoluteFill>
  );
}

function Overlay({ opacity }: { opacity: number }) {
  return <AbsoluteFill style={{ background: `rgba(0,0,0,${0.38 * opacity})` }} />;
}

function ProgressBar({ frame, total }: { frame: number; total: number }) {
  const pct  = (frame / total) * 100;
  const secs = Math.floor(frame / 30);
  const fmt  = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <AbsoluteFill style={{ top: "auto", bottom: 0, height: 44, display: "flex", flexDirection: "column" }}>
      <div style={{ height: 3, background: "rgba(255,255,255,0.12)" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: GREEN }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 20px", background: "rgba(0,0,0,0.72)", flex: 1 }}>
        {SCENES.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5,
            color: frame >= s.start ? GREEN : "rgba(255,255,255,0.35)",
            fontSize: 10.5, fontWeight: frame >= s.start ? 600 : 400,
            fontFamily: "system-ui, sans-serif" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%",
              background: frame >= s.start && frame < s.end ? GREEN
                        : frame >= s.end ? "rgba(141,184,122,0.45)"
                        : "rgba(255,255,255,0.18)" }} />
            {s.label}
          </div>
        ))}
        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "monospace", paddingLeft: 12 }}>
          {fmt(secs)} / 1:00
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 1: Intro ──────────────────────────────────────────────────────────
function SceneIntro({ frame }: { frame: number }) {
  const local = frame;
  const logoSpring = spring({ frame: local, fps: 30, config: { damping: 14, stiffness: 80 } });
  const textOp  = fade(local, 20, 50);
  const tagOp   = fade(local, 40, 70);
  const exitOp  = fade(local, 120, 149);
  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: 1 - exitOp, textAlign: "center" }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: GREEN, letterSpacing: "-1px",
          fontFamily: "Georgia, serif",
          transform: `scale(${0.4 + 0.6 * logoSpring})` }}>
          Cudd Realty
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", letterSpacing: 4,
          textTransform: "uppercase", fontFamily: "system-ui, sans-serif",
          marginTop: 8, opacity: textOp }}>
          Denton, Texas
        </div>
        <div style={{ width: 64, height: 2, background: GREEN, margin: "20px auto", opacity: textOp }} />
        <div style={{ fontSize: 24, color: "white", fontFamily: "Georgia, serif",
          fontStyle: "italic", opacity: tagOp }}>
          Presenting an Exceptional Property
        </div>
        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.45)",
          fontFamily: "system-ui, sans-serif", marginTop: 12, opacity: tagOp }}>
          5528 Woodland Hills Dr · Denton, TX 76208
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Photo scene helper ──────────────────────────────────────────────────────
function PhotoScene({ frame, start, end, src, direction, category, headline, detail, badges = [] }: {
  frame: number; start: number; end: number; src: string;
  direction: "right" | "left" | "up" | "down";
  category: string; headline: string; detail: string; badges?: string[];
}) {
  const local    = frame - start;
  const duration = end - start;
  const imgOp  = fade(local, 0, 18, duration - 20, duration);
  const textOp = fade(local, 22, 55, duration - 22, duration);
  const badgeOp = fade(local, 45, 70, duration - 22, duration);
  return (
    <AbsoluteFill>
      <div style={{ opacity: imgOp, position: "absolute", inset: 0 }}>
        <KenBurns src={src} localFrame={local} duration={duration} direction={direction} />
      </div>
      <Overlay opacity={imgOp} />
      <AbsoluteFill style={{ display: "flex", flexDirection: "column",
        justifyContent: "flex-end", padding: "0 56px 80px" }}>
        <div style={{ opacity: textOp }}>
          <div style={{ color: GREEN, fontSize: 12, letterSpacing: 3.5,
            textTransform: "uppercase", fontFamily: "system-ui, sans-serif", marginBottom: 10 }}>
            {category}
          </div>
          <div style={{ color: "white", fontSize: 44, fontWeight: 700,
            fontFamily: "Georgia, serif", lineHeight: 1.15, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>
            {headline}
          </div>
          <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 17,
            marginTop: 12, fontFamily: "system-ui, sans-serif" }}>
            {detail}
          </div>
        </div>
        {badges.length > 0 && (
          <div style={{ display: "flex", gap: 12, marginTop: 22, opacity: badgeOp }}>
            {badges.map((b, i) => (
              <div key={i} style={{
                background: "rgba(141,184,122,0.18)", border: "1px solid rgba(141,184,122,0.5)",
                borderRadius: 6, padding: "7px 18px", color: "white",
                fontSize: 13, fontFamily: "system-ui, sans-serif",
              }}>{b}</div>
            ))}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Scene 7: Neighborhood Highlights ───────────────────────────────────────
const LANDMARKS = [
  { icon: "🎓", label: "University of North Texas", sub: "2.5 miles · 47,000 students", color: "#2d6a4f", bg: "#1b4332" },
  { icon: "🌲", label: "Clear Creek Heritage Center", sub: "4 miles · 2,900 acres of trails", color: "#52b788", bg: "#1e3a2f" },
  { icon: "🏫", label: "Denton ISD Schools", sub: "Top-rated public schools", color: "#74c69d", bg: "#213a2b" },
  { icon: "🛍️", label: "Loop 288 Corridor", sub: "2 miles · Shopping & Dining", color: "#95d5b2", bg: "#2d4a3a" },
];

function SceneNeighborhood({ frame }: { frame: number }) {
  const local = frame - 1290;
  const titleOp = fade(local, 0, 30, 220, 240);

  return (
    <AbsoluteFill style={{ background: "#111c17", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-start", paddingTop: 52 }}>
      {/* Title */}
      <div style={{ opacity: titleOp, textAlign: "center", marginBottom: 36 }}>
        <div style={{ color: GREEN, fontSize: 13, letterSpacing: 3.5,
          textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>
          Prime Location
        </div>
        <div style={{ color: "white", fontSize: 38, fontWeight: 700,
          fontFamily: "Georgia, serif", marginTop: 6 }}>
          Denton's Best at Your Doorstep
        </div>
      </div>

      {/* 2×2 landmark cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18,
        width: "82%", flex: 1, paddingBottom: 60 }}>
        {LANDMARKS.map((lm, i) => {
          const delay = 20 + i * 18;
          const cardSpring = spring({ frame: local - delay, fps: 30,
            config: { damping: 18, stiffness: 90 } });
          const cardOp = fade(local, delay, delay + 25, 210, 240);
          const tx = i % 2 === 0 ? -40 : 40;
          return (
            <div key={i} style={{
              background: lm.bg,
              border: `1px solid ${lm.color}40`,
              borderRadius: 14,
              padding: "24px 28px",
              display: "flex", alignItems: "flex-start", gap: 18,
              opacity: cardOp,
              transform: `translateX(${tx * (1 - cardSpring)}px)`,
            }}>
              <div style={{ fontSize: 40, lineHeight: 1 }}>{lm.icon}</div>
              <div>
                <div style={{ color: lm.color, fontSize: 16, fontWeight: 700,
                  fontFamily: "system-ui, sans-serif", marginBottom: 5 }}>
                  {lm.label}
                </div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13,
                  fontFamily: "system-ui, sans-serif" }}>
                  {lm.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 8: Location / Distance ───────────────────────────────────────────
const DISTANCES = [
  { label: "Downtown Denton Square", dist: "6 mi", angle: -130 },
  { label: "University of North Texas", dist: "2.5 mi", angle: -50 },
  { label: "Loop 288 Shopping", dist: "2 mi", angle: 20 },
  { label: "Clear Creek Trails", dist: "4 mi", angle: 90 },
  { label: "DFW Metroplex", dist: "40 mi", angle: 160 },
];

function SceneLocation({ frame }: { frame: number }) {
  const local = frame - 1530;
  const titleOp = fade(local, 0, 25, 160, 180);
  const pinSpring = spring({ frame: local - 5, fps: 30, config: { damping: 12, stiffness: 100 } });

  return (
    <AbsoluteFill style={{ background: "#0f1e15", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 0 }}>
      <div style={{ opacity: titleOp, textAlign: "center", marginBottom: 28 }}>
        <div style={{ color: GREEN, fontSize: 13, letterSpacing: 3.5,
          textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>
          5528 Woodland Hills Dr · Denton, TX
        </div>
        <div style={{ color: "white", fontSize: 36, fontWeight: 700,
          fontFamily: "Georgia, serif", marginTop: 6 }}>
          Perfectly Positioned
        </div>
      </div>

      {/* Central map pin with radiating items */}
      <div style={{ position: "relative", width: 480, height: 380 }}>
        {/* Center pin */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: `translate(-50%, -50%) scale(${0.3 + 0.7 * pinSpring})`,
          display: "flex", flexDirection: "column", alignItems: "center",
          zIndex: 10,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: "50% 50% 50% 0%",
            background: GREEN, transform: "rotate(-45deg)",
            boxShadow: `0 0 24px ${GREEN}88` }} />
          <div style={{ color: "white", fontSize: 12, fontFamily: "system-ui, sans-serif",
            marginTop: 12, fontWeight: 700, opacity: 0.9, letterSpacing: 1 }}>
            YOUR HOME
          </div>
        </div>

        {/* Radiating rings */}
        {[80, 150, 200].map((r, i) => (
          <div key={i} style={{
            position: "absolute", left: "50%", top: "50%",
            width: r * 2, height: r * 2,
            border: `1px solid ${GREEN}${20 + i * 10}`,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            opacity: fade(local, 10 + i * 8, 30 + i * 8),
          }} />
        ))}

        {/* Distance labels */}
        {DISTANCES.map((d, i) => {
          const rad    = (d.angle * Math.PI) / 180;
          const radius = 185;
          const x      = 50 + (Math.cos(rad) * radius / 4.8);
          const y      = 50 + (Math.sin(rad) * radius / 3.8);
          const itemOp = fade(local, 30 + i * 12, 55 + i * 12, 155, 175);
          return (
            <div key={i} style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              transform: "translate(-50%, -50%)",
              opacity: itemOp,
              textAlign: "center",
            }}>
              <div style={{ background: "rgba(141,184,122,0.15)", border: "1px solid rgba(141,184,122,0.4)",
                borderRadius: 8, padding: "6px 14px", whiteSpace: "nowrap" }}>
                <div style={{ color: GREEN, fontSize: 13, fontWeight: 700,
                  fontFamily: "system-ui, sans-serif" }}>
                  {d.dist}
                </div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11,
                  fontFamily: "system-ui, sans-serif", marginTop: 2 }}>
                  {d.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

// ── Scene 9: CTA ────────────────────────────────────────────────────────────
function SceneCTA({ frame }: { frame: number }) {
  const local = frame - 1710;
  const logoSpring  = spring({ frame: local, fps: 30, config: { damping: 14, stiffness: 80 } });
  const textOp    = fade(local, 15, 40);
  const detailsOp = fade(local, 28, 55);
  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 52, fontWeight: 800, color: GREEN,
        fontFamily: "Georgia, serif", textAlign: "center",
        transform: `scale(${0.5 + 0.5 * logoSpring})` }}>
        Cudd Realty
      </div>
      <div style={{ width: 64, height: 2, background: GREEN, margin: "16px auto", opacity: textOp }} />
      <div style={{ color: "white", fontSize: 30, fontFamily: "Georgia, serif",
        fontStyle: "italic", opacity: textOp, textAlign: "center" }}>
        5528 Woodland Hills Dr
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 18,
        fontFamily: "system-ui, sans-serif", marginTop: 4, opacity: textOp, textAlign: "center" }}>
        Denton, TX 76208 · <span style={{ color: GREEN, fontWeight: 700 }}>$364,500</span>
      </div>
      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 14,
        fontFamily: "system-ui, sans-serif", marginTop: 4, opacity: textOp, textAlign: "center" }}>
        3 Bed · 2 Bath · 2,236 sq ft · 0.42 Acres
      </div>
      <div style={{ marginTop: 30, opacity: detailsOp, display: "flex",
        flexDirection: "column", alignItems: "center", gap: 10 }}>
        <div style={{ color: GREEN, fontSize: 18, fontFamily: "system-ui, sans-serif", fontWeight: 600 }}>
          Mariella Cudd, Realtor
        </div>
        <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 16,
          fontFamily: "system-ui, sans-serif" }}>
          (940) 595-5550 · cuddrealtyinc.com
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13,
          fontFamily: "system-ui, sans-serif" }}>
          2412 Old North Rd Bldg #104 · Denton, TX 76209
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Root Composition ────────────────────────────────────────────────────────
export const WoodlandHills = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scene = SCENES.reduce((a, _, i) => (frame >= SCENES[i].start ? i : a), 0);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("bg-music.mp3")} volume={0.78} />

      {scene === 0 && <SceneIntro frame={frame} />}
      {scene === 1 && (
        <PhotoScene frame={frame} start={150} end={390} src={PHOTOS.drone2} direction="right"
          category="Exterior" headline="Stunning Curb Appeal"
          detail="Nestled on 0.42 private acres in NE Denton"
          badges={["$364,500", "Built 1999", "2-Car Garage"]} />
      )}
      {scene === 2 && (
        <PhotoScene frame={frame} start={390} end={630} src={PHOTOS.interior1} direction="left"
          category="Living Room" headline="Warm & Inviting"
          detail="Brick fireplace · Open floor plan · Natural light" />
      )}
      {scene === 3 && (
        <PhotoScene frame={frame} start={630} end={870} src={PHOTOS.interior2} direction="right"
          category="Kitchen" headline="Chef-Ready Kitchen"
          detail="Modern appliances · Ample counter space · Dining area" />
      )}
      {scene === 4 && (
        <PhotoScene frame={frame} start={870} end={1110} src={PHOTOS.interior3} direction="up"
          category="Master Bedroom" headline="Peaceful Retreat"
          detail="Spacious layout · Walk-in closet · En-suite bath" />
      )}
      {scene === 5 && (
        <PhotoScene frame={frame} start={1110} end={1290} src={PHOTOS.drone1} direction="down"
          category="Backyard & Outbuilding" headline="Expansive Outdoor Space"
          detail="20×16 storage shed · Mature trees · Half-acre privacy"
          badges={["0.42 Acres", "Storage Shed", "3 Bed / 2 Bath"]} />
      )}
      {scene === 6 && <SceneNeighborhood frame={frame} />}
      {scene === 7 && <SceneLocation frame={frame} />}
      {scene === 8 && <SceneCTA frame={frame} />}

      <ProgressBar frame={frame} total={durationInFrames} />
    </AbsoluteFill>
  );
};
