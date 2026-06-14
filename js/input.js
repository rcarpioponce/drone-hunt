// ─── INPUT: abstracted source (camera or keyboard+mouse) ─────────────────────
import { CONFIG } from './config.js';
import { getHand } from './handTracker.js';

// Landmark indices (MediaPipe Hand Landmarker)
const LM_THUMB_TIP = 4;
const LM_INDEX_MCP = 5;   // base of index finger
const LM_INDEX_TIP = 8;

// ── Input mode: 'camera' | 'kbmouse' | null (not yet selected) ───────────────
let mode = null;

export function setInputMode(m) {
  mode = m;
  if (m === 'kbmouse') _initKbMouseListeners();
}

// ── Camera input ──────────────────────────────────────────────────────────────
const STATE = { ARMED: 'ARMED', FIRED: 'FIRED' };
let triggerState = STATE.ARMED;

let crossX = -200;
let crossY = -200;

function dist2d(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function processCameraInput(canvasW, canvasH) {
  const hand = getHand();

  if (!hand) {
    return { x: crossX, y: crossY, active: false, triggerFired: false };
  }

  const lm    = hand.landmarks;
  const tip   = lm[LM_INDEX_TIP];
  const thumb = lm[LM_THUMB_TIP];
  const mcpI  = lm[LM_INDEX_MCP];

  // Mirror X (webcam is front-facing, so flip)
  const rawX = (1 - tip.x) * canvasW;
  const rawY =       tip.y  * canvasH;

  // Lerp for smoothing
  crossX += (rawX - crossX) * CONFIG.CROSSHAIR_LERP;
  crossY += (rawY - crossY) * CONFIG.CROSSHAIR_LERP;

  // Trigger: thumb tip distance to index MCP (normalised)
  const thumbDist = dist2d(thumb, mcpI);

  let triggerFired = false;
  if (triggerState === STATE.ARMED && thumbDist < CONFIG.THUMB_TRIGGER_THRESHOLD) {
    triggerFired = true;
    triggerState = STATE.FIRED;
  } else if (triggerState === STATE.FIRED && thumbDist >= CONFIG.THUMB_TRIGGER_THRESHOLD) {
    triggerState = STATE.ARMED;
  }

  return { x: crossX, y: crossY, active: true, triggerFired };
}

// ── Keyboard + Mouse input ────────────────────────────────────────────────────
let mouseX       = -200;
let mouseY       = -200;
let pendingFire  = false;
let listenersInit = false;

function _initKbMouseListeners() {
  if (listenersInit) return;
  listenersInit = true;

  const canvas = document.getElementById('game-canvas');

  canvas.addEventListener('mousemove', (e) => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    mouseX = (e.clientX - rect.left) * scaleX;
    mouseY = (e.clientY - rect.top)  * scaleY;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) pendingFire = true;
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();          // prevent page scroll
      if (!e.repeat) pendingFire = true;
    }
  });
}

function processKbMouseInput() {
  const fired = pendingFire;
  pendingFire = false;
  return { x: mouseX, y: mouseY, active: true, triggerFired: fired };
}

// ── Dispatcher ────────────────────────────────────────────────────────────────
// Returns { x, y, active, triggerFired }
// active      = hand detected (camera) | always true (kbmouse)
// triggerFired = true on the frame the shot happens (one-shot per pull/press)
export function processInput(canvasW, canvasH) {
  if (mode === 'kbmouse') return processKbMouseInput();
  return processCameraInput(canvasW, canvasH);
}
