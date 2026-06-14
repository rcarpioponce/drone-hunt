// ─── MAIN BOOTSTRAP + GAME LOOP ─────────────────────────────────────────────
import { CONFIG }                          from './config.js';
import { init as initHand, detect as detectHand } from './handTracker.js';
import { processInput, setInputMode }      from './input.js';
import { Game, GameScreen }                from './game.js';
import {
  drawBackground, drawCrosshair, drawHUD,
  drawModeSelect, getModeSelectRects,
  drawSplash, drawRoundIntro, drawGameOver,
  drawMissFlash, drawHitFlash, drawAlienTaunt,
} from './hud.js';
import { resumeAudio } from './audio.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const canvas      = document.getElementById('game-canvas');
const ctx         = canvas.getContext('2d');
const video       = document.getElementById('webcam');
const loadScreen  = document.getElementById('loading-screen');
const loaderBar   = document.getElementById('loader-bar');
const handStatus  = document.getElementById('hand-status');
const camPreview  = document.getElementById('cam-preview');

// ── Canvas size ───────────────────────────────────────────────────────────────
canvas.width  = CONFIG.WIDTH;
canvas.height = CONFIG.HEIGHT;

// ── Game instance ─────────────────────────────────────────────────────────────
const game = new Game(CONFIG.WIDTH, CONFIG.HEIGHT);

// ── Active mode (null until confirmed) ───────────────────────────────────────
let activeMode = null;

// ── Mode selection state (highlighted card, keyboard nav) ─────────────────────
let highlightedMode = 'camera';

// Convert client coords → canvas logical coords (handles CSS scaling)
function _canvasPoint(clientX, clientY) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top)  * scaleY,
  };
}

// ── Confirm mode and start ────────────────────────────────────────────────────
function _confirmMode(modeStr) {
  if (activeMode !== null) return;   // already chosen

  if (modeStr === 'kbmouse') {
    activeMode = 'kbmouse';
    setInputMode('kbmouse');
    game.confirmMode('kbmouse');
    // Hide camera-only UI elements
    handStatus.style.display = 'none';
    camPreview.style.display = 'none';
    canvas.style.cursor      = 'none';   // custom crosshair drawn on canvas
  } else {
    _bootCamera();
  }
}

// ── Camera boot (deferred until camera mode is chosen) ───────────────────────
async function _bootCamera() {
  loadScreen.classList.remove('hidden');
  _setLoading('Solicitando cámara…', 15);

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
  } catch (err) {
    _setLoading('ERROR: cámara no disponible. Presiona ESC para volver.', 0);
    return;  // activeMode stays null → user can escape back to selection
  }

  video.srcObject = stream;
  await new Promise(res => { video.onloadedmetadata = res; });
  video.play();

  const previewVideo = document.querySelector('#cam-preview video');
  if (previewVideo) {
    previewVideo.srcObject = stream;
    previewVideo.play().catch(() => {});
  }

  _setLoading('Cargando modelo de mano (MediaPipe)…', 40);
  try {
    await initHand(video);
  } catch (err) {
    _setLoading('ERROR al cargar MediaPipe: ' + err.message, 0);
    return;
  }

  _setLoading('¡Listo!', 100);
  await new Promise(res => setTimeout(res, 500));

  loadScreen.classList.add('hidden');

  activeMode = 'camera';
  setInputMode('camera');
  game.confirmMode('camera');
}

function _setLoading(msg, pct) {
  const p = loadScreen.querySelector('p');
  if (p) p.textContent = msg;
  if (loaderBar) loaderBar.style.width = pct + '%';
}

// ── Mode selection listeners (always active until a mode is confirmed) ────────
window.addEventListener('keydown', (e) => {
  // Escape: dismiss loading screen on camera boot failure, return to selection
  if (e.code === 'Escape' && activeMode === null) {
    loadScreen.classList.add('hidden');
    return;
  }

  if (activeMode !== null) return;   // mode already chosen

  if (e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'ArrowLeft') {
    highlightedMode = 'camera';
  } else if (e.code === 'Digit2' || e.code === 'Numpad2' || e.code === 'ArrowRight') {
    highlightedMode = 'kbmouse';
  } else if (e.code === 'Enter' || e.code === 'NumpadEnter') {
    _confirmMode(highlightedMode);
  }
});

// Click on a mode card to select it
canvas.addEventListener('mousedown', (e) => {
  if (activeMode !== null || e.button !== 0) return;
  if (game.screen !== GameScreen.MODE_SELECT) return;
  const pt    = _canvasPoint(e.clientX, e.clientY);
  const rects = getModeSelectRects(CONFIG.WIDTH, CONFIG.HEIGHT);
  for (const [m, r] of Object.entries(rects)) {
    if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
      _confirmMode(m);
      return;
    }
  }
});

// Hover over card = highlight it
canvas.addEventListener('mousemove', (e) => {
  if (activeMode !== null) return;
  if (game.screen !== GameScreen.MODE_SELECT) return;
  const pt    = _canvasPoint(e.clientX, e.clientY);
  const rects = getModeSelectRects(CONFIG.WIDTH, CONFIG.HEIGHT);
  for (const [m, r] of Object.entries(rects)) {
    if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) {
      highlightedMode = m;
      return;
    }
  }
});

// ── Main loop ─────────────────────────────────────────────────────────────────
let frameCount = 0;

function loop(timestamp) {
  frameCount++;

  // Camera hand detection — only when camera mode is active
  if (activeMode === 'camera' && frameCount % 2 === 0) {
    detectHand(timestamp);
  }

  // Input
  const input = processInput(CONFIG.WIDTH, CONFIG.HEIGHT);

  // Resume WebAudio on first interaction
  if (input.triggerFired) resumeAudio();

  // Game update
  game.update(input);

  // ── Render ──────────────────────────────────────────────────────────────────
  drawBackground(ctx, CONFIG.WIDTH, CONFIG.HEIGHT);

  // Mode select — draw selection screen and bail early
  if (game.screen === GameScreen.MODE_SELECT) {
    drawModeSelect(ctx, CONFIG.WIDTH, CONFIG.HEIGHT, game.tick, highlightedMode);
    requestAnimationFrame(loop);
    return;
  }

  // Drones
  for (const d of game.drones) {
    d.draw(ctx);
  }

  // Flashes
  drawMissFlash(ctx, CONFIG.WIDTH, CONFIG.HEIGHT, game.missFlash);
  drawHitFlash(ctx,  CONFIG.WIDTH, CONFIG.HEIGHT, game.hitFlash);

  // Alien taunt
  if (game.alienTimer > 0) {
    drawAlienTaunt(ctx, CONFIG.WIDTH, CONFIG.HEIGHT, game.alienTimer, CONFIG.ALIEN_TAUNT_FRAMES);
  }

  // HUD (always on top of game elements, behind overlay screens)
  if (game.screen === GameScreen.PLAYING || game.screen === GameScreen.ROUND_INTRO) {
    drawHUD(ctx, CONFIG.WIDTH, CONFIG.HEIGHT, game.hudData);
  }

  // Crosshair
  if (game.screen !== GameScreen.SPLASH && game.screen !== GameScreen.GAME_OVER) {
    drawCrosshair(ctx, input.x, input.y, game.bullets > 0, input.active);
  }

  // Screen overlays
  if (game.screen === GameScreen.SPLASH) {
    drawSplash(ctx, CONFIG.WIDTH, CONFIG.HEIGHT, game.tick, game.controlMode);
    if (input.active) {
      drawCrosshair(ctx, input.x, input.y, true, true);
    }
  } else if (game.screen === GameScreen.ROUND_INTRO) {
    drawRoundIntro(ctx, CONFIG.WIDTH, CONFIG.HEIGHT, game.round);
  } else if (game.screen === GameScreen.GAME_OVER) {
    drawGameOver(ctx, CONFIG.WIDTH, CONFIG.HEIGHT, game.score, game.tick, game.controlMode);
    if (input.active) {
      drawCrosshair(ctx, input.x, input.y, true, true);
    }
  }

  // Hand status badge — camera mode only
  if (activeMode === 'camera') {
    handStatus.textContent = input.active ? '● MANO DETECTADA' : '○ MANO NO DETECTADA';
    handStatus.className   = input.active ? 'detected'         : 'missing';
  }

  requestAnimationFrame(loop);
}

// ── Start: hide loading screen, show canvas, enter mode selection immediately ──
loadScreen.classList.add('hidden');
requestAnimationFrame(loop);
