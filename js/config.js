// ─── GAME CONSTANTS ────────────────────────────────────────────────────────
export const CONFIG = {
  // Canvas
  WIDTH: 1280,
  HEIGHT: 720,

  // Hand gesture thresholds
  THUMB_TRIGGER_THRESHOLD: 0.13,  // normalised distance; below = trigger pulled
  CROSSHAIR_LERP: 0.18,           // smoothing factor (0=no move, 1=instant)

  // Game mechanics
  BULLETS_PER_WAVE: 3,
  DRONES_PER_ROUND_BASE: 5,
  DRONES_PER_ROUND_INCREMENT: 2,
  ROUND_INTRO_MS: 2000,
  WAVE_RELOAD_MS: 1200,
  DRONE_ESCAPE_LINGER_MS: 1500,

  // Drone physics
  DRONE_SPEED_BASE: 2.2,
  DRONE_SPEED_INCREMENT: 0.4,    // per round
  DRONE_ZIGZAG_AMP: 1.2,
  DRONE_ZIGZAG_FREQ: 0.035,
  DRONE_HITBOX_R: 42,            // collision radius px

  // Scoring
  SCORE_HIT_BASE: 100,
  SCORE_STREAK_MULT: 0.5,        // +50% per consecutive hit

  // Colours (neón palette)
  COLOR_CYAN: '#00f5ff',
  COLOR_MAGENTA: '#ff00c8',
  COLOR_ORANGE: '#ff6a00',
  COLOR_GREEN: '#00ff87',
  COLOR_RED: '#ff1f2d',
  COLOR_DARK_BG: '#050a14',
  COLOR_GRID: 'rgba(0,245,255,0.07)',

  // Particle explosion
  PARTICLE_COUNT: 22,
  PARTICLE_LIFE: 55,            // frames
  PARTICLE_SPEED_MAX: 7,

  // Alien taunt animation
  ALIEN_TAUNT_FRAMES: 90,       // frames the alien is visible after a miss/escape

  // WebAudio
  MASTER_VOLUME: 0.6,
};
