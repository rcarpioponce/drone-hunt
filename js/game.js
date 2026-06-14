// ─── GAME STATE ──────────────────────────────────────────────────────────────
import { CONFIG } from './config.js';
import { Drone, DroneState } from './drone.js';
import { playShot, playExplosion, playMiss, playReload, playEscape, playRoundStart }
  from './audio.js';

export const GameScreen = {
  MODE_SELECT: 'mode_select',
  SPLASH:      'splash',
  ROUND_INTRO: 'round_intro',
  PLAYING:     'playing',
  GAME_OVER:   'game_over',
};

export class Game {
  constructor(canvasW, canvasH) {
    this.W = canvasW;
    this.H = canvasH;
    this.controlMode = 'camera';       // preserved across resets
    this.reset();
    this.screen = GameScreen.MODE_SELECT;  // start at control selection
  }

  // Called once after the player picks a control mode
  confirmMode(modeStr) {
    this.controlMode = modeStr;
    this.screen      = GameScreen.SPLASH;
  }

  reset() {
    this.screen      = GameScreen.SPLASH;
    this.score       = 0;
    this.round       = 1;
    this.streak      = 0;
    this.bullets     = CONFIG.BULLETS_PER_WAVE;
    this.maxBullets  = CONFIG.BULLETS_PER_WAVE;
    this.drones      = [];
    this.dronesTotal = 0;
    this.dronesHit   = 0;
    this.droneQueue  = 0;   // how many left to spawn this round
    this.spawnTimer  = 0;
    this.roundTimer  = 0;
    this.reloadTimer = 0;
    this.missFlash   = 0;
    this.hitFlash    = 0;
    this.alienTimer  = 0;
    this.tick        = 0;
    this._activeDrone = null;  // current drone on screen (wave mechanic)
    this._waitingReload = false;
  }

  startRound() {
    this.screen       = GameScreen.ROUND_INTRO;
    this.roundTimer   = CONFIG.ROUND_INTRO_MS / 16.7; // ~frames
    this.droneQueue   = CONFIG.DRONES_PER_ROUND_BASE +
                        (this.round - 1) * CONFIG.DRONES_PER_ROUND_INCREMENT;
    this.dronesTotal  = this.droneQueue;
    this.dronesHit    = 0;
    this.bullets      = CONFIG.BULLETS_PER_WAVE;
    this._activeDrone = null;
    this._waitingReload = false;
    this.drones       = [];
    playRoundStart();
  }

  _droneSpeed() {
    return CONFIG.DRONE_SPEED_BASE + (this.round - 1) * CONFIG.DRONE_SPEED_INCREMENT;
  }

  _spawnNextDrone() {
    if (this.droneQueue <= 0) return;
    const d = new Drone(this.W, this.H, this._droneSpeed());
    this.drones.push(d);
    this._activeDrone = d;
    this.droneQueue--;
    this.bullets         = CONFIG.BULLETS_PER_WAVE;
    this._waitingReload  = false;
    playReload();
  }

  // Called every frame from main.js
  update(input) {
    this.tick++;

    // Mode selection screen — animations run but no game logic
    if (this.screen === GameScreen.MODE_SELECT) return;

    this.missFlash  = Math.max(0, this.missFlash  - 0.06);
    this.hitFlash   = Math.max(0, this.hitFlash   - 0.06);
    this.alienTimer = Math.max(0, this.alienTimer - 1);

    // ── SPLASH ───────────────────────────────────────────────────────────────
    if (this.screen === GameScreen.SPLASH) {
      if (input.triggerFired && input.active) {
        this.startRound();
      }
      return;
    }

    // ── GAME OVER ────────────────────────────────────────────────────────────
    if (this.screen === GameScreen.GAME_OVER) {
      if (input.triggerFired && input.active) {
        this.reset();
        this.startRound();
      }
      return;
    }

    // ── ROUND INTRO ──────────────────────────────────────────────────────────
    if (this.screen === GameScreen.ROUND_INTRO) {
      this.roundTimer--;
      if (this.roundTimer <= 0) {
        this.screen = GameScreen.PLAYING;
        this._spawnNextDrone();
      }
      return;
    }

    // ── PLAYING ──────────────────────────────────────────────────────────────
    if (this.screen !== GameScreen.PLAYING) return;

    // Update all drones
    for (const d of this.drones) d.update();

    // Check if active drone resolved
    if (this._activeDrone) {
      const ad = this._activeDrone;

      if (ad.state === DroneState.HIT && !this._waitingReload) {
        // Already scored when hit; wait for particles to finish then next wave
        this._waitingReload = true;
        this._reloadCountdown = CONFIG.PARTICLE_LIFE + 10;
      }

      if (ad.state === DroneState.ESCAPED && !this._waitingReload) {
        // Out of bounds escape — always taunt
        playEscape();
        this._taunt();
        this._waitingReload = true;
        this._reloadCountdown = 40;
        this.streak = 0;
      }
    }

    if (this._waitingReload) {
      this._reloadCountdown--;
      if (this._reloadCountdown <= 0) {
        this._waitingReload = false;
        // Remove finished drones
        this.drones = this.drones.filter(d => d.state === DroneState.FLYING);

        if (this.droneQueue > 0) {
          this._spawnNextDrone();
        } else {
          // Round complete — check score
          this._endRound();
        }
      }
    }

    // ── Shooting ──────────────────────────────────────────────────────────────
    if (input.triggerFired && !this._waitingReload) {
      this._shoot(input.x, input.y);
    }

    // ── Out of bullets mid-wave ───────────────────────────────────────────────
    if (this.bullets === 0 && !this._waitingReload && this._activeDrone?.state === DroneState.FLYING) {
      // Force escape
      this._activeDrone.state = DroneState.ESCAPED;
      playEscape();
      this._taunt();
      this._waitingReload  = true;
      this._reloadCountdown = 50;
      this.streak = 0;
    }
  }

  _shoot(cx, cy) {
    if (this.bullets <= 0) return;

    this.bullets--;

    // Test hit against active drone
    if (this._activeDrone && this._activeDrone.testHit(cx, cy)) {
      this._activeDrone.hit();
      this.dronesHit++;
      this.streak++;
      const mult  = 1 + (this.streak - 1) * CONFIG.SCORE_STREAK_MULT;
      const bonus = Math.round(CONFIG.SCORE_HIT_BASE * mult * this.round);
      this.score += bonus;
      this.hitFlash = 1;
      playExplosion();
      this._waitingReload  = true;
      this._reloadCountdown = CONFIG.PARTICLE_LIFE + 10;
    } else {
      // Miss
      this.missFlash = 1;
      playShot();  // dry shot sound
      playMiss();
    }
  }

  _taunt() {
    this.alienTimer = CONFIG.ALIEN_TAUNT_FRAMES;
  }

  _endRound() {
    // All drones done; advance round
    this.round++;
    // Simple game over if score too low? (optional — keep playing forever)
    this.startRound();
  }

  // ── Read-only getters for HUD ─────────────────────────────────────────────
  get hudData() {
    return {
      score:       this.score,
      round:       this.round,
      bullets:     this.bullets,
      maxBullets:  this.maxBullets,
      droneCount:  this.dronesHit,
      droneTotal:  this.dronesTotal,
      streak:      this.streak,
    };
  }
}
