import { ExpressionType, FighterDefinition, MoveType } from '../core/types';

// ============================================
// FIGHTER DEFINITIONS
// ============================================

export const FIGHTERS: Record<string, FighterDefinition> = {
  // ============================================
  // FREE STARTER FIGHTERS (3 stars, balanced)
  // ============================================
  koji: {
    id: 'koji',
    name: 'KOJI',
    title: 'The Fundamentalist',
    origin: 'Tokyo',
    playstyle: 'Balanced',
    difficulty: 1,
    stars: 3,
    stats: { power: 3, speed: 3, defense: 3 },
    thresholdModifier: 1.0,
    cooldownModifier: 1.0,
    windowModifier: 1.0,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 150,
    color: '#FF5733',
    emoji: '🥋',
    signatureSpecial: {
      id: 'iron_brow_ascension',
      name: 'Iron Brow Ascension',
      steps: [
        { expression: ExpressionType.LEFT_BROW_UP, window: 500 },
        { expression: ExpressionType.RIGHT_BROW_UP, window: 500 },
        { expression: ExpressionType.MOUTH_OPEN, window: 600 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 50,
      damage: 35,
    },
  },

  venus: {
    id: 'venus',
    name: 'VENUS',
    title: 'The Provocateur',
    origin: 'São Paulo',
    playstyle: 'High Risk/Reward',
    difficulty: 2,
    stars: 3,
    stats: { power: 4, speed: 3, defense: 2 },
    thresholdModifier: 1.1,
    cooldownModifier: 1.0,
    windowModifier: 1.15,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 150,
    color: '#FF69B4',
    emoji: '💋',
    signatureSpecial: {
      id: 'kiss_of_chaos',
      name: 'Kiss of Chaos',
      steps: [
        { expression: ExpressionType.SMILE, window: 600 },
        { expression: ExpressionType.LIPS_PURSE, window: 500 },
        { expression: ExpressionType.EYES_WIDE, window: 600 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 45,
      damage: 30,
    },
  },

  granite: {
    id: 'granite',
    name: 'GRANITE',
    title: 'The Immovable',
    origin: 'Moscow',
    playstyle: 'Defensive Tank',
    difficulty: 3,
    stars: 3,
    stats: { power: 2, speed: 2, defense: 5 },
    thresholdModifier: 0.85,
    cooldownModifier: 1.15,
    windowModifier: 1.0,
    staminaDrainModifier: 0.75,
    perfectBlockWindow: 150,
    color: '#708090',
    emoji: '🪨',
    signatureSpecial: {
      id: 'tectonic_jaw',
      name: 'Tectonic Jaw',
      steps: [
        { expression: ExpressionType.JAW_CLENCH, window: 700 },
        { expression: ExpressionType.CHIN_TUCK, window: 600 },
        { expression: ExpressionType.BROWS_DOWN, window: 700 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 55,
      damage: 40,
    },
  },

  // ============================================
  // PREMIUM FIGHTERS (4-5 stars, specialized)
  // ============================================
  flicka: {
    id: 'flicka',
    name: 'FLICKA',
    title: 'The Chaos Gremlin',
    origin: 'Helsinki',
    playstyle: 'Speed Rush',
    difficulty: 2,
    stars: 3,
    stats: { power: 2, speed: 5, defense: 2 },
    thresholdModifier: 1.0,
    cooldownModifier: 0.85,
    windowModifier: 0.9,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 140,
    color: '#00CED1',
    emoji: '⚡',
    signatureSpecial: {
      id: 'blink_blitz',
      name: 'Blink Blitz',
      steps: [
        { expression: ExpressionType.LEFT_WINK, window: 400 },
        { expression: ExpressionType.RIGHT_WINK, window: 400 },
        { expression: ExpressionType.EYES_WIDE, window: 500 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 45,
      damage: 28,
    },
  },

  baron: {
    id: 'baron',
    name: 'BARON',
    title: 'The Aristocrat',
    origin: 'Vienna',
    playstyle: 'Zoner',
    difficulty: 2,
    stars: 3,
    stats: { power: 2, speed: 3, defense: 4 },
    thresholdModifier: 1.0,
    cooldownModifier: 0.9,
    windowModifier: 1.1,
    staminaDrainModifier: 0.85,
    perfectBlockWindow: 160,
    color: '#DAA520',
    emoji: '🎩',
    signatureSpecial: {
      id: 'disdain_volley',
      name: 'Disdain Volley',
      steps: [
        { expression: ExpressionType.LIPS_PURSE, window: 500 },
        { expression: ExpressionType.BROWS_DOWN, window: 600 },
        { expression: ExpressionType.LIPS_PURSE, window: 500 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 50,
      damage: 32,
    },
  },

  nana: {
    id: 'nana',
    name: 'NANA',
    title: 'The Grandmother',
    origin: 'Osaka',
    playstyle: 'Counter-Specialist',
    difficulty: 2,
    stars: 3,
    stats: { power: 3, speed: 2, defense: 4 },
    thresholdModifier: 1.0,
    cooldownModifier: 1.0,
    windowModifier: 1.0,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 175,
    color: '#FFB6C1',
    emoji: '👵',
    signatureSpecial: {
      id: 'patience_dear',
      name: 'Patience, Dear',
      steps: [
        { expression: ExpressionType.LIPS_PRESS, window: 800 },
        { expression: ExpressionType.MOUTH_OPEN, window: 600 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 2,
      meterCost: 40,
      damage: 38,
    },
  },

  hexbyte: {
    id: 'hexbyte',
    name: 'HEXBYTE',
    title: 'The Synthetic',
    origin: 'Unknown',
    playstyle: 'Technical',
    difficulty: 3,
    stars: 3,
    stats: { power: 3, speed: 4, defense: 2 },
    thresholdModifier: 0.9,
    cooldownModifier: 0.9,
    windowModifier: 0.8,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 130,
    color: '#32CD32',
    emoji: '🤖',
    signatureSpecial: {
      id: 'fatal_exception',
      name: 'Fatal Exception',
      steps: [
        { expression: ExpressionType.EYES_WIDE, window: 400 },
        { expression: ExpressionType.BROWS_DOWN, window: 400 },
        { expression: ExpressionType.JAW_CLENCH, window: 450 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 55,
      damage: 42,
    },
  },

  coco: {
    id: 'coco',
    name: 'COCO',
    title: 'The Wildcard',
    origin: 'Lagos',
    playstyle: 'Momentum',
    difficulty: 1,
    stars: 3,
    stats: { power: 3, speed: 4, defense: 2 },
    thresholdModifier: 1.05,
    cooldownModifier: 1.0,
    windowModifier: 1.1,
    staminaDrainModifier: 1.15,
    perfectBlockWindow: 150,
    color: '#FFA500',
    emoji: '🌟',
    signatureSpecial: {
      id: 'joy_overflow',
      name: 'Joy Overflow',
      steps: [
        { expression: ExpressionType.SMILE, window: 500 },
        { expression: ExpressionType.MOUTH_OPEN, window: 600 },
        { expression: ExpressionType.SMILE, window: 600 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 45,
      damage: 30,
    },
  },

  daze: {
    id: 'daze',
    name: 'DAZE',
    title: 'The Sleepwalker',
    origin: 'Seoul',
    playstyle: 'Delayed Reactor',
    difficulty: 3,
    stars: 3,
    stats: { power: 5, speed: 1, defense: 3 },
    thresholdModifier: 1.0,
    cooldownModifier: 1.2,
    windowModifier: 1.3,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 150,
    color: '#9370DB',
    emoji: '😴',
    signatureSpecial: {
      id: 'lucid_moment',
      name: 'Lucid Moment',
      steps: [
        { expression: ExpressionType.BROWS_DOWN, window: 700 },
        { expression: ExpressionType.JAW_CLENCH, window: 700 },
        { expression: ExpressionType.EYES_WIDE, window: 800 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 50,
      damage: 45,
    },
  },

  mirror: {
    id: 'mirror',
    name: 'MIRROR',
    title: 'The Copycat',
    origin: 'Unknown',
    playstyle: 'Adaptive',
    difficulty: 3,
    stars: 3,
    stats: { power: 3, speed: 3, defense: 3 },
    thresholdModifier: 1.0,
    cooldownModifier: 1.0,
    windowModifier: 1.0,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 165,
    color: '#C0C0C0',
    emoji: '🪞',
    signatureSpecial: {
      id: 'stolen_special',
      name: 'Mirror Strike',
      steps: [
        { expression: ExpressionType.LEFT_WINK, window: 600 },
        { expression: ExpressionType.RIGHT_WINK, window: 600 },
        { expression: ExpressionType.BOTH_BROWS_UP, window: 600 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 60,
      damage: 38,
    },
  },

  relic: {
    id: 'relic',
    name: 'RELIC',
    title: 'The Old Master',
    origin: 'Unknown',
    playstyle: 'Heavy Commitment',
    difficulty: 3,
    stars: 3,
    stats: { power: 5, speed: 1, defense: 3 },
    thresholdModifier: 1.0,
    cooldownModifier: 1.4,
    windowModifier: 1.0,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 150,
    color: '#B8860B',
    emoji: '📜',
    signatureSpecial: {
      id: 'weight_of_ages',
      name: 'Weight of Ages',
      steps: [
        { expression: ExpressionType.JAW_CLENCH, window: 900 },
        { expression: ExpressionType.BROWS_DOWN, window: 800 },
        { expression: ExpressionType.MOUTH_WIDE, window: 900 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 50,
      damage: 55,
    },
  },

  twins: {
    id: 'twins',
    name: 'KIKI & KOKO',
    title: 'The Twins',
    origin: 'Singapore',
    playstyle: 'Split Control',
    difficulty: 3,
    stars: 3,
    stats: { power: 3, speed: 4, defense: 2 },
    thresholdModifier: 1.0,
    cooldownModifier: 1.0,
    windowModifier: 0.85,
    staminaDrainModifier: 1.0,
    perfectBlockWindow: 140,
    color: '#FFFFFF',
    emoji: '👯',
    signatureSpecial: {
      id: 'perfect_sync',
      name: 'Perfect Sync',
      steps: [
        { expression: ExpressionType.LEFT_BROW_UP, window: 400 },
        { expression: ExpressionType.RIGHT_BROW_UP, window: 400 },
        { expression: ExpressionType.LEFT_WINK, window: 400 },
        { expression: ExpressionType.RIGHT_WINK, window: 400 },
        { expression: ExpressionType.BROWS_DOWN, window: 500 },
      ],
      resultMove: MoveType.SPECIAL,
      tier: 3,
      meterCost: 60,
      damage: 50,
    },
  },
};

/**
 * Get fighter by ID
 */
export function getFighter(id: string): FighterDefinition | undefined {
  return FIGHTERS[id];
}

/**
 * Get all fighters
 */
export function getAllFighters(): FighterDefinition[] {
  return Object.values(FIGHTERS);
}

/**
 * Get fighters by difficulty
 */
export function getFightersByDifficulty(difficulty: 1 | 2 | 3): FighterDefinition[] {
  return Object.values(FIGHTERS).filter(f => f.difficulty === difficulty);
}

/**
 * Get starter fighters (free)
 */
export function getStarterFighters(): FighterDefinition[] {
  return ['koji', 'venus', 'granite'].map(id => FIGHTERS[id]);
}
