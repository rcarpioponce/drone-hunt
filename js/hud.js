// ─── HUD DRAWING ─────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';

const FONT_MONO = "'Share Tech Mono', 'Courier New', monospace";
let crosshairPulse = 0;

// ── Background environment ───────────────────────────────────────────────────
export function drawBackground(ctx, W, H) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0,   '#020814');
  sky.addColorStop(0.6, '#050a1a');
  sky.addColorStop(1,   '#0a0520');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Perspective grid floor (bottom third)
  _drawGrid(ctx, W, H);

  // Distant stars
  _drawStars(ctx, W, H);
}

function _drawGrid(ctx, W, H) {
  ctx.save();
  ctx.strokeStyle = CONFIG.COLOR_GRID;
  ctx.lineWidth   = 1;

  const floorY  = H * 0.65;
  const horizon = H * 0.62;
  const vp      = { x: W / 2, y: horizon };

  // Horizontal lines
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const y = floorY + (H - floorY) * (t * t);
    ctx.globalAlpha = 0.3 + t * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Vertical lines converging to vanishing point
  const cols = 18;
  for (let i = 0; i <= cols; i++) {
    const x = (i / cols) * W;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.moveTo(vp.x, horizon);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function _drawStars(ctx, W, H) {
  // Deterministic "random" stars
  ctx.save();
  const seed = 42;
  for (let i = 0; i < 120; i++) {
    const t = Math.sin(seed + i * 7.39) * 0.5 + 0.5;
    const s = Math.sin(seed + i * 13.7) * 0.5 + 0.5;
    const x = (Math.sin(seed + i * 5.12) * 0.5 + 0.5) * W;
    const y = (Math.sin(seed + i * 3.89) * 0.5 + 0.5) * H * 0.62;
    const r = 0.5 + t * 1.2;
    const a = 0.3 + s * 0.5;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ── Crosshair ────────────────────────────────────────────────────────────────
export function drawCrosshair(ctx, x, y, armed, handActive) {
  if (!handActive || x < 0) return;
  crosshairPulse += 0.1;
  const pulse  = Math.sin(crosshairPulse) * 3;
  const outer  = 26 + pulse;
  const inner  = 8;
  const color  = armed ? CONFIG.COLOR_RED : '#ff6060';

  ctx.save();
  ctx.translate(x, y);
  ctx.shadowBlur  = 20;
  ctx.shadowColor = color;

  // Outer ring
  ctx.beginPath();
  ctx.arc(0, 0, outer, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth   = armed ? 2 : 1.5;
  ctx.globalAlpha = armed ? 0.9 : 0.5;
  ctx.stroke();

  // Inner dot
  ctx.beginPath();
  ctx.arc(0, 0, inner * 0.15, 0, Math.PI * 2);
  ctx.fillStyle   = color;
  ctx.globalAlpha = 1;
  ctx.fill();

  // Cross lines
  ctx.lineWidth   = 1.5;
  ctx.globalAlpha = 0.8;
  const gap = inner;
  const len = 14;
  [[0,-gap,0,-(gap+len)],[0,gap,0,gap+len],[-gap,0,-(gap+len),0],[gap,0,gap+len,0]]
    .forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    });

  // Corner brackets
  ctx.globalAlpha = 0.6;
  const br = outer + 6;
  const bl = 8;
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy]) => {
    ctx.beginPath();
    ctx.moveTo(sx * br, sy * (br - bl));
    ctx.lineTo(sx * br, sy * br);
    ctx.lineTo(sx * (br - bl), sy * br);
    ctx.stroke();
  });

  ctx.restore();
}

// ── Score / round / HUD panel ─────────────────────────────────────────────────
export function drawHUD(ctx, W, H, { score, round, bullets, maxBullets, droneCount, droneTotal, streak }) {
  ctx.save();

  // ── Top-left: SCORE ───────────────────────────────────────────────────────
  _glowText(ctx, 'SCORE', 20, 28, 11, 'rgba(0,245,255,0.5)');
  _glowText(ctx, String(score).padStart(7, '0'), 20, 56, 22, CONFIG.COLOR_CYAN);

  // ── Top-center: ROUND ────────────────────────────────────────────────────
  _glowText(ctx, `ROUND  ${String(round).padStart(2,'0')}`, W/2, 28, 13, CONFIG.COLOR_MAGENTA, 'center');

  // ── Drones counter ───────────────────────────────────────────────────────
  _glowText(ctx, `${droneCount}/${droneTotal}`, W/2, 50, 11, 'rgba(255,0,200,0.6)', 'center');

  // ── Streak ───────────────────────────────────────────────────────────────
  if (streak > 1) {
    _glowText(ctx, `×${streak} STREAK`, W/2, 70, 10, CONFIG.COLOR_GREEN, 'center');
  }

  // ── Bottom-left: AMMO cells ───────────────────────────────────────────────
  const cellW = 22, cellH = 10, cellGap = 4;
  const ammoX = 20, ammoY = H - 32;
  _glowText(ctx, 'AMMO', ammoX, ammoY - 14, 10, 'rgba(0,245,255,0.5)');
  for (let i = 0; i < maxBullets; i++) {
    const cx = ammoX + i * (cellW + cellGap);
    const filled = i < bullets;
    ctx.shadowBlur  = filled ? 10 : 0;
    ctx.shadowColor = CONFIG.COLOR_CYAN;
    ctx.fillStyle   = filled ? CONFIG.COLOR_CYAN : 'rgba(0,245,255,0.1)';
    ctx.strokeStyle = filled ? CONFIG.COLOR_CYAN : 'rgba(0,245,255,0.3)';
    ctx.lineWidth   = 1;
    ctx.fillRect(cx, ammoY, cellW, cellH);
    if (!filled) ctx.strokeRect(cx, ammoY, cellW, cellH);
  }

  ctx.restore();
}

// ── Mode select screen ────────────────────────────────────────────────────────
const CARD_W   = 320;
const CARD_H   = 190;
const CARD_GAP = 80;

export function getModeSelectRects(W, H) {
  const cardY = Math.round(H * 0.39);
  return {
    camera:  { x: W / 2 - CARD_GAP / 2 - CARD_W, y: cardY, w: CARD_W, h: CARD_H },
    kbmouse: { x: W / 2 + CARD_GAP / 2,           y: cardY, w: CARD_W, h: CARD_H },
  };
}

export function drawModeSelect(ctx, W, H, tick, selectedMode) {
  ctx.save();
  const pulse = Math.sin(tick * 0.04) * 0.15 + 0.85;

  // Background
  ctx.fillStyle = 'rgba(5,10,20,0.94)';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.shadowBlur  = 40;
  ctx.shadowColor = CONFIG.COLOR_CYAN;
  ctx.fillStyle   = CONFIG.COLOR_CYAN;
  ctx.font        = `bold 64px ${FONT_MONO}`;
  ctx.textAlign   = 'center';
  ctx.globalAlpha = pulse;
  ctx.fillText('DRONE HUNT', W / 2, H * 0.2);

  // Subtitle
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = CONFIG.COLOR_MAGENTA;
  ctx.fillStyle   = CONFIG.COLOR_MAGENTA;
  ctx.font        = `17px ${FONT_MONO}`;
  ctx.fillText('ELIGE TU MODO DE CONTROL', W / 2, H * 0.31);

  // Cards
  const rects = getModeSelectRects(W, H);
  _drawModeCard(ctx, rects.camera,  selectedMode === 'camera',  '1',
    'CÁMARA',
    ['Apunta con el índice', 'Dobla el pulgar para disparar']);
  _drawModeCard(ctx, rects.kbmouse, selectedMode === 'kbmouse', '2',
    'TECLADO + MOUSE',
    ['Mouse para apuntar', 'Barra o clic izquierdo', 'para disparar']);

  // Bottom hint (blinking)
  ctx.globalAlpha = Math.abs(Math.sin(tick * 0.05));
  ctx.fillStyle   = 'rgba(0,245,255,0.6)';
  ctx.shadowBlur  = 8;
  ctx.shadowColor = CONFIG.COLOR_CYAN;
  ctx.font        = `13px ${FONT_MONO}`;
  ctx.fillText('[ CLICK EN UNA TARJETA · TECLAS 1/2 · ENTER ]', W / 2, H * 0.88);

  ctx.globalAlpha = 1;
  ctx.restore();
}

function _drawModeCard(ctx, rect, selected, keyLabel, title, descLines) {
  const { x, y, w, h } = rect;
  const cx = x + w / 2;
  ctx.save();

  const color = selected ? CONFIG.COLOR_CYAN : 'rgba(0,245,255,0.25)';

  // Card background
  ctx.shadowBlur  = selected ? 30 : 0;
  ctx.shadowColor = CONFIG.COLOR_CYAN;
  ctx.fillStyle   = selected ? 'rgba(0,245,255,0.07)' : 'rgba(0,245,255,0.02)';
  _roundRect(ctx, x, y, w, h, 8);
  ctx.fill();

  // Card border
  ctx.strokeStyle = color;
  ctx.lineWidth   = selected ? 2 : 1;
  _roundRect(ctx, x, y, w, h, 8);
  ctx.stroke();

  // Key badge
  ctx.shadowBlur  = selected ? 14 : 0;
  ctx.shadowColor = CONFIG.COLOR_CYAN;
  ctx.fillStyle   = selected ? CONFIG.COLOR_CYAN : 'rgba(0,245,255,0.3)';
  ctx.font        = `bold 13px ${FONT_MONO}`;
  ctx.textAlign   = 'left';
  ctx.fillText(`[ ${keyLabel} ]`, x + 16, y + 26);

  // Title
  ctx.textAlign   = 'center';
  ctx.fillStyle   = selected ? CONFIG.COLOR_CYAN : 'rgba(0,245,255,0.5)';
  ctx.font        = `bold 20px ${FONT_MONO}`;
  ctx.fillText(title, cx, y + 68);

  // Description lines
  ctx.fillStyle  = selected ? 'rgba(0,245,255,0.8)' : 'rgba(0,245,255,0.3)';
  ctx.font       = `13px ${FONT_MONO}`;
  ctx.shadowBlur = 0;
  descLines.forEach((line, i) => {
    ctx.fillText(line, cx, y + 103 + i * 22);
  });

  ctx.restore();
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

// ── Screen overlays (splash, game-over) ─────────────────────────────────────
export function drawSplash(ctx, W, H, tick, mode = 'camera') {
  ctx.save();
  const pulse = Math.sin(tick * 0.04) * 0.15 + 0.85;

  ctx.fillStyle = 'rgba(5,10,20,0.88)';
  ctx.fillRect(0, 0, W, H);

  ctx.shadowBlur  = 40;
  ctx.shadowColor = CONFIG.COLOR_CYAN;
  ctx.fillStyle   = CONFIG.COLOR_CYAN;
  ctx.font        = `bold 64px ${FONT_MONO}`;
  ctx.textAlign   = 'center';
  ctx.globalAlpha = pulse;
  ctx.fillText('DRONE HUNT', W/2, H/2 - 80);

  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 10;
  ctx.shadowColor = CONFIG.COLOR_MAGENTA;
  ctx.fillStyle   = CONFIG.COLOR_MAGENTA;
  ctx.font        = `18px ${FONT_MONO}`;
  const aimHint = mode === 'kbmouse'
    ? 'MUEVE EL MOUSE · BARRA O CLIC PARA DISPARAR'
    : 'APUNTA CON EL ÍNDICE · DOBLA EL PULGAR PARA DISPARAR';
  ctx.fillText(aimHint, W/2, H/2);

  ctx.fillStyle   = 'rgba(0,245,255,0.5)';
  ctx.font        = `13px ${FONT_MONO}`;
  ctx.globalAlpha = Math.abs(Math.sin(tick * 0.05));
  const startHint = mode === 'kbmouse'
    ? '[ BARRA O CLIC PARA COMENZAR ]'
    : '[ DOBLA EL PULGAR PARA COMENZAR ]';
  ctx.fillText(startHint, W/2, H/2 + 60);

  ctx.globalAlpha = 0.35;
  ctx.font        = `11px ${FONT_MONO}`;
  ctx.fillStyle   = '#ffffff';
  const footNote = mode === 'kbmouse'
    ? 'Modo Teclado + Mouse activo'
    : 'Se requiere cámara web · Usar Chrome en localhost';
  ctx.fillText(footNote, W/2, H - 40);

  ctx.restore();
}

export function drawRoundIntro(ctx, W, H, round) {
  ctx.save();
  ctx.fillStyle = 'rgba(5,10,20,0.7)';
  ctx.fillRect(0, 0, W, H);
  _glowText(ctx, `RONDA  ${String(round).padStart(2,'0')}`, W/2, H/2 - 20, 52, CONFIG.COLOR_CYAN, 'center');
  _glowText(ctx, '¡PREPÁRATE!', W/2, H/2 + 40, 18, CONFIG.COLOR_MAGENTA, 'center');
  ctx.restore();
}

export function drawGameOver(ctx, W, H, score, tick, mode = 'camera') {
  ctx.save();
  ctx.fillStyle = 'rgba(5,10,20,0.9)';
  ctx.fillRect(0, 0, W, H);

  ctx.shadowBlur  = 40;
  ctx.shadowColor = CONFIG.COLOR_ORANGE;
  ctx.fillStyle   = CONFIG.COLOR_ORANGE;
  ctx.font        = `bold 60px ${FONT_MONO}`;
  ctx.textAlign   = 'center';
  ctx.fillText('GAME OVER', W/2, H/2 - 80);

  ctx.shadowBlur  = 15;
  ctx.shadowColor = CONFIG.COLOR_CYAN;
  ctx.fillStyle   = CONFIG.COLOR_CYAN;
  ctx.font        = `22px ${FONT_MONO}`;
  ctx.fillText(`SCORE FINAL: ${String(score).padStart(7,'0')}`, W/2, H/2);

  ctx.globalAlpha = Math.abs(Math.sin(tick * 0.05));
  ctx.font        = `14px ${FONT_MONO}`;
  ctx.fillStyle   = 'rgba(0,245,255,0.7)';
  const restartHint = mode === 'kbmouse'
    ? '[ BARRA O CLIC PARA REINICIAR ]'
    : '[ DOBLA EL PULGAR PARA REINICIAR ]';
  ctx.fillText(restartHint, W/2, H/2 + 60);

  ctx.restore();
}

export function drawMissFlash(ctx, W, H, intensity) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(255,106,0,${intensity * 0.15})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function drawHitFlash(ctx, W, H, intensity) {
  if (intensity <= 0) return;
  ctx.save();
  ctx.fillStyle = `rgba(0,245,255,${intensity * 0.12})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ── Alien taunt (appears when drone escapes / bullets exhausted) ─────────────
export function drawAlienTaunt(ctx, W, H, timer, maxTimer) {
  if (timer <= 0) return;

  const progress = 1 - timer / maxTimer;  // 0→1 over life
  const RISE  = 0.22;   // fraction of life spent rising
  const TAUNT = 0.72;   // fraction where taunt ends (rise+taunt+fall)

  // Y position: rise in, bob in middle, sink out
  const baseY = H + 10;     // fully below screen
  const peekY = H - 140;    // alien center when fully up

  let cy;
  if (progress < RISE) {
    // Rising
    const t = progress / RISE;
    cy = baseY - (baseY - peekY) * _ease(t);
  } else if (progress < TAUNT) {
    // Taunting — bob up/down
    const t = (progress - RISE) / (TAUNT - RISE);
    cy = peekY + Math.sin(t * Math.PI * 5) * 8;
  } else {
    // Sinking
    const t = (progress - TAUNT) / (1 - TAUNT);
    cy = peekY + (baseY - peekY) * _ease(t);
  }

  const cx = W / 2;
  const bobPhase = timer * 0.25;  // used for animations

  ctx.save();
  ctx.translate(cx, cy);

  // ── Glow aura ──────────────────────────────────────────────────────────────
  ctx.shadowBlur  = 40;
  ctx.shadowColor = CONFIG.COLOR_GREEN;

  // ── Body (rounded torso) ───────────────────────────────────────────────────
  ctx.fillStyle = '#1a7a3f';
  ctx.strokeStyle = CONFIG.COLOR_GREEN;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 38, 36, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly highlight
  ctx.fillStyle = 'rgba(0,255,135,0.12)';
  ctx.beginPath();
  ctx.ellipse(-6, 30, 18, 24, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // ── Head (teardrop — wide cranium, narrow chin) ────────────────────────────
  ctx.shadowBlur  = 25;
  ctx.fillStyle = '#22a855';
  ctx.strokeStyle = CONFIG.COLOR_GREEN;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 22);                                    // chin point
  ctx.bezierCurveTo(22, 22, 50, -2, 50, -24);          // right: chin → wide
  ctx.bezierCurveTo(50, -50, 28, -58, 0, -58);         // right: wide → crown
  ctx.bezierCurveTo(-28, -58, -50, -50, -50, -24);     // crown → left wide
  ctx.bezierCurveTo(-50, -2, -22, 22, 0, 22);          // left: wide → chin
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head shine (forehead)
  ctx.fillStyle = 'rgba(0,255,135,0.15)';
  ctx.beginPath();
  ctx.ellipse(-14, -42, 18, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // ── Antenna ────────────────────────────────────────────────────────────────
  ctx.shadowBlur = 16;
  ctx.strokeStyle = CONFIG.COLOR_GREEN;
  ctx.lineWidth   = 2;
  const antSway = Math.sin(bobPhase * 0.9) * 4;
  ctx.beginPath();
  ctx.moveTo(0, -52);
  ctx.lineTo(antSway, -82);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(antSway, -86, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#ffffff';
  ctx.fill();

  // ── Eyes (large almond alien eyes) ─────────────────────────────────────────
  ctx.shadowBlur  = 0;
  // Left eye
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(-22, -20, 17, 21, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = CONFIG.COLOR_GREEN;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Right eye
  ctx.beginPath();
  ctx.ellipse(22, -20, 17, 21, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye shines (two per eye for depth)
  ctx.fillStyle = 'rgba(255,255,255,0.80)';
  ctx.beginPath(); ctx.arc(-26, -28, 4,   0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 26, -28, 4,   0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.50)';
  ctx.beginPath(); ctx.arc(-16, -33, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 18, -33, 2.5, 0, Math.PI * 2); ctx.fill();

  // ── Nostrils ───────────────────────────────────────────────────────────────
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,60,20,0.65)';
  ctx.beginPath(); ctx.ellipse(-5, 2, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 5, 2, 3, 2, 0, 0, Math.PI * 2); ctx.fill();

  // ── Closed curved smile ────────────────────────────────────────────────────
  const smileW = 22 + Math.sin(bobPhase * 0.8) * 2;
  ctx.shadowBlur = 8;
  ctx.shadowColor = CONFIG.COLOR_GREEN;
  ctx.strokeStyle = CONFIG.COLOR_GREEN;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-smileW, 8);
  ctx.quadraticCurveTo(0, 22, smileW, 8);
  ctx.stroke();
  // Subtle inner glow line
  ctx.strokeStyle = 'rgba(0,255,135,0.30)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-smileW + 5, 9);
  ctx.quadraticCurveTo(0, 21, smileW - 5, 9);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.shadowBlur = 0;

  // ── Arms (raised, waving) ──────────────────────────────────────────────────
  ctx.shadowBlur  = 10;
  ctx.shadowColor = CONFIG.COLOR_GREEN;
  ctx.strokeStyle = CONFIG.COLOR_GREEN;
  ctx.lineWidth   = 8;
  ctx.lineCap     = 'round';

  // Left arm (raised and waving outward)
  const leftWave = Math.sin(bobPhase * 1.3 + 1) * 15;
  ctx.beginPath();
  ctx.moveTo(-32, 20);
  ctx.quadraticCurveTo(-62 + leftWave * 0.3, -10 + leftWave, -74 + leftWave, -28 + leftWave * 0.6);
  ctx.stroke();

  // Right arm (raised and waving, mirrored phase)
  const rightWave = Math.sin(bobPhase * 1.3) * 15;
  ctx.beginPath();
  ctx.moveTo(32, 20);
  ctx.quadraticCurveTo(62 + rightWave * 0.3, -10 + rightWave, 74 + rightWave, -28 + rightWave * 0.6);
  ctx.stroke();

  // Hands (small circles)
  ctx.fillStyle = '#22a855';
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(-74 + leftWave,  -28 + leftWave  * 0.6, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 74 + rightWave, -28 + rightWave * 0.6, 7, 0, Math.PI * 2); ctx.fill();

  ctx.restore();

  // ── "¡JA JA JA!" text ───────────────────────────────────────────────────────
  if (progress >= RISE && progress < TAUNT) {
    const textPulse = Math.abs(Math.sin(timer * 0.35));
    ctx.save();
    ctx.shadowBlur  = 20;
    ctx.shadowColor = CONFIG.COLOR_GREEN;
    ctx.fillStyle   = CONFIG.COLOR_GREEN;
    ctx.font        = `bold 28px ${FONT_MONO}`;
    ctx.textAlign   = 'center';
    ctx.globalAlpha = 0.6 + textPulse * 0.4;
    ctx.fillText('¡JA JA JA!', cx, cy - 110);
    ctx.restore();
  }
}

function _ease(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function _glowText(ctx, text, x, y, size, color, align = 'left') {
  ctx.save();
  ctx.font        = `${size}px ${FONT_MONO}`;
  ctx.textAlign   = align;
  ctx.shadowBlur  = 12;
  ctx.shadowColor = color;
  ctx.fillStyle   = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}
