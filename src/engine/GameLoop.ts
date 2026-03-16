import {
  MatchState,
  MatchPhase,
  PlayerState,
  RoundResult,
  ExpressionEvent,
  ExpressionType,
  BlendshapeFrame,
} from '../core/types';
import {
  ROUND_TIME,
  TOTAL_ROUNDS,
  COUNTDOWN_TIME,
  ROUND_END_DELAY,
  FPS,
  FRAME_TIME,
  DESPERATION_HP_THRESHOLD,
} from '../core/constants';
import { ExpressionEngine } from './ExpressionEngine';
import { CombatEngine } from './CombatEngine';
import { ComboEngine } from './ComboEngine';
import { FaceLandmarker } from './FaceLandmarker';
import { mapBlendshapes } from './BlendshapeMapper';
import { ExpressionGate } from './ExpressionGate';
import { getFighter } from '../fighters';

type GameEventCallback = (event: string, data: any) => void;

export class GameLoop {
  private matchState: MatchState | null = null;
  private expressionEngine: ExpressionEngine;
  private combatEngine: CombatEngine;
  private comboEngine: ComboEngine;
  private faceLandmarker: FaceLandmarker;
  private expressionGate: ExpressionGate;

  private isRunning = false;
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;

  private eventListeners: GameEventCallback[] = [];
  private clipEvents: Array<{ type: string; timestamp: number; data: any }> = [];

  constructor() {
    this.expressionEngine = new ExpressionEngine();
    this.combatEngine = new CombatEngine();
    this.comboEngine = new ComboEngine();
    this.faceLandmarker = new FaceLandmarker();
    this.expressionGate = new ExpressionGate();
  }

  /**
   * Initialize a new match
   */
  async initMatch(config: {
    matchId: string;
    player1: { id: string; username: string; fighterId: string };
    player2: { id: string; username: string; fighterId: string };
    isPlayer1Local: boolean;
  }): Promise<void> {
    const fighter1 = getFighter(config.player1.fighterId);
    const fighter2 = getFighter(config.player2.fighterId);

    if (!fighter1 || !fighter2) {
      throw new Error('Invalid fighter IDs');
    }

    // Set up expression engine with local fighter's modifiers
    const localFighter = config.isPlayer1Local ? fighter1 : fighter2;
    const speedBasedCooldown = localFighter.stats?.speed
      ? 1.3 - (localFighter.stats.speed * 0.1)
      : localFighter.cooldownModifier;
    this.expressionEngine.setModifiers(
      localFighter.thresholdModifier,
      speedBasedCooldown
    );
    this.comboEngine.setWindowModifier(localFighter.windowModifier);
    this.comboEngine.addCombos([localFighter.signatureSpecial]);
    this.combatEngine.setPerfectBlockWindow(localFighter.perfectBlockWindow);

    // Create initial match state
    this.matchState = {
      id: config.matchId,
      phase: MatchPhase.LOADING,
      currentRound: 1,
      totalRounds: TOTAL_ROUNDS,
      roundTime: ROUND_TIME,
      maxRoundTime: ROUND_TIME,
      player1: this.createPlayerState(config.player1, fighter1.id, true, config.isPlayer1Local),
      player2: this.createPlayerState(config.player2, fighter2.id, false, !config.isPlayer1Local),
      roundResults: [],
      isPaused: false,
    };

    // Initialize face tracking
    await this.faceLandmarker.initialize();

    // Set up blendshape → expression pipeline
    this.faceLandmarker.onFrame((frame: BlendshapeFrame) => {
      // Step 1: Map blendshapes to expression values
      const mappedValues = mapBlendshapes(frame.coefficients);

      // Step 2: Pass through ExpressionGate (EMA + hold-time gating)
      const gatedExpressions = this.expressionGate.process(mappedValues);

      // Step 3: For gated expressions, create events and feed to ExpressionEngine
      const smoothedValues = this.expressionGate.getSmoothedValues();
      this.expressionEngine.updateExpressions(smoothedValues, frame.confidence);

      // Step 4: Emit gated expression events for immediate processing
      for (const exprType of gatedExpressions) {
        const event: ExpressionEvent = {
          type: exprType,
          magnitude: smoothedValues[exprType] || 0,
          timestamp: Date.now(),
          confidence: frame.confidence,
        };
        this.processGatedExpression(event);
      }
    });

    this.emit('match:initialized', { matchId: config.matchId });
  }

  private processGatedExpression(event: ExpressionEvent): void {
    if (!this.matchState || this.matchState.phase !== MatchPhase.FIGHTING) return;

    const localPlayer = this.matchState.player1.isLocal
      ? this.matchState.player1
      : this.matchState.player2;

    this.processLocalInput(localPlayer, event);
  }

  private createPlayerState(
    player: { id: string; username: string; fighterId: string },
    fighterId: string,
    isPlayer1: boolean,
    isLocal: boolean
  ): PlayerState {
    return {
      id: player.id,
      username: player.username,
      fighterId,
      combat: this.combatEngine.createCombatState(isPlayer1),
      move: this.combatEngine.createMoveState(),
      combo: { currentCombo: null, currentStep: 0, windowStart: 0, isExecuting: false },
      roundsWon: 0,
      isLocal,
    };
  }

  /**
   * Start the match
   */
  async start(): Promise<void> {
    if (!this.matchState) {
      throw new Error('Match not initialized');
    }

    this.faceLandmarker.start();
    this.isRunning = true;
    this.lastFrameTime = performance.now();

    // Start with intro phase
    this.matchState.phase = MatchPhase.INTRO;
    this.emit('phase:intro', {});

    // After intro, start countdown
    setTimeout(() => {
      if (this.matchState) {
        this.startCountdown();
      }
    }, 2000);

    // Start game loop
    this.loop();
  }

  private startCountdown(): void {
    if (!this.matchState) return;

    this.matchState.phase = MatchPhase.COUNTDOWN;
    let count = COUNTDOWN_TIME;

    const countdownInterval = setInterval(() => {
      this.emit('countdown', { count });
      count--;

      if (count < 0) {
        clearInterval(countdownInterval);
        this.startFighting();
      }
    }, 1000);
  }

  private startFighting(): void {
    if (!this.matchState) return;

    this.matchState.phase = MatchPhase.FIGHTING;
    this.matchState.roundTime = ROUND_TIME;
    this.emit('phase:fighting', { round: this.matchState.currentRound });
  }

  /**
   * Main game loop
   */
  private loop = (): void => {
    if (!this.isRunning || !this.matchState) {
      return;
    }

    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime >= FRAME_TIME) {
      this.update(deltaTime / 1000);
      this.lastFrameTime = now;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Update game state
   */
  private update(deltaSeconds: number): void {
    if (!this.matchState || this.matchState.isPaused) return;

    if (this.matchState.phase !== MatchPhase.FIGHTING) return;

    const deltaFrames = deltaSeconds * FPS;

    // Update round timer
    this.matchState.roundTime -= deltaSeconds;
    if (this.matchState.roundTime <= 0) {
      this.endRound();
      return;
    }

    // Process queued expression events from ExpressionEngine
    const localPlayer = this.matchState.player1.isLocal
      ? this.matchState.player1
      : this.matchState.player2;

    const events = this.expressionEngine.getQueuedEvents();
    for (const event of events) {
      this.processLocalInput(localPlayer, event);
    }

    // Update desperation mode
    const localHpPercent = localPlayer.combat.hp / localPlayer.combat.maxHp;
    this.expressionGate.setDesperationMode(localHpPercent <= DESPERATION_HP_THRESHOLD);

    // Update combat states
    this.updatePlayer(this.matchState.player1, deltaFrames, deltaSeconds);
    this.updatePlayer(this.matchState.player2, deltaFrames, deltaSeconds);

    // Check for hits
    this.checkCombat(this.matchState.player1, this.matchState.player2);
    this.checkCombat(this.matchState.player2, this.matchState.player1);

    // Check for KO
    if (this.matchState.player1.combat.hp <= 0) {
      this.endRound(this.matchState.player2.id);
    } else if (this.matchState.player2.combat.hp <= 0) {
      this.endRound(this.matchState.player1.id);
    }

    // Emit state update
    this.emit('state:update', this.getStateSnapshot());
  }

  private processLocalInput(player: PlayerState, event: ExpressionEvent): void {
    // Check for combo first
    const combo = this.comboEngine.processExpression(event, player.combat.meter);
    if (combo) {
      this.combatEngine.startMove(player, combo.resultMove);
      player.combat.meter -= combo.meterCost;
      player.combat.comboCount++;

      this.emit('combo:executed', {
        playerId: player.id,
        comboName: combo.name,
        damage: combo.damage,
      });

      this.clipEvents.push({
        type: 'combo',
        timestamp: Date.now(),
        data: { comboName: combo.name, playerId: player.id },
      });

      return;
    }

    // Process as regular move
    const moveType = this.combatEngine.processExpression(event, player);
    if (moveType) {
      this.combatEngine.startMove(player, moveType);

      this.emit('move:started', {
        playerId: player.id,
        moveType,
      });
    }
  }

  private updatePlayer(player: PlayerState, deltaFrames: number, deltaSeconds: number): void {
    this.combatEngine.updateMove(player, deltaFrames);
    this.combatEngine.updateStamina(player, deltaSeconds);
    this.combatEngine.updateStun(player, deltaFrames);
  }

  private checkCombat(attacker: PlayerState, defender: PlayerState): void {
    const result = this.combatEngine.checkHit(attacker, defender);

    if (result && result.hit) {
      this.combatEngine.applyHit(defender, result);
      attacker.combat.meter = Math.min(
        attacker.combat.maxMeter,
        attacker.combat.meter + result.meterGain.attacker
      );

      if (result.damage > 0) {
        attacker.combat.comboCount++;
      }

      this.emit('hit', {
        attackerId: attacker.id,
        defenderId: defender.id,
        damage: result.damage,
        blocked: result.blocked,
        perfectBlock: result.perfectBlock,
      });

      if (result.perfectBlock) {
        this.clipEvents.push({
          type: 'perfect_block',
          timestamp: Date.now(),
          data: { defenderId: defender.id },
        });
      }
    }
  }

  private endRound(winnerId?: string): void {
    if (!this.matchState) return;

    this.matchState.phase = MatchPhase.ROUND_END;

    // Determine winner if not KO
    if (!winnerId) {
      if (this.matchState.player1.combat.hp > this.matchState.player2.combat.hp) {
        winnerId = this.matchState.player1.id;
      } else if (this.matchState.player2.combat.hp > this.matchState.player1.combat.hp) {
        winnerId = this.matchState.player2.id;
      }
    }

    // Record round result
    const roundResult: RoundResult = {
      roundNumber: this.matchState.currentRound,
      winnerId: winnerId || null,
      player1Hp: this.matchState.player1.combat.hp,
      player2Hp: this.matchState.player2.combat.hp,
      duration: ROUND_TIME - this.matchState.roundTime,
      perfectBlocks: { player1: 0, player2: 0 },
      combos: {
        player1: this.matchState.player1.combat.comboCount,
        player2: this.matchState.player2.combat.comboCount,
      },
    };

    this.matchState.roundResults.push(roundResult);

    // Update rounds won
    if (winnerId === this.matchState.player1.id) {
      this.matchState.player1.roundsWon++;
    } else if (winnerId === this.matchState.player2.id) {
      this.matchState.player2.roundsWon++;
    }

    this.emit('round:end', roundResult);

    // Check for match end
    const winsNeeded = Math.ceil(TOTAL_ROUNDS / 2);
    if (
      this.matchState.player1.roundsWon >= winsNeeded ||
      this.matchState.player2.roundsWon >= winsNeeded ||
      this.matchState.currentRound >= TOTAL_ROUNDS
    ) {
      setTimeout(() => this.endMatch(), ROUND_END_DELAY * 1000);
    } else {
      setTimeout(() => this.startNextRound(), ROUND_END_DELAY * 1000);
    }
  }

  private startNextRound(): void {
    if (!this.matchState) return;

    this.matchState.currentRound++;

    // Reset combat states
    this.matchState.player1.combat = this.combatEngine.createCombatState(true);
    this.matchState.player2.combat = this.combatEngine.createCombatState(false);
    this.matchState.player1.move = this.combatEngine.createMoveState();
    this.matchState.player2.move = this.combatEngine.createMoveState();

    this.startCountdown();
  }

  private endMatch(): void {
    if (!this.matchState) return;

    this.matchState.phase = MatchPhase.MATCH_END;

    let winnerId: string | null = null;
    if (this.matchState.player1.roundsWon > this.matchState.player2.roundsWon) {
      winnerId = this.matchState.player1.id;
    } else if (this.matchState.player2.roundsWon > this.matchState.player1.roundsWon) {
      winnerId = this.matchState.player2.id;
    }

    this.emit('match:end', {
      winnerId,
      player1RoundsWon: this.matchState.player1.roundsWon,
      player2RoundsWon: this.matchState.player2.roundsWon,
      roundResults: this.matchState.roundResults,
      clipEvents: this.clipEvents,
    });

    this.stop();
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.isRunning = false;
    this.faceLandmarker.stop();

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause/unpause
   */
  setPaused(paused: boolean): void {
    if (this.matchState) {
      this.matchState.isPaused = paused;
      this.emit('match:paused', { paused });
    }
  }

  /**
   * Handle remote player input (for PvP)
   */
  handleRemoteInput(playerId: string, events: ExpressionEvent[]): void {
    if (!this.matchState) return;

    const player =
      this.matchState.player1.id === playerId
        ? this.matchState.player1
        : this.matchState.player2;

    if (player.isLocal) return;

    for (const event of events) {
      const moveType = this.combatEngine.processExpression(event, player);
      if (moveType) {
        this.combatEngine.startMove(player, moveType);
      }
    }
  }

  /**
   * Get current state snapshot
   */
  getStateSnapshot(): MatchState | null {
    return this.matchState ? { ...this.matchState } : null;
  }

  /**
   * Get ExpressionGate (for UI hold progress display)
   */
  getExpressionGate(): ExpressionGate {
    return this.expressionGate;
  }

  /**
   * Get FaceLandmarker (for video display)
   */
  getFaceLandmarker(): FaceLandmarker {
    return this.faceLandmarker;
  }

  /**
   * Add event listener
   */
  on(callback: GameEventCallback): () => void {
    this.eventListeners.push(callback);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== callback);
    };
  }

  private emit(event: string, data: any): void {
    for (const listener of this.eventListeners) {
      listener(event, data);
    }
  }

  /**
   * Get clip events for recording
   */
  getClipEvents(): Array<{ type: string; timestamp: number; data: any }> {
    return [...this.clipEvents];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop();
    this.faceLandmarker.destroy();
    this.matchState = null;
    this.clipEvents = [];
    this.eventListeners = [];
  }
}

export const gameLoop = new GameLoop();
