// ============================================
// GAME CONSTANTS
// ============================================

// Game loop
export const FPS = 60;
export const FRAME_TIME = 1000 / FPS;

// Match settings
export const ROUND_TIME = 20; // seconds
export const TOTAL_ROUNDS = 3;
export const COUNTDOWN_TIME = 3;
export const ROUND_END_DELAY = 2;

// Combat
export const PERFECT_BLOCK_WINDOW = 150; // ms
export const STAMINA_DRAIN_RATE = 15; // per second while blocking
export const STAMINA_REGEN_RATE = 25; // per second when not blocking
export const GUARD_BREAK_STUN = 90; // frames (1.5s at 60fps)
export const BLOCK_ACTIVE_FRAMES = 120; // 2 seconds max
export const BLOCK_COOLDOWN = 300; // ms

// Combo
export const MAX_COMBO_WINDOW = 2000; // ms

// Expression engine
export const DEBOUNCE_MS = 150;
export const EMA_ALPHA = 0.35; // Smoothing factor for EMA

// Expression hold times (ms) - per-expression gating
export const HOLD_TIMES: Record<string, number> = {
  LEFT_BROW_UP: 300,
  RIGHT_BROW_UP: 300,
  BROWS_DOWN: 400,
  BOTH_BROWS_UP: 350,
  LEFT_WINK: 400,
  RIGHT_WINK: 400,
  EYES_WIDE: 500,
  SQUINT: 500,
  SMILE: 350,
  LIPS_PURSE: 400,
  MOUTH_OPEN: 300,
  MOUTH_WIDE: 500,
  JAW_CLENCH: 450,
  HEAD_YAW_LEFT: 300,
  HEAD_YAW_RIGHT: 300,
  LIPS_PRESS: 300,
  CHIN_TUCK: 300,
  TONGUE_OUT: 500,
  HEAD_TILT_UP: 600,
  HEAD_TILT_DOWN: 500,
  HEAD_NOD: 400,
  CHEEKS_PUFFED: 450,
  NOSE_WRINKLE: 400,
  KISSY_FACE: 600,
};

// Desperation mode
export const DESPERATION_HP_THRESHOLD = 0.2; // 20% HP
export const DESPERATION_SENSITIVITY_BOOST = 0.3; // 30% less hold time
export const DESPERATION_HOLD_MULTIPLIER = 1 - DESPERATION_SENSITIVITY_BOOST; // 0.7

// Wink disambiguation
export const WINK_CLOSED_THRESHOLD = 0.70;
export const WINK_OPEN_THRESHOLD = 0.25;

// Camera
export const CAMERA_WIDTH = 640;
export const CAMERA_HEIGHT = 480;
export const NSFW_CHECK_INTERVAL = 2000; // ms
export const NSFW_CANVAS_SIZE = 224;

// FaceLandmarker
export const FACE_LANDMARKER_FPS = 30;
export const LIGHTING_MIN_BRIGHTNESS = 60; // 0-255

// Recording
export const COMPOSITE_WIDTH = 1280;
export const COMPOSITE_HEIGHT = 720;
export const RECORDING_FPS = 30;
export const VIDEO_BITRATE = 2_500_000; // 2.5 Mbps
export const AUDIO_BITRATE = 128_000; // 128 kbps
export const HIGHLIGHT_MIN_DURATION = 8; // seconds
export const HIGHLIGHT_MAX_DURATION = 12; // seconds
export const GIF_MAX_DURATION = 3; // seconds
export const GIF_MAX_SIZE = 8 * 1024 * 1024; // 8MB

// Moment scoring
export const MOMENT_SCORES = {
  heavy_hit: 40,
  ko: 100,
  combo: 50,
  between_round: 30,
  comeback: 60,
  simultaneous: 70,
} as const;

// Challenge links
export const CHALLENGE_TOKEN_LENGTH = 6;
export const CHALLENGE_TTL = 15 * 60; // 15 minutes in seconds

// Announcer
export const ANNOUNCER_NO_REPEAT_WINDOW = 5; // Don't repeat within 5 uses

// Face Pass
export const FACE_PASS_LEVELS = 40;
export const FACE_PASS_SEASON_WEEKS = 6;

// Mystery box pity system
export const PITY_RARE_THRESHOLD = 10;
export const PITY_ULTRA_RARE_SOFT = 20;
export const PITY_ULTRA_RARE_THRESHOLD = 25;
export const PITY_LEGENDARY_THRESHOLD = 50;

// CSS color tokens (from facefights)
export const COLORS = {
  pink: '#FF3366',
  purple: '#6C5CE7',
  cyan: '#00D9FF',
  yellow: '#FFE66D',
  green: '#00D26A',
  orange: '#FF9F43',
  dark: '#0A0A0F',
  darkBg: '#12121A',
  cardBg: '#1A1A2E',
} as const;

// Animation durations (ms)
export const ANIM = {
  idle_bob: 1800,
  anticipate: 150,
  strike: 80,
  recover: 220,
  hitstop_light: 50,
  hitstop_medium: 83,
  hitstop_heavy: 133,
  hit_light: 200,
  hit_medium: 280,
  hit_heavy: 400,
  stagger: 300,
  taunt: 600,
  ko_fall: 800,
  hit_flash: 80,
  screen_shake: 300,
  particle_lifetime: 400,
} as const;
