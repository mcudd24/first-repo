/**
 * Frame-accurate capture of real-estate-demo.html → MP4
 * Uses the Web Animations API to pause and seek every CSS animation/transition
 * to the exact point it should be at each frame.
 */
import { chromium } from 'playwright';
import { execSync }  from 'child_process';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir  = dirname(fileURLToPath(import.meta.url));
const HTML   = resolve(__dir, 'real-estate-demo.html');
const FRAMES = resolve(__dir, '_frames');
const OUTPUT = resolve(__dir, 'real-estate-demo.mp4');

const FPS      = 30;
const DURATION = 45;
const WIDTH    = 960;
const HEIGHT   = 540;
const TOTAL    = FPS * DURATION;  // 1350 frames

const SCENE_STARTS = [0, 5, 13, 21, 29, 37, 43];

if (existsSync(FRAMES)) rmSync(FRAMES, { recursive: true });
mkdirSync(FRAMES);

console.log('Launching Chromium…');
const browser = await chromium.launch({
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
         '--disable-dev-shm-usage', '--force-color-profile=srgb'],
});
const page = await browser.newPage();
await page.setViewportSize({ width: WIDTH, height: HEIGHT });
await page.goto(`file://${HTML}`);
await page.waitForLoadState('domcontentloaded');

// Inject one-time setup
await page.evaluate(() => {
  document.getElementById('play-btn').classList.add('hidden');
  document.getElementById('replay-btn').style.display = 'none';

  const bar   = document.getElementById('progress-bar');
  const timer = document.getElementById('timer');
  bar.style.transition = 'none';

  const DURATION     = 45;
  const SCENE_STARTS = [0, 5, 13, 21, 29, 37, 43];
  const sceneEls     = SCENE_STARTS.map((_, i) => document.getElementById(`s${i + 1}`));
  const dots         = [...document.querySelectorAll('.dot')];

  let prevIdx = -1;

  function fmt(s) {
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  }

  window.renderAtTime = function (globalTime) {
    // 1. Which scene?
    let sceneIdx = 0;
    for (let i = SCENE_STARTS.length - 1; i >= 0; i--) {
      if (globalTime >= SCENE_STARTS[i]) { sceneIdx = i; break; }
    }
    const localMs = (globalTime - SCENE_STARTS[sceneIdx]) * 1000;

    // 2. Update classes only when scene changes
    if (sceneIdx !== prevIdx) {
      sceneEls.forEach((el, i) => el.classList.toggle('active', i === sceneIdx));
      dots.forEach((d, i)     => d.classList.toggle('active', i === sceneIdx));
      prevIdx = sceneIdx;
    }

    // 3. Update progress bar + timer
    bar.style.width   = (globalTime / DURATION * 100) + '%';
    timer.textContent = `${fmt(globalTime)} / ${fmt(DURATION)}`;

    // 4. Pause every CSS animation / transition and seek to exact time.
    //    formula: currentTime = localMs - animationDelay
    //    (at local t=0 the animation sits at -delay, same as the browser would)
    for (const anim of document.getAnimations()) {
      try {
        const delay = (anim.effect?.getTiming()?.delay) ?? 0;
        anim.pause();
        anim.currentTime = localMs - delay;
      } catch (_) {}
    }
  };
});

// ── Frame loop ──────────────────────────────────────────────────────────────
console.log(`Capturing ${TOTAL} frames (${FPS} fps × ${DURATION}s)…`);
const t0 = Date.now();

for (let i = 0; i < TOTAL; i++) {
  await page.evaluate(t => window.renderAtTime(t), i / FPS);

  await page.screenshot({
    path: `${FRAMES}/frame_${String(i).padStart(5, '0')}.png`,
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });

  if (i % 150 === 0) {
    const pct  = Math.round(i / TOTAL * 100);
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write(`\r  ${pct}%  (frame ${i}/${TOTAL})  ${secs}s elapsed`);
  }
}

await browser.close();
console.log(`\nAll frames captured in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// ── FFmpeg encode with background music ────────────────────────────────────
console.log('Encoding MP4…');
const MUSIC = resolve(__dir, 'bg-music.mp3');
execSync(
  `ffmpeg -y -framerate ${FPS} -i "${FRAMES}/frame_%05d.png" -i "${MUSIC}"` +
  ` -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p` +
  ` -c:a aac -b:a 128k -shortest -movflags +faststart "${OUTPUT}"`,
  { stdio: 'inherit' },
);

rmSync(FRAMES, { recursive: true });
console.log(`\n✓  ${OUTPUT}`);
