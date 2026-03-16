import {
  ExpressionType,
  ExpressionEvent,
  MoveType,
  MoveDefinition,
  MoveState,
  CombatState,
  HitResult,
  PlayerState,
} from '../core/types';

// Expression to Move mapping
const EXPRESSION_TO_MOVE: Record<ExpressionType, MoveType> = {
  [ExpressionType.LEFT_BROW_UP]: MoveType.LIGHT_LEFT,
  [ExpressionType.RIGHT_BROW_UP]: MoveType.LIGHT_RIGHT,
  [ExpressionType.BROWS_DOWN]: MoveType.HEAVY,
  [ExpressionType.BOTH_BROWS_UP]: MoveType.DOUBLE_JAB,
  [ExpressionType.LEFT_WINK]: MoveType.DODGE_LEFT,
  [ExpressionType.RIGHT_WINK]: MoveType.DODGE_RIGHT,
  [ExpressionType.EYES_WIDE]: MoveType.STUN_PULSE,
  [ExpressionType.SQUINT]: MoveType.FOCUS,
  [ExpressionType.SMILE]: MoveType.TAUNT,
  [ExpressionType.LIPS_PURSE]: MoveType.PROJECTILE,
  [ExpressionType.MOUTH_OPEN]: MoveType.UPPERCUT,
  [ExpressionType.MOUTH_WIDE]: MoveType.MEGA_PUNCH,
  [ExpressionType.JAW_CLENCH]: MoveType.COUNTER,
  [ExpressionType.HEAD_YAW_LEFT]: MoveType.WEAVE_LEFT,
  [ExpressionType.HEAD_YAW_RIGHT]: MoveType.WEAVE_RIGHT,
  [ExpressionType.LIPS_PRESS]: MoveType.BLOCK_HIGH,
  [ExpressionType.CHIN_TUCK]: MoveType.BLOCK_LOW,
  [ExpressionType.TONGUE_OUT]: MoveType.TAUNT,
  [ExpressionType.HEAD_TILT_UP]: MoveType.POWER_UP,
  [ExpressionType.HEAD_TILT_DOWN]: MoveType.GROUND_POUND,
  [ExpressionType.HEAD_NOD]: MoveType.HEADBUTT,
  [ExpressionType.CHEEKS_PUFFED]: MoveType.ENERGY_BLAST,
  [ExpressionType.NOSE_WRINKLE]: MoveType.FURY_ATTACK,
  [ExpressionType.KISSY_FACE]: MoveType.CHARM,
};

// Move definitions
const MOVE_DEFINITIONS: Record<MoveType, MoveDefinition> = {
  [MoveType.LIGHT_LEFT]: {
    type: MoveType.LIGHT_LEFT,
    expression: ExpressionType.LEFT_BROW_UP,
    damage: 8,
    stun: 10,
    startup: 5,
    active: 3,
    recovery: 10,
    cooldown: 300,
    meterGain: 5,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 50, y: 0 },
    hitboxSize: { width: 80, height: 60 },
  },
  [MoveType.LIGHT_RIGHT]: {
    type: MoveType.LIGHT_RIGHT,
    expression: ExpressionType.RIGHT_BROW_UP,
    damage: 8,
    stun: 10,
    startup: 5,
    active: 3,
    recovery: 10,
    cooldown: 300,
    meterGain: 5,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 50, y: 0 },
    hitboxSize: { width: 80, height: 60 },
  },
  [MoveType.HEAVY]: {
    type: MoveType.HEAVY,
    expression: ExpressionType.BROWS_DOWN,
    damage: 18,
    stun: 25,
    startup: 14,
    active: 5,
    recovery: 20,
    cooldown: 700,
    meterGain: 12,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 40, y: -10 },
    hitboxSize: { width: 100, height: 80 },
  },
  [MoveType.DODGE_LEFT]: {
    type: MoveType.DODGE_LEFT,
    expression: ExpressionType.LEFT_WINK,
    damage: 0,
    stun: 0,
    startup: 3,
    active: 10,
    recovery: 6,
    cooldown: 500,
    meterGain: 0,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.DODGE_RIGHT]: {
    type: MoveType.DODGE_RIGHT,
    expression: ExpressionType.RIGHT_WINK,
    damage: 0,
    stun: 0,
    startup: 3,
    active: 10,
    recovery: 6,
    cooldown: 500,
    meterGain: 0,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.STUN_PULSE]: {
    type: MoveType.STUN_PULSE,
    expression: ExpressionType.EYES_WIDE,
    damage: 5,
    stun: 40,
    startup: 10,
    active: 4,
    recovery: 18,
    cooldown: 1000,
    meterGain: 8,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 30, y: 0 },
    hitboxSize: { width: 120, height: 100 },
  },
  [MoveType.TAUNT]: {
    type: MoveType.TAUNT,
    expression: ExpressionType.SMILE,
    damage: 0,
    stun: 0,
    startup: 8,
    active: 20,
    recovery: 10,
    cooldown: 800,
    meterGain: 20,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.PROJECTILE]: {
    type: MoveType.PROJECTILE,
    expression: ExpressionType.LIPS_PURSE,
    damage: 10,
    stun: 15,
    startup: 12,
    active: 30,
    recovery: 15,
    cooldown: 600,
    meterGain: 6,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 100, y: 0 },
    hitboxSize: { width: 40, height: 40 },
  },
  [MoveType.UPPERCUT]: {
    type: MoveType.UPPERCUT,
    expression: ExpressionType.MOUTH_OPEN,
    damage: 15,
    stun: 30,
    startup: 10,
    active: 4,
    recovery: 18,
    cooldown: 500,
    meterGain: 10,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 30, y: -30 },
    hitboxSize: { width: 70, height: 100 },
  },
  [MoveType.COUNTER]: {
    type: MoveType.COUNTER,
    expression: ExpressionType.JAW_CLENCH,
    damage: 0,
    stun: 0,
    startup: 4,
    active: 12,
    recovery: 24,
    cooldown: 1000,
    meterGain: 0,
    meterCost: 10,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.WEAVE_LEFT]: {
    type: MoveType.WEAVE_LEFT,
    expression: ExpressionType.HEAD_YAW_LEFT,
    damage: 0,
    stun: 0,
    startup: 2,
    active: 8,
    recovery: 5,
    cooldown: 400,
    meterGain: 0,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.WEAVE_RIGHT]: {
    type: MoveType.WEAVE_RIGHT,
    expression: ExpressionType.HEAD_YAW_RIGHT,
    damage: 0,
    stun: 0,
    startup: 2,
    active: 8,
    recovery: 5,
    cooldown: 400,
    meterGain: 0,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.BLOCK_HIGH]: {
    type: MoveType.BLOCK_HIGH,
    expression: ExpressionType.LIPS_PRESS,
    damage: 0,
    stun: 0,
    startup: 2,
    active: 120,
    recovery: 8,
    cooldown: 300,
    meterGain: 0,
    meterCost: 0,
    isBlock: true,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.BLOCK_LOW]: {
    type: MoveType.BLOCK_LOW,
    expression: ExpressionType.CHIN_TUCK,
    damage: 0,
    stun: 0,
    startup: 2,
    active: 120,
    recovery: 8,
    cooldown: 300,
    meterGain: 0,
    meterCost: 0,
    isBlock: true,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.SPECIAL]: {
    type: MoveType.SPECIAL,
    expression: ExpressionType.BROWS_DOWN,
    damage: 30,
    stun: 45,
    startup: 15,
    active: 8,
    recovery: 25,
    cooldown: 1500,
    meterGain: 0,
    meterCost: 50,
    isBlock: false,
    hitboxOffset: { x: 40, y: -20 },
    hitboxSize: { width: 150, height: 120 },
  },
  [MoveType.POWER_UP]: {
    type: MoveType.POWER_UP,
    expression: ExpressionType.HEAD_TILT_UP,
    damage: 0,
    stun: 0,
    startup: 10,
    active: 30,
    recovery: 10,
    cooldown: 1500,
    meterGain: 25,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.HEADBUTT]: {
    type: MoveType.HEADBUTT,
    expression: ExpressionType.HEAD_NOD,
    damage: 20,
    stun: 35,
    startup: 8,
    active: 5,
    recovery: 20,
    cooldown: 800,
    meterGain: 10,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 30, y: -10 },
    hitboxSize: { width: 60, height: 60 },
  },
  [MoveType.DOUBLE_JAB]: {
    type: MoveType.DOUBLE_JAB,
    expression: ExpressionType.BOTH_BROWS_UP,
    damage: 14,
    stun: 15,
    startup: 6,
    active: 6,
    recovery: 12,
    cooldown: 400,
    meterGain: 8,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 50, y: 0 },
    hitboxSize: { width: 90, height: 70 },
  },
  [MoveType.FOCUS]: {
    type: MoveType.FOCUS,
    expression: ExpressionType.SQUINT,
    damage: 0,
    stun: 0,
    startup: 5,
    active: 30,
    recovery: 5,
    cooldown: 1200,
    meterGain: 15,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 0, y: 0 },
    hitboxSize: { width: 0, height: 0 },
  },
  [MoveType.MEGA_PUNCH]: {
    type: MoveType.MEGA_PUNCH,
    expression: ExpressionType.MOUTH_WIDE,
    damage: 25,
    stun: 40,
    startup: 12,
    active: 6,
    recovery: 22,
    cooldown: 900,
    meterGain: 15,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 45, y: -5 },
    hitboxSize: { width: 110, height: 90 },
  },
  [MoveType.GROUND_POUND]: {
    type: MoveType.GROUND_POUND,
    expression: ExpressionType.HEAD_TILT_DOWN,
    damage: 18,
    stun: 50,
    startup: 15,
    active: 8,
    recovery: 25,
    cooldown: 1000,
    meterGain: 12,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 20, y: 20 },
    hitboxSize: { width: 150, height: 60 },
  },
  [MoveType.ENERGY_BLAST]: {
    type: MoveType.ENERGY_BLAST,
    expression: ExpressionType.CHEEKS_PUFFED,
    damage: 15,
    stun: 20,
    startup: 10,
    active: 25,
    recovery: 15,
    cooldown: 800,
    meterGain: 10,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 80, y: 0 },
    hitboxSize: { width: 100, height: 80 },
  },
  [MoveType.FURY_ATTACK]: {
    type: MoveType.FURY_ATTACK,
    expression: ExpressionType.NOSE_WRINKLE,
    damage: 22,
    stun: 30,
    startup: 8,
    active: 10,
    recovery: 18,
    cooldown: 700,
    meterGain: 12,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 40, y: -5 },
    hitboxSize: { width: 85, height: 75 },
  },
  [MoveType.CHARM]: {
    type: MoveType.CHARM,
    expression: ExpressionType.KISSY_FACE,
    damage: 5,
    stun: 60,
    startup: 10,
    active: 15,
    recovery: 12,
    cooldown: 1500,
    meterGain: 18,
    meterCost: 0,
    isBlock: false,
    hitboxOffset: { x: 60, y: 0 },
    hitboxSize: { width: 80, height: 60 },
  },
};

// Stamina drain rate while blocking (per second)
const STAMINA_DRAIN_RATE = 15;

// Stamina regen rate (per second)
const STAMINA_REGEN_RATE = 25;

export class CombatEngine {
  private moveDefinitions: Record<MoveType, MoveDefinition>;
  private perfectBlockWindow: number;

  constructor() {
    this.moveDefinitions = { ...MOVE_DEFINITIONS };
    this.perfectBlockWindow = 150;
  }

  /**
   * Set fighter-specific perfect block window
   */
  setPerfectBlockWindow(window: number): void {
    this.perfectBlockWindow = window;
  }

  /**
   * Process expression event into move
   */
  processExpression(event: ExpressionEvent, player: PlayerState): MoveType | null {
    const moveType = EXPRESSION_TO_MOVE[event.type];

    if (!moveType) return null;

    // Check if player can perform this move
    if (!this.canPerformMove(player, moveType)) {
      return null;
    }

    return moveType;
  }

  /**
   * Check if player can perform a move
   */
  canPerformMove(player: PlayerState, moveType: MoveType): boolean {
    const { combat, move } = player;

    // Can't act while stunned
    if (combat.stunFrames > 0) return false;

    // Can't act while in recovery (except blocks)
    if (move.phase === 'recovery' && !this.isBlock(moveType)) {
      return false;
    }

    // Can't interrupt startup
    if (move.phase === 'startup') return false;

    // Check meter cost
    const def = this.moveDefinitions[moveType];
    if (def.meterCost > 0 && combat.meter < def.meterCost) {
      return false;
    }

    // Can always cancel into block from idle or active
    if (this.isBlock(moveType) && (move.phase === 'idle' || move.phase === 'active')) {
      return true;
    }

    return move.phase === 'idle';
  }

  /**
   * Start a move
   */
  startMove(player: PlayerState, moveType: MoveType): void {
    const def = this.moveDefinitions[moveType];

    player.move = {
      currentMove: moveType,
      phase: 'startup',
      frameCount: 0,
      canCancel: false,
    };

    // Deduct meter cost
    if (def.meterCost > 0) {
      player.combat.meter -= def.meterCost;
    }

    // Set blocking state
    if (this.isBlock(moveType)) {
      player.combat.isBlocking = true;
      player.combat.blockType = moveType === MoveType.BLOCK_HIGH ? 'high' : 'low';
    }
  }

  /**
   * Update move state (called every frame)
   */
  updateMove(player: PlayerState, deltaFrames: number): void {
    const { move, combat } = player;

    if (!move.currentMove) return;

    const def = this.moveDefinitions[move.currentMove];
    move.frameCount += deltaFrames;

    // Update phase based on frame count
    if (move.phase === 'startup' && move.frameCount >= def.startup) {
      move.phase = 'active';
      move.frameCount = 0;

      // Set invincibility for dodges
      if (this.isDodge(move.currentMove)) {
        combat.isInvincible = true;
      }
    } else if (move.phase === 'active' && move.frameCount >= def.active) {
      move.phase = 'recovery';
      move.frameCount = 0;
      combat.isInvincible = false;

      // End blocking
      if (this.isBlock(move.currentMove)) {
        combat.isBlocking = false;
        combat.blockType = null;
      }
    } else if (move.phase === 'recovery' && move.frameCount >= def.recovery) {
      this.endMove(player);
    }

    // Update cancel windows
    if (move.phase === 'recovery' && move.frameCount >= def.recovery * 0.5) {
      move.canCancel = true;
    }
  }

  /**
   * End current move
   */
  endMove(player: PlayerState): void {
    player.move = {
      currentMove: null,
      phase: 'idle',
      frameCount: 0,
      canCancel: false,
    };
    player.combat.isInvincible = false;
    player.combat.isBlocking = false;
    player.combat.blockType = null;
  }

  /**
   * Check for hit between attacker and defender
   */
  checkHit(attacker: PlayerState, defender: PlayerState): HitResult | null {
    const { move: attackMove, combat: attackCombat } = attacker;
    const { combat: defendCombat } = defender;

    if (!attackMove.currentMove || attackMove.phase !== 'active') {
      return null;
    }

    const moveDef = this.moveDefinitions[attackMove.currentMove];

    // Guard against undefined move definitions
    if (!moveDef) {
      console.warn('[CombatEngine] Unknown move type:', attackMove.currentMove);
      return null;
    }

    // No damage moves don't hit
    if (moveDef.damage === 0) return null;

    // Check if defender is invincible
    if (defendCombat.isInvincible) return null;

    // Calculate hitbox positions
    const attackerFacing = attackCombat.facing === 'right' ? 1 : -1;
    const hitboxX = attackCombat.position.x + (moveDef.hitboxOffset.x * attackerFacing);
    const hitboxY = attackCombat.position.y + moveDef.hitboxOffset.y;

    // Simple distance check
    const dx = Math.abs(hitboxX - defendCombat.position.x);
    const dy = Math.abs(hitboxY - defendCombat.position.y);

    if (dx > moveDef.hitboxSize.width / 2 + 40 || dy > moveDef.hitboxSize.height / 2 + 40) {
      return null; // Miss
    }

    // Check for block
    let blocked = false;
    let perfectBlock = false;

    if (defendCombat.isBlocking && defendCombat.stamina > 0) {
      // Check if correct block type
      const isHighAttack = moveDef.hitboxOffset.y <= 0;
      const correctBlock =
        (isHighAttack && defendCombat.blockType === 'high') ||
        (!isHighAttack && defendCombat.blockType === 'low');

      if (correctBlock) {
        blocked = true;

        // Check for perfect block
        const blockStartTime = defender.move.frameCount;
        if (blockStartTime * (1000 / 60) <= this.perfectBlockWindow) {
          perfectBlock = true;
        }
      }
    }

    // Check for counter (jaw clench)
    if (defender.move.currentMove === MoveType.COUNTER && defender.move.phase === 'active') {
      // Counter successful - attacker gets stunned instead
      const counterStun = Math.min(20, Math.floor(moveDef.stun * 0.6) + 10);
      return {
        hit: true,
        damage: 0,
        blocked: true,
        perfectBlock: true,
        stun: counterStun,
        pushback: 30,
        meterGain: { attacker: 0, defender: 10 },
      };
    }

    // Calculate damage
    let damage = moveDef.damage;
    let stun = moveDef.stun;

    if (blocked) {
      if (perfectBlock) {
        damage = 0;
        stun = 0;
      } else {
        damage = Math.floor(damage * 0.2); // Chip damage
        stun = Math.floor(stun * 0.5);
      }
    }

    return {
      hit: true,
      damage,
      blocked,
      perfectBlock,
      stun: blocked ? stun : moveDef.stun,
      pushback: blocked ? 20 : 40,
      meterGain: {
        attacker: blocked ? 2 : moveDef.meterGain,
        defender: blocked ? (perfectBlock ? 15 : 5) : 0,
      },
    };
  }

  /**
   * Apply hit result to defender
   */
  applyHit(defender: PlayerState, result: HitResult): void {
    const { combat } = defender;

    combat.hp = Math.max(0, combat.hp - result.damage);
    combat.stunFrames = result.stun;
    combat.meter = Math.min(combat.maxMeter, combat.meter + result.meterGain.defender);

    // Apply pushback
    const pushDirection = combat.facing === 'right' ? -1 : 1;
    combat.position.x += result.pushback * pushDirection;

    // Reset combo if hit
    if (result.damage > 0 && !result.blocked) {
      combat.comboCount = 0;
    }

    // Drain stamina on block
    if (result.blocked && !result.perfectBlock) {
      combat.stamina = Math.max(0, combat.stamina - 10);
    }
  }

  /**
   * Update stamina
   */
  updateStamina(player: PlayerState, deltaSeconds: number): void {
    const { combat } = player;

    if (combat.isBlocking) {
      // Drain while blocking
      combat.stamina = Math.max(
        0,
        combat.stamina - STAMINA_DRAIN_RATE * deltaSeconds
      );

      // Guard break
      if (combat.stamina <= 0) {
        combat.isBlocking = false;
        combat.blockType = null;
        combat.stunFrames = 90; // 1.5 seconds at 60fps
        this.endMove(player);
      }
    } else {
      // Regen when not blocking
      combat.stamina = Math.min(
        combat.maxStamina,
        combat.stamina + STAMINA_REGEN_RATE * deltaSeconds
      );
    }
  }

  /**
   * Update stun frames
   */
  updateStun(player: PlayerState, deltaFrames: number): void {
    if (player.combat.stunFrames > 0) {
      player.combat.stunFrames = Math.max(0, player.combat.stunFrames - deltaFrames);
    }
  }

  /**
   * Get move definition
   */
  getMoveDefinition(moveType: MoveType): MoveDefinition {
    return this.moveDefinitions[moveType];
  }

  /**
   * Get expression-to-move mapping
   */
  getExpressionToMove(): Record<ExpressionType, MoveType> {
    return { ...EXPRESSION_TO_MOVE };
  }

  /**
   * Check if move is a block
   */
  isBlock(moveType: MoveType): boolean {
    return moveType === MoveType.BLOCK_HIGH || moveType === MoveType.BLOCK_LOW;
  }

  /**
   * Check if move is a dodge
   */
  isDodge(moveType: MoveType): boolean {
    return [
      MoveType.DODGE_LEFT,
      MoveType.DODGE_RIGHT,
      MoveType.WEAVE_LEFT,
      MoveType.WEAVE_RIGHT,
    ].includes(moveType);
  }

  /**
   * Create initial combat state
   */
  createCombatState(isPlayer1: boolean): CombatState {
    return {
      hp: 100,
      maxHp: 100,
      meter: 0,
      maxMeter: 100,
      stamina: 100,
      maxStamina: 100,
      stunFrames: 0,
      isBlocking: false,
      blockType: null,
      isInvincible: false,
      comboCount: 0,
      position: { x: isPlayer1 ? 200 : 600, y: 300 },
      facing: isPlayer1 ? 'right' : 'left',
    };
  }

  /**
   * Create initial move state
   */
  createMoveState(): MoveState {
    return {
      currentMove: null,
      phase: 'idle',
      frameCount: 0,
      canCancel: false,
    };
  }
}

export const combatEngine = new CombatEngine();
