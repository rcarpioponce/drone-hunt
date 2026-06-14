// ─── DRONE ENTITY ───────────────────────────────────────────────────────────
import { CONFIG } from './config.js';

let _droneId = 0;

export const DroneState = { FLYING: 'flying', HIT: 'hit', ESCAPED: 'escaped' };

export class Drone {
  constructor(canvasW, canvasH, speed) {
    this.id     = ++_droneId;
    this.state  = DroneState.FLYING;
    this.W      = canvasW;
    this.H      = canvasH;

    // Spawn from a random edge (not bottom)
    const edge = Math.floor(Math.random() * 3); // 0=top, 1=left, 2=right
    if (edge === 0) {
      this.x = Math.random() * canvasW;
      this.y = -50;
      this.vx = (Math.random() - 0.5) * speed;
      this.vy = speed * (0.5 + Math.random() * 0.5);
    } else if (edge === 1) {
      this.x = -50;
      this.y = Math.random() * canvasH * 0.7;
      this.vx = speed;
      this.vy = (Math.random() - 0.5) * speed * 0.6;
    } else {
      this.x = canvasW + 50;
      this.y = Math.random() * canvasH * 0.7;
      this.vx = -speed;
      this.vy = (Math.random() - 0.5) * speed * 0.6;
    }

    this.speed = speed;
    this.tick  = Math.random() * Math.PI * 2; // phase offset for zigzag

    // Neon colour per drone
    const hues = [CONFIG.COLOR_CYAN, CONFIG.COLOR_MAGENTA, CONFIG.COLOR_GREEN, '#b000ff'];
    this.color = hues[Math.floor(Math.random() * hues.length)];

    // Particles for explosion
    this.particles = [];
    this.hitTimer  = 0;
    this.radius    = 28;  // visual body radius
    this.glowPulse = 0;
  }

  update() {
    if (this.state === DroneState.HIT) {
      this._updateParticles();
      this.hitTimer--;
      if (this.hitTimer <= 0) this.state = DroneState.ESCAPED; // remove from game
      return;
    }
    if (this.state !== DroneState.FLYING) return;

    this.tick += CONFIG.DRONE_ZIGZAG_FREQ;
    this.glowPulse += 0.08;

    // Zigzag perpendicular to velocity
    const perp = Math.atan2(this.vy, this.vx) + Math.PI / 2;
    const zz   = Math.sin(this.tick) * CONFIG.DRONE_ZIGZAG_AMP;
    this.x += this.vx + Math.cos(perp) * zz;
    this.y += this.vy + Math.sin(perp) * zz;

    // Gently pull down (gravity-ish)
    this.vy += 0.012;

    // Out of bounds → escaped
    if (
      this.x < -120 || this.x > this.W + 120 ||
      this.y < -120 || this.y > this.H + 120
    ) {
      this.state = DroneState.ESCAPED;
    }
  }

  hit() {
    if (this.state !== DroneState.FLYING) return;
    this.state = DroneState.HIT;
    this.hitTimer = CONFIG.PARTICLE_LIFE;
    this._spawnParticles();
  }

  _spawnParticles() {
    for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd   = 1 + Math.random() * CONFIG.PARTICLE_SPEED_MAX;
      this.particles.push({
        x: this.x, y: this.y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 1,
        life: CONFIG.PARTICLE_LIFE,
        maxLife: CONFIG.PARTICLE_LIFE,
        r: 2 + Math.random() * 3,
        color: [this.color, CONFIG.COLOR_ORANGE, '#ffffff'][Math.floor(Math.random() * 3)],
      });
    }
  }

  _updateParticles() {
    for (const p of this.particles) {
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.15; // gravity
      p.life--;
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  draw(ctx) {
    if (this.state === DroneState.HIT) {
      this._drawParticles(ctx);
      return;
    }
    if (this.state !== DroneState.FLYING) return;

    const glow = 12 + Math.sin(this.glowPulse) * 6;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Glow shadow
    ctx.shadowBlur  = glow;
    ctx.shadowColor = this.color;

    // ── Saucer body ─────────────────────────────────────────
    // Dome (top half ellipse)
    ctx.beginPath();
    ctx.ellipse(0, -8, 14, 10, 0, Math.PI, 0);
    ctx.fillStyle = this._hexToRgba(this.color, 0.25);
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Main disc
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = this._hexToRgba(this.color, 0.12);
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ring detail
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius * 0.7, 6, 0, 0, Math.PI * 2);
    ctx.strokeStyle = this._hexToRgba(this.color, 0.5);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Pulsing center light
    const lightR = 4 + Math.sin(this.glowPulse * 2) * 2;
    ctx.beginPath();
    ctx.arc(0, 0, lightR, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 20;
    ctx.fill();

    // Bottom exhaust lights (3 small circles)
    [-14, 0, 14].forEach((ox, i) => {
      const phase = Math.sin(this.glowPulse + i * 1.2);
      ctx.beginPath();
      ctx.arc(ox, 9, 3, 0, Math.PI * 2);
      ctx.fillStyle = this._hexToRgba(this.color, 0.5 + phase * 0.4);
      ctx.shadowBlur = 8;
      ctx.fill();
    });

    ctx.restore();
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = p.color;
      ctx.fillStyle   = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // True if point (px,py) hits the drone hitbox
  testHit(px, py) {
    if (this.state !== DroneState.FLYING) return false;
    const dx = px - this.x;
    const dy = py - this.y;
    return (dx * dx + dy * dy) <= CONFIG.DRONE_HITBOX_R * CONFIG.DRONE_HITBOX_R;
  }
}
