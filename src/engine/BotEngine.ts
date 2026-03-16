import {
  ExpressionType,
  ExpressionEvent,
  PlayerState,
  BotDifficulty,
  BotPersonality,
} from '../core/types';
import { randomInt } from '../utils/math';

/**
 * BotEngine: 6 difficulty tiers with personality traits.
 *
 * Baby (Giggle Bot): smile only, random timing, can't block
 * Easy (The Rookie): smile + jaw, 2s telegraph, never combos
 * Medium (The Veteran): 4 expressions, adapts to player's dominant expression
 * Hard (The Champion): 6 expressions, blocks, 2-hit combos, counters
 * Brutal (The Master): all expressions, pressure mode, sets traps
 * Nightmare (Face God): optimal decisions, faster-than-human, ~3% beat rate
 */

// Available expressions per difficulty tier
const TIER_EXPRESSIONS: Record<BotDifficulty, ExpressionType[]> = {
  [BotDifficulty.BABY]: [ExpressionType.SMILE],
  [BotDifficulty.EASY]: [ExpressionType.SMILE, ExpressionType.MOUTH_OPEN],
  [BotDifficulty.MEDIUM]: [
    ExpressionType.SMILE, ExpressionType.MOUTH_OPEN,
    ExpressionType.LEFT_BROW_UP, ExpressionType.BROWS_DOWN,
  ],
  [BotDifficulty.HARD]: [
    ExpressionType.SMILE, ExpressionType.MOUTH_OPEN,
    ExpressionType.LEFT_BROW_UP, ExpressionType.RIGHT_BROW_UP,
    ExpressionType.BROWS_DOWN, ExpressionType.JAW_CLENCH,
  ],
  [BotDifficulty.BRUTAL]: [
    ExpressionType.SMILE, ExpressionType.MOUTH_OPEN, ExpressionType.MOUTH_WIDE,
    ExpressionType.LEFT_BROW_UP, ExpressionType.RIGHT_BROW_UP,
    ExpressionType.BROWS_DOWN, ExpressionType.JAW_CLENCH,
    ExpressionType.LIPS_PURSE, ExpressionType.EYES_WIDE,
    ExpressionType.HEAD_YAW_LEFT, ExpressionType.HEAD_YAW_RIGHT,
    ExpressionType.LIPS_PRESS, ExpressionType.CHIN_TUCK,
  ],
  [BotDifficulty.NIGHTMARE]: Object.values(ExpressionType),
};

// Timing ranges per tier (ms between actions)
const TIER_TIMING: Record<BotDifficulty, { min: number; max: number }> = {
  [BotDifficulty.BABY]: { min: 2000, max: 4000 },
  [BotDifficulty.EASY]: { min: 1500, max: 3000 },
  [BotDifficulty.MEDIUM]: { min: 1000, max: 2000 },
  [BotDifficulty.HARD]: { min: 600, max: 1500 },
  [BotDifficulty.BRUTAL]: { min: 400, max: 1000 },
  [BotDifficulty.NIGHTMARE]: { min: 200, max: 600 },
};

// Block probability per tier
const TIER_BLOCK_CHANCE: Record<BotDifficulty, number> = {
  [BotDifficulty.BABY]: 0,
  [BotDifficulty.EASY]: 0,
  [BotDifficulty.MEDIUM]: 0.15,
  [BotDifficulty.HARD]: 0.3,
  [BotDifficulty.BRUTAL]: 0.45,
  [BotDifficulty.NIGHTMARE]: 0.6,
};

// Default bot personalities per tier
const DEFAULT_PERSONALITIES: Record<BotDifficulty, BotPersonality> = {
  [BotDifficulty.BABY]: {
    aggression: 2, patience: 8, revenge: 0,
    tells: ['Giggles before every attack'],
    taunts: ['Hehe!', 'Wheee!'],
  },
  [BotDifficulty.EASY]: {
    aggression: 4, patience: 6, revenge: 2,
    tells: ['Winds up for 2 seconds before heavy attacks'],
    taunts: ['Not bad!', 'Try again!'],
  },
  [BotDifficulty.MEDIUM]: {
    aggression: 5, patience: 5, revenge: 5,
    tells: ['Squints before combos', 'Pauses before blocking'],
    taunts: ['You\'re learning!', 'Getting closer!', 'Nice try!'],
  },
  [BotDifficulty.HARD]: {
    aggression: 7, patience: 4, revenge: 7,
    tells: ['Slight jaw tension before counters'],
    taunts: ['Is that all?', 'Yawn.', 'My grandmother hits harder.'],
  },
  [BotDifficulty.BRUTAL]: {
    aggression: 9, patience: 3, revenge: 9,
    tells: ['Almost invisible micro-expression before specials'],
    taunts: ['Pathetic.', 'I\'m bored.', 'You should quit.'],
  },
  [BotDifficulty.NIGHTMARE]: {
    aggression: 10, patience: 10, revenge: 10,
    tells: [],
    taunts: ['...', 'You cannot win.', 'I know what you\'ll do before you do.'],
  },
};

export class BotEngine {
  private difficulty: BotDifficulty;
  private personality: BotPersonality;
  private lastActionTime = 0;
  private nextActionDelay = 0;
  private playerExpressionHistory: ExpressionType[] = [];
  private consecutiveHits = 0;
  private isInPressureMode = false;
  private pressureEndTime = 0;

  constructor(difficulty: BotDifficulty = BotDifficulty.MEDIUM) {
    this.difficulty = difficulty;
    this.personality = { ...DEFAULT_PERSONALITIES[difficulty] };
    this.scheduleNextAction();
  }

  /**
   * Set difficulty
   */
  setDifficulty(difficulty: BotDifficulty): void {
    this.difficulty = difficulty;
    this.personality = { ...DEFAULT_PERSONALITIES[difficulty] };
  }

  /**
   * Record player expression (for adaptive AI)
   */
  recordPlayerExpression(expression: ExpressionType): void {
    this.playerExpressionHistory.push(expression);
    // Keep last 20
    if (this.playerExpressionHistory.length > 20) {
      this.playerExpressionHistory.shift();
    }
  }

  /**
   * Record hit on bot (for revenge mechanic)
   */
  recordHitOnBot(): void {
    this.consecutiveHits++;

    // Brutal+ enters pressure mode after 3 consecutive hits
    if (this.difficulty >= BotDifficulty.BRUTAL && this.consecutiveHits >= 3) {
      this.isInPressureMode = true;
      this.pressureEndTime = Date.now() + 4000; // 4 seconds of pressure
    }
  }

  /**
   * Record hit by bot (resets consecutive counter)
   */
  recordHitByBot(): void {
    this.consecutiveHits = 0;
  }

  /**
   * Update bot and get action if ready
   */
  update(botPlayer: PlayerState, opponentPlayer: PlayerState): ExpressionEvent | null {
    const now = Date.now();

    // Check pressure mode timeout
    if (this.isInPressureMode && now > this.pressureEndTime) {
      this.isInPressureMode = false;
    }

    // Check if it's time for next action
    if (now - this.lastActionTime < this.nextActionDelay) {
      return null;
    }

    this.lastActionTime = now;

    // Decide action
    const action = this.decideAction(botPlayer, opponentPlayer);
    this.scheduleNextAction();

    return action;
  }

  private decideAction(bot: PlayerState, opponent: PlayerState): ExpressionEvent | null {
    const now = Date.now();

    // Should we block?
    if (this.shouldBlock(opponent)) {
      const blockType = Math.random() > 0.5
        ? ExpressionType.LIPS_PRESS
        : ExpressionType.CHIN_TUCK;
      return this.createEvent(blockType);
    }

    // Should we counter? (Hard+)
    if (this.difficulty >= BotDifficulty.HARD && this.shouldCounter(opponent)) {
      return this.createEvent(ExpressionType.JAW_CLENCH);
    }

    // Medium+ adapts to player's dominant expression
    if (this.difficulty >= BotDifficulty.MEDIUM) {
      const counterExpr = this.getAdaptiveResponse();
      if (counterExpr) {
        return this.createEvent(counterExpr);
      }
    }

    // Pick a random available expression
    const available = TIER_EXPRESSIONS[this.difficulty];
    const chosen = available[randomInt(0, available.length - 1)];
    return this.createEvent(chosen);
  }

  private shouldBlock(opponent: PlayerState): boolean {
    if (opponent.move.phase === 'startup' || opponent.move.phase === 'active') {
      return Math.random() < TIER_BLOCK_CHANCE[this.difficulty];
    }
    return false;
  }

  private shouldCounter(opponent: PlayerState): boolean {
    if (opponent.move.phase !== 'active') return false;

    // Counter chance scales with difficulty
    const counterChance = this.difficulty >= BotDifficulty.NIGHTMARE ? 0.4
      : this.difficulty >= BotDifficulty.BRUTAL ? 0.25
      : 0.1;

    return Math.random() < counterChance;
  }

  private getAdaptiveResponse(): ExpressionType | null {
    if (this.playerExpressionHistory.length < 5) return null;

    // Find player's most used expression
    const counts: Record<string, number> = {};
    for (const expr of this.playerExpressionHistory) {
      counts[expr] = (counts[expr] || 0) + 1;
    }

    const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!dominant || dominant[1] < 3) return null;

    // Hard+ chooses a counter to the dominant expression
    // If player spams attacks, bot blocks or dodges
    const available = TIER_EXPRESSIONS[this.difficulty];
    const dominantType = dominant[0] as ExpressionType;

    // Block if player is aggressive
    if ([ExpressionType.BROWS_DOWN, ExpressionType.MOUTH_OPEN, ExpressionType.MOUTH_WIDE].includes(dominantType)) {
      if (available.includes(ExpressionType.LIPS_PRESS)) {
        return ExpressionType.LIPS_PRESS;
      }
    }

    return null;
  }

  private scheduleNextAction(): void {
    const timing = TIER_TIMING[this.difficulty];
    let delay = randomInt(timing.min, timing.max);

    // Pressure mode = faster actions
    if (this.isInPressureMode) {
      delay = Math.floor(delay * 0.5);
    }

    this.nextActionDelay = delay;
  }

  private createEvent(expression: ExpressionType): ExpressionEvent {
    return {
      type: expression,
      magnitude: 0.6 + Math.random() * 0.4, // 0.6-1.0
      timestamp: Date.now(),
      confidence: 1.0,
    };
  }

  /**
   * Get personality for UI display
   */
  getPersonality(): BotPersonality {
    return { ...this.personality };
  }

  /**
   * Get a random taunt
   */
  getTaunt(): string | null {
    if (this.personality.taunts.length === 0) return null;
    return this.personality.taunts[randomInt(0, this.personality.taunts.length - 1)];
  }

  /**
   * Get difficulty name
   */
  getDifficultyName(): string {
    const names: Record<BotDifficulty, string> = {
      [BotDifficulty.BABY]: 'Giggle Bot',
      [BotDifficulty.EASY]: 'The Rookie',
      [BotDifficulty.MEDIUM]: 'The Veteran',
      [BotDifficulty.HARD]: 'The Champion',
      [BotDifficulty.BRUTAL]: 'The Master',
      [BotDifficulty.NIGHTMARE]: 'Face God',
    };
    return names[this.difficulty];
  }

  /**
   * Reset
   */
  reset(): void {
    this.lastActionTime = 0;
    this.playerExpressionHistory = [];
    this.consecutiveHits = 0;
    this.isInPressureMode = false;
    this.scheduleNextAction();
  }
}
