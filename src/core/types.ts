// ============================================
// EXPRESSION TYPES
// ============================================

export enum ExpressionType {
  LEFT_BROW_UP = 'LEFT_BROW_UP',
  RIGHT_BROW_UP = 'RIGHT_BROW_UP',
  BROWS_DOWN = 'BROWS_DOWN',
  BOTH_BROWS_UP = 'BOTH_BROWS_UP',
  LEFT_WINK = 'LEFT_WINK',
  RIGHT_WINK = 'RIGHT_WINK',
  EYES_WIDE = 'EYES_WIDE',
  SQUINT = 'SQUINT',
  SMILE = 'SMILE',
  LIPS_PURSE = 'LIPS_PURSE',
  MOUTH_OPEN = 'MOUTH_OPEN',
  MOUTH_WIDE = 'MOUTH_WIDE',
  JAW_CLENCH = 'JAW_CLENCH',
  HEAD_YAW_LEFT = 'HEAD_YAW_LEFT',
  HEAD_YAW_RIGHT = 'HEAD_YAW_RIGHT',
  LIPS_PRESS = 'LIPS_PRESS',
  CHIN_TUCK = 'CHIN_TUCK',
  TONGUE_OUT = 'TONGUE_OUT',
  HEAD_TILT_UP = 'HEAD_TILT_UP',
  HEAD_TILT_DOWN = 'HEAD_TILT_DOWN',
  HEAD_NOD = 'HEAD_NOD',
  CHEEKS_PUFFED = 'CHEEKS_PUFFED',
  NOSE_WRINKLE = 'NOSE_WRINKLE',
  KISSY_FACE = 'KISSY_FACE',
}

export interface ExpressionEvent {
  type: ExpressionType;
  magnitude: number;
  timestamp: number;
  confidence: number;
}

export interface ExpressionState {
  [key: string]: {
    value: number;
    isActive: boolean;
    lastActivation: number;
    cooldownUntil: number;
  };
}

// ============================================
// BLENDSHAPE TYPES (NEW for FaceLandmarker)
// ============================================

export interface BlendshapeFrame {
  /** Raw 52 blendshape coefficients from MediaPipe FaceLandmarker */
  coefficients: Record<string, number>;
  /** Timestamp of this frame */
  timestamp: number;
  /** Overall face detection confidence 0-1 */
  confidence: number;
}

export interface BlendshapeMapping {
  /** Expression type this blendshape maps to */
  expression: ExpressionType;
  /** Primary blendshape name(s) */
  primary: string[];
  /** Formula to compute value from raw coefficients */
  compute: (coefficients: Record<string, number>) => number;
  /** Per-expression hold time in ms (300-600ms) */
  holdTime: number;
}

// ============================================
// CALIBRATION TYPES (EXTENDED)
// ============================================

export interface CalibrationData {
  thresholds: {
    [key in ExpressionType]: {
      activation: number;
      release: number;
    };
  };
  trackingQuality: number;
  timestamp: number;
}

export interface CalibrationSession {
  /** Neutral baseline blendshape values */
  neutralBaseline: Record<string, number>;
  /** Max observed values per expression during calibration */
  maxValues: Partial<Record<ExpressionType, number>>;
  /** Personalized thresholds derived from calibration */
  thresholds: CalibrationData['thresholds'];
  /** Was calibration completed successfully */
  completed: boolean;
  /** Timestamp */
  timestamp: number;
  /** Ambient lighting brightness during calibration (0-255) */
  lightingBrightness: number;
}

// ============================================
// EXPRESSION GATE TYPES (NEW)
// ============================================

export interface ExpressionGateState {
  /** Per-expression hold progress (0-1) */
  holdProgress: Record<ExpressionType, number>;
  /** When hold started for each expression */
  holdStartTime: Record<ExpressionType, number>;
  /** EMA-smoothed values */
  smoothedValues: Record<ExpressionType, number>;
  /** Whether desperation mode is active (< 20% HP) */
  desperationMode: boolean;
}

// ============================================
// MOVE TYPES
// ============================================

export enum MoveType {
  LIGHT_LEFT = 'LIGHT_LEFT',
  LIGHT_RIGHT = 'LIGHT_RIGHT',
  HEAVY = 'HEAVY',
  DODGE_LEFT = 'DODGE_LEFT',
  DODGE_RIGHT = 'DODGE_RIGHT',
  STUN_PULSE = 'STUN_PULSE',
  TAUNT = 'TAUNT',
  PROJECTILE = 'PROJECTILE',
  UPPERCUT = 'UPPERCUT',
  COUNTER = 'COUNTER',
  WEAVE_LEFT = 'WEAVE_LEFT',
  WEAVE_RIGHT = 'WEAVE_RIGHT',
  BLOCK_HIGH = 'BLOCK_HIGH',
  BLOCK_LOW = 'BLOCK_LOW',
  SPECIAL = 'SPECIAL',
  POWER_UP = 'POWER_UP',
  HEADBUTT = 'HEADBUTT',
  DOUBLE_JAB = 'DOUBLE_JAB',
  FOCUS = 'FOCUS',
  MEGA_PUNCH = 'MEGA_PUNCH',
  GROUND_POUND = 'GROUND_POUND',
  ENERGY_BLAST = 'ENERGY_BLAST',
  CHARM = 'CHARM',
  FURY_ATTACK = 'FURY_ATTACK',
}

export interface MoveDefinition {
  type: MoveType;
  expression: ExpressionType;
  damage: number;
  stun: number;
  startup: number; // frames
  active: number; // frames
  recovery: number; // frames
  cooldown: number; // ms
  meterGain: number;
  meterCost: number;
  isBlock: boolean;
  hitboxOffset: { x: number; y: number };
  hitboxSize: { width: number; height: number };
}

export interface MoveState {
  currentMove: MoveType | null;
  phase: 'startup' | 'active' | 'recovery' | 'idle';
  frameCount: number;
  canCancel: boolean;
}

// ============================================
// COMBAT TYPES
// ============================================

export interface CombatState {
  hp: number;
  maxHp: number;
  meter: number;
  maxMeter: number;
  stamina: number;
  maxStamina: number;
  stunFrames: number;
  isBlocking: boolean;
  blockType: 'high' | 'low' | null;
  isInvincible: boolean;
  comboCount: number;
  position: { x: number; y: number };
  facing: 'left' | 'right';
}

export interface HitResult {
  hit: boolean;
  damage: number;
  blocked: boolean;
  perfectBlock: boolean;
  stun: number;
  pushback: number;
  meterGain: { attacker: number; defender: number };
}

// ============================================
// COMBO TYPES
// ============================================

export interface ComboStep {
  expression: ExpressionType;
  window: number; // ms to input next step
}

export interface ComboDefinition {
  id: string;
  name: string;
  steps: ComboStep[];
  resultMove: MoveType;
  tier: 1 | 2 | 3;
  meterCost: number;
  damage: number;
}

export interface ComboState {
  currentCombo: ComboDefinition | null;
  currentStep: number;
  windowStart: number;
  isExecuting: boolean;
}

// ============================================
// FIGHTER TYPES
// ============================================

export interface FighterStats {
  power: 1 | 2 | 3 | 4 | 5;      // Affects damage dealt
  speed: 1 | 2 | 3 | 4 | 5;      // Affects cooldown speed
  defense: 1 | 2 | 3 | 4 | 5;    // Affects blocking & damage taken
}

export interface FighterDefinition {
  id: string;
  name: string;
  title: string;
  origin: string;
  playstyle: string;
  difficulty: 1 | 2 | 3;
  stars: 1 | 2 | 3 | 4 | 5;      // Overall rating (displayed)
  stats: FighterStats;           // Power, Speed, Defense

  // Stats modifiers (derived from stats)
  thresholdModifier: number;
  cooldownModifier: number;
  windowModifier: number;
  staminaDrainModifier: number;
  perfectBlockWindow: number;

  // Special moves
  signatureSpecial: ComboDefinition;
  ultimate?: ComboDefinition;

  // Visual
  color: string;
  emoji: string;
}

// ============================================
// ANIMATION STATE TYPES (NEW)
// ============================================

export enum FighterAnimState {
  IDLE = 'idle',
  ANTICIPATE = 'anticipate',
  STRIKE = 'strike',
  RECOVER = 'recover',
  HITSTOP = 'hitstop',
  HIT_LIGHT = 'hit_light',
  HIT_MEDIUM = 'hit_medium',
  HIT_HEAVY = 'hit_heavy',
  STAGGER = 'stagger',
  BLOCK = 'block',
  KO = 'ko',
  TAUNT = 'taunt',
}

export interface AnimationFrameData {
  state: FighterAnimState;
  frame: number;
  totalFrames: number;
  /** CSS transform to apply */
  transform: string;
  /** Whether both fighters should freeze (hitstop) */
  hitstopActive: boolean;
}

export interface AttackFrameData {
  startup: number;   // frames
  active: number;    // frames
  recovery: number;  // frames
  hitstop: number;   // frames (both fighters freeze)
}

// ============================================
// MATCH TYPES
// ============================================

export enum MatchPhase {
  LOADING = 'LOADING',
  INTRO = 'INTRO',
  COUNTDOWN = 'COUNTDOWN',
  FIGHTING = 'FIGHTING',
  ROUND_END = 'ROUND_END',
  MATCH_END = 'MATCH_END',
}

export interface RoundResult {
  roundNumber: number;
  winnerId: string | null;
  player1Hp: number;
  player2Hp: number;
  duration: number;
  perfectBlocks: { player1: number; player2: number };
  combos: { player1: number; player2: number };
}

export interface MatchState {
  id: string;
  phase: MatchPhase;
  currentRound: number;
  totalRounds: number;
  roundTime: number;
  maxRoundTime: number;
  player1: PlayerState;
  player2: PlayerState;
  roundResults: RoundResult[];
  isPaused: boolean;
}

export interface PlayerState {
  id: string;
  username: string;
  fighterId: string;
  combat: CombatState;
  move: MoveState;
  combo: ComboState;
  roundsWon: number;
  isLocal: boolean;
}

// ============================================
// BOT TYPES (NEW)
// ============================================

export enum BotDifficulty {
  BABY = 0,       // Giggle Bot
  EASY = 1,       // The Rookie
  MEDIUM = 2,     // The Veteran
  HARD = 3,       // The Champion
  BRUTAL = 4,     // The Master
  NIGHTMARE = 5,  // Face God
}

export interface BotPersonality {
  aggression: number;   // 0-10
  patience: number;     // 0-10
  revenge: number;      // 0-10
  tells: string[];      // visual tell descriptions
  taunts: string[];     // taunt text lines
}

// ============================================
// RECORDING TYPES (NEW)
// ============================================

export interface MomentScore {
  timestamp: number;
  type: 'heavy_hit' | 'ko' | 'combo' | 'between_round' | 'comeback' | 'simultaneous';
  score: number;
}

export interface RecordingState {
  isRecording: boolean;
  startTime: number;
  moments: MomentScore[];
  privacyConsent: boolean;
}

export enum FaceOverlayLayout {
  SIDE_BY_SIDE = 'side_by_side',
  STACK_PORTRAIT = 'stack_portrait',
  REACTION_SPOTLIGHT = 'reaction_spotlight',
  KO_CLOSEUP = 'ko_closeup',
  BETWEEN_ROUND = 'between_round',
}

// ============================================
// CLIP TYPES
// ============================================

export interface ClipEvent {
  type: 'combo' | 'perfect_block' | 'ko' | 'expression_peak' | 'round_win';
  timestamp: number;
  data: any;
  importance: number;
}

export interface ClipSegment {
  startTime: number;
  endTime: number;
  events: ClipEvent[];
  score: number;
}

// ============================================
// ANNOUNCER TYPES (NEW)
// ============================================

export enum AnnouncerPersonality {
  DEADPAN_BUTLER = 'deadpan_butler',
  HYPE_COMMENTATOR = 'hype_commentator',
  DISAPPOINTED_PARENT = 'disappointed_parent',
}

// ============================================
// METAGAME TYPES (NEW)
// ============================================

export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  ULTRA_RARE = 'ultra_rare',
  LEGENDARY = 'legendary',
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'weapon' | 'armour' | 'expression_fx' | 'face_frame' | 'stage' | 'title' | 'badge';
  rarity: Rarity;
  fighterId?: string; // fighter-specific items
}
