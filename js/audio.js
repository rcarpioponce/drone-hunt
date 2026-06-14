// ─── SYNTH AUDIO (no audio files) ──────────────────────────────────────────
import { CONFIG } from './config.js';

let ctx = null;
let masterGain = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = CONFIG.MASTER_VOLUME;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

// Resume on first interaction (browser autoplay policy)
export function resumeAudio() {
  getCtx().resume();
}

// ── Laser shot ──────────────────────────────────────────────────────────────
export function playShot() {
  const c = getCtx();
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.connect(g); g.connect(masterGain);
  osc.type = 'sawtooth';
  const t = c.currentTime;
  osc.frequency.setValueAtTime(900, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.18);
  g.gain.setValueAtTime(0.55, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
  osc.start(t);
  osc.stop(t + 0.22);
}

// ── Drone explosion ─────────────────────────────────────────────────────────
export function playExplosion() {
  const c = getCtx();
  const bufLen = c.sampleRate * 0.4;
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.5);
  }
  const src = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const g = c.createGain();
  src.buffer = buf;
  filter.type = 'bandpass';
  filter.frequency.value = 320;
  filter.Q.value = 0.8;
  src.connect(filter); filter.connect(g); g.connect(masterGain);
  const t = c.currentTime;
  g.gain.setValueAtTime(1.0, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  src.start(t);
  src.stop(t + 0.4);
}

// ── Miss / empty click ──────────────────────────────────────────────────────
export function playMiss() {
  const c = getCtx();
  const osc = c.createOscillator();
  const g   = c.createGain();
  osc.connect(g); g.connect(masterGain);
  osc.type = 'sine';
  const t = c.currentTime;
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
  g.gain.setValueAtTime(0.3, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.start(t);
  osc.stop(t + 0.12);
}

// ── Reload / ammo refill ────────────────────────────────────────────────────
export function playReload() {
  const c = getCtx();
  [0, 0.07, 0.14].forEach((delay, i) => {
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g); g.connect(masterGain);
    osc.type = 'square';
    const t = c.currentTime + delay;
    osc.frequency.value = 440 + i * 220;
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.start(t);
    osc.stop(t + 0.06);
  });
}

// ── Drone escaped laugh ─────────────────────────────────────────────────────
export function playEscape() {
  const c = getCtx();
  [300, 280, 250].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g); g.connect(masterGain);
    osc.type = 'triangle';
    const t = c.currentTime + i * 0.12;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t);
    osc.stop(t + 0.1);
  });
}

// ── Round start fanfare ─────────────────────────────────────────────────────
export function playRoundStart() {
  const c = getCtx();
  const notes = [392, 494, 587, 784];
  notes.forEach((freq, i) => {
    const osc = c.createOscillator();
    const g   = c.createGain();
    osc.connect(g); g.connect(masterGain);
    osc.type = 'sine';
    const t = c.currentTime + i * 0.1;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.12);
  });
}
