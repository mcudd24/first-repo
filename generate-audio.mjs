// Synthesises a 62-second uplifting background track and writes public/background.wav
// No external dependencies — pure Node.js.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "public/background.wav");

const SR = 44100;        // sample rate
const DUR = 62;          // seconds
const BPM = 112;
const BEAT = 60 / BPM;  // seconds per beat
const N = SR * DUR;

// ─── helpers ────────────────────────────────────────────────────────────────

const π2 = Math.PI * 2;
const sin = (f, t) => Math.sin(π2 * f * t);
const clamp = (v) => Math.max(-1, Math.min(1, v));

// ADSR envelope over [0, dur] seconds
function adsr(t, dur, A = 0.08, D = 0.12, S = 0.65, R = 0.4) {
  if (t < 0) return 0;
  if (t < A) return t / A;
  if (t < A + D) return 1 - (1 - S) * ((t - A) / D);
  if (t < dur - R) return S;
  if (t < dur) return S * ((dur - t) / R);
  return 0;
}

// Midi note → frequency
function mf(midi) { return 440 * Math.pow(2, (midi - 69) / 12); }

// Pad oscillator: fundamental + harmonics + slight detune for warmth
function pad(freq, t, amp) {
  return amp * (
    sin(freq, t)       * 0.50 +
    sin(freq * 1.002, t) * 0.20 +   // detuned unison
    sin(freq * 2, t)   * 0.15 +
    sin(freq * 3, t)   * 0.08 +
    sin(freq * 4, t)   * 0.04 +
    sin(freq * 0.5, t) * 0.06        // sub octave
  );
}

// Pluck: fast-decaying tone for melodic interest
function pluck(freq, t, noteT, dur) {
  const env = Math.exp(-5 * (t - noteT) / dur);
  return env * (sin(freq, t) * 0.5 + sin(freq * 2, t) * 0.3 + sin(freq * 3, t) * 0.15);
}

// ─── chord progression ───────────────────────────────────────────────────────
// I – vi – IV – V  in C major (4 beats each → 1 full loop = 16 beats)
const LOOP = BEAT * 16;

// Chord notes (MIDI): C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71
const CHORDS = [
  [48, 52, 55, 60],  // C2 E2 G2 C3  (C maj)
  [45, 48, 52, 57],  // A1 C2 E2 A2  (A min)
  [41, 45, 48, 53],  // F1 A1 C2 F2  (F maj)
  [43, 47, 50, 55],  // G1 B1 D2 G2  (G maj)
];

// Melody (C pentatonic: C D E G A)  — rides over the chord loop
// [beat-offset, midi-note, duration-in-beats]
const MELODY = [
  [0,  72, 1], [1,  74, 0.5], [1.5,76, 0.5], [2,  79, 1], [3,  77, 1],
  [4,  76, 1], [5,  74, 1],   [6,  72, 2],
  [8,  74, 0.5],[8.5,76,0.5],[9,  79, 1],[10, 81, 1],
  [11, 79, 1], [12, 76, 1],  [13, 74, 1],[14, 72, 2],
];

// ─── sample generation ───────────────────────────────────────────────────────

const left  = new Float32Array(N);
const right = new Float32Array(N);

// Volume ramp: fade in 1.5 s, fade out 2 s
function masterVol(t) {
  if (t < 1.5) return t / 1.5;
  if (t > DUR - 2) return (DUR - t) / 2;
  return 1;
}

console.log("Generating background music…");

for (let i = 0; i < N; i++) {
  const t = i / SR;
  const mv = masterVol(t);

  // ── pads ─────────────────────────────────────────────────────────────────
  const loopPos = t % LOOP;
  const chordIdx = Math.floor(loopPos / (BEAT * 4)) % CHORDS.length;
  const chordT   = loopPos % (BEAT * 4);
  const chordDur = BEAT * 4;
  const chord    = CHORDS[chordIdx];

  let padSample = 0;
  for (const midi of chord) {
    const f = mf(midi);
    padSample += pad(f, t, 1) * adsr(chordT, chordDur, 0.08, 0.1, 0.7, 0.5);
  }
  padSample *= 0.14;

  // ── bass pulse (on beats 1 & 3) ──────────────────────────────────────────
  const beatPos = loopPos % (BEAT * 2);
  const bassNote = chord[0];
  const bassSample = pad(mf(bassNote - 12), t, 1)
    * adsr(beatPos, BEAT * 2, 0.01, 0.06, 0.4, 0.3) * 0.22;

  // ── melody plucks ─────────────────────────────────────────────────────────
  const loopBeat = (t % LOOP) / BEAT;
  let melSample = 0;
  for (const [start, midi, dur] of MELODY) {
    const nt = loopBeat - start;
    if (nt >= 0 && nt < dur) {
      melSample += pluck(mf(midi), t, t - nt * BEAT, dur * BEAT) * 0.18;
    }
  }

  // ── hi-hat (16th-note clicks) ─────────────────────────────────────────────
  const sixteenth = BEAT / 4;
  const hhPos = t % sixteenth;
  const hhClick = (Math.random() * 2 - 1) * Math.exp(-hhPos * 400) * 0.04;

  // ── mix ──────────────────────────────────────────────────────────────────
  const mono = clamp((padSample + bassSample + melSample + hhClick) * mv);

  // Subtle stereo width via tiny delay on one channel
  left[i]  = mono;
  // right channel gets a 3ms delayed copy blended in (circular buffer trick)
  const delayIdx = i - Math.round(0.003 * SR);
  right[i] = delayIdx >= 0 ? (mono * 0.6 + left[delayIdx] * 0.4) : mono;
}

// ─── write WAV ───────────────────────────────────────────────────────────────

function writeWav(left, right, sr, outPath) {
  const numSamples = left.length;
  const dataBytes  = numSamples * 4; // 2 channels × 2 bytes
  const buf = Buffer.alloc(44 + dataBytes);

  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);           // chunk size
  buf.writeUInt16LE(1, 20);            // PCM
  buf.writeUInt16LE(2, 22);            // stereo
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 4, 28);       // byte rate
  buf.writeUInt16LE(4, 32);            // block align
  buf.writeUInt16LE(16, 34);           // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < numSamples; i++) {
    const l = Math.round(Math.max(-1, Math.min(1, left[i]))  * 32767);
    const r = Math.round(Math.max(-1, Math.min(1, right[i])) * 32767);
    buf.writeInt16LE(l, 44 + i * 4);
    buf.writeInt16LE(r, 44 + i * 4 + 2);
  }

  fs.writeFileSync(outPath, buf);
  console.log(`Written: ${outPath}  (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
}

writeWav(left, right, SR, OUT);
