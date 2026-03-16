import {
  ExpressionType,
  ExpressionEvent,
  ExpressionState,
  CalibrationData,
} from '../core/types';

// Default thresholds for expressions - tuned for blendshape-normalized input
const DEFAULT_THRESHOLDS: Record<ExpressionType, { activation: number; release: number }> = {
  [ExpressionType.LEFT_BROW_UP]: { activation: 0.3, release: 0.15 },
  [ExpressionType.RIGHT_BROW_UP]: { activation: 0.3, release: 0.15 },
  [ExpressionType.BROWS_DOWN]: { activation: 0.25, release: 0.12 },
  [ExpressionType.BOTH_BROWS_UP]: { activation: 0.35, release: 0.2 },
  [ExpressionType.LEFT_WINK]: { activation: 0.4, release: 0.25 },
  [ExpressionType.RIGHT_WINK]: { activation: 0.4, release: 0.25 },
  [ExpressionType.EYES_WIDE]: { activation: 0.35, release: 0.2 },
  [ExpressionType.SQUINT]: { activation: 0.3, release: 0.15 },
  [ExpressionType.SMILE]: { activation: 0.3, release: 0.15 },
  [ExpressionType.LIPS_PURSE]: { activation: 0.25, release: 0.12 },
  [ExpressionType.MOUTH_OPEN]: { activation: 0.3, release: 0.15 },
  [ExpressionType.MOUTH_WIDE]: { activation: 0.4, release: 0.25 },
  [ExpressionType.JAW_CLENCH]: { activation: 0.2, release: 0.1 },
  [ExpressionType.HEAD_YAW_LEFT]: { activation: 0.2, release: 0.12 },
  [ExpressionType.HEAD_YAW_RIGHT]: { activation: 0.2, release: 0.12 },
  [ExpressionType.LIPS_PRESS]: { activation: 0.3, release: 0.15 },
  [ExpressionType.CHIN_TUCK]: { activation: 0.15, release: 0.08 },
  [ExpressionType.TONGUE_OUT]: { activation: 0.25, release: 0.12 },
  [ExpressionType.HEAD_TILT_UP]: { activation: 0.25, release: 0.12 },
  [ExpressionType.HEAD_TILT_DOWN]: { activation: 0.25, release: 0.12 },
  [ExpressionType.HEAD_NOD]: { activation: 0.3, release: 0.15 },
  [ExpressionType.CHEEKS_PUFFED]: { activation: 0.2, release: 0.1 },
  [ExpressionType.NOSE_WRINKLE]: { activation: 0.2, release: 0.1 },
  [ExpressionType.KISSY_FACE]: { activation: 0.25, release: 0.12 },
};

// Cooldowns in milliseconds
const COOLDOWNS: Record<ExpressionType, number> = {
  [ExpressionType.LEFT_BROW_UP]: 300,
  [ExpressionType.RIGHT_BROW_UP]: 300,
  [ExpressionType.BROWS_DOWN]: 700,
  [ExpressionType.BOTH_BROWS_UP]: 400,
  [ExpressionType.LEFT_WINK]: 500,
  [ExpressionType.RIGHT_WINK]: 500,
  [ExpressionType.EYES_WIDE]: 1000,
  [ExpressionType.SQUINT]: 1200,
  [ExpressionType.SMILE]: 800,
  [ExpressionType.LIPS_PURSE]: 600,
  [ExpressionType.MOUTH_OPEN]: 500,
  [ExpressionType.MOUTH_WIDE]: 900,
  [ExpressionType.JAW_CLENCH]: 800,
  [ExpressionType.HEAD_YAW_LEFT]: 400,
  [ExpressionType.HEAD_YAW_RIGHT]: 400,
  [ExpressionType.LIPS_PRESS]: 300,
  [ExpressionType.CHIN_TUCK]: 300,
  [ExpressionType.TONGUE_OUT]: 1000,
  [ExpressionType.HEAD_TILT_UP]: 1500,
  [ExpressionType.HEAD_TILT_DOWN]: 1000,
  [ExpressionType.HEAD_NOD]: 800,
  [ExpressionType.CHEEKS_PUFFED]: 800,
  [ExpressionType.NOSE_WRINKLE]: 700,
  [ExpressionType.KISSY_FACE]: 1500,
};

// Minimum activation time (debounce)
const DEBOUNCE_MS = 150;

export class ExpressionEngine {
  private thresholds: Record<ExpressionType, { activation: number; release: number }>;
  private cooldowns: Record<ExpressionType, number>;
  private state: ExpressionState;
  private thresholdModifier: number = 1.0;
  private cooldownModifier: number = 1.0;
  private pendingActivations: Map<ExpressionType, number> = new Map();
  private eventQueue: ExpressionEvent[] = [];
  private listeners: ((event: ExpressionEvent) => void)[] = [];

  constructor(calibration?: CalibrationData) {
    this.thresholds = calibration?.thresholds || { ...DEFAULT_THRESHOLDS };
    this.cooldowns = { ...COOLDOWNS };
    this.state = this.initializeState();
  }

  private initializeState(): ExpressionState {
    const state: ExpressionState = {};
    for (const type of Object.values(ExpressionType)) {
      state[type] = {
        value: 0,
        isActive: false,
        lastActivation: 0,
        cooldownUntil: 0,
      };
    }
    return state;
  }

  /**
   * Apply fighter-specific modifiers
   */
  setModifiers(threshold: number, cooldown: number): void {
    this.thresholdModifier = threshold;
    this.cooldownModifier = cooldown;
  }

  /**
   * Update expression values from blendshape-normalized input.
   * Values should already be mapped from 52 blendshapes to ExpressionType
   * and smoothed via EMA before reaching this engine.
   */
  updateExpressions(values: Record<ExpressionType, number>, confidence: number): void {
    const now = Date.now();

    for (const [type, value] of Object.entries(values) as [ExpressionType, number][]) {
      const exprState = this.state[type];
      if (!exprState) continue;

      const threshold = this.thresholds[type];
      if (!threshold) continue;

      const adjustedActivation = threshold.activation * this.thresholdModifier;
      const adjustedRelease = threshold.release * this.thresholdModifier;

      exprState.value = value;

      // Check for activation
      if (!exprState.isActive && value >= adjustedActivation) {
        // Start debounce timer if not already started
        if (!this.pendingActivations.has(type)) {
          this.pendingActivations.set(type, now);
        } else {
          const pendingStart = this.pendingActivations.get(type)!;
          if (now - pendingStart >= DEBOUNCE_MS) {
            // Check cooldown
            if (now >= exprState.cooldownUntil) {
              this.activateExpression(type, value, confidence);
            }
            this.pendingActivations.delete(type);
          }
        }
      } else if (value < adjustedActivation) {
        // Cancel pending activation if value drops
        this.pendingActivations.delete(type);
      }

      // Check for deactivation
      if (exprState.isActive && value < adjustedRelease) {
        this.deactivateExpression(type);
      }
    }
  }

  private activateExpression(type: ExpressionType, magnitude: number, confidence: number): void {
    const now = Date.now();
    const exprState = this.state[type];

    exprState.isActive = true;
    exprState.lastActivation = now;

    const cooldown = this.cooldowns[type] * this.cooldownModifier;
    exprState.cooldownUntil = now + cooldown;

    const event: ExpressionEvent = {
      type,
      magnitude,
      timestamp: now,
      confidence,
    };

    this.eventQueue.push(event);
    this.notifyListeners(event);
  }

  private deactivateExpression(type: ExpressionType): void {
    this.state[type].isActive = false;
  }

  /**
   * Check if expression is currently active (for holds like blocking)
   */
  isExpressionActive(type: ExpressionType): boolean {
    return this.state[type].isActive;
  }

  /**
   * Get current expression value
   */
  getExpressionValue(type: ExpressionType): number {
    return this.state[type].value;
  }

  /**
   * Get cooldown remaining for expression
   */
  getCooldownRemaining(type: ExpressionType): number {
    const remaining = this.state[type].cooldownUntil - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Pop queued events
   */
  getQueuedEvents(): ExpressionEvent[] {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }

  /**
   * Add event listener
   */
  onExpression(callback: (event: ExpressionEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(event: ExpressionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Load calibration data
   */
  loadCalibration(calibration: CalibrationData): void {
    this.thresholds = calibration.thresholds;
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = this.initializeState();
    this.pendingActivations.clear();
    this.eventQueue = [];
  }

  /**
   * Get full state for debugging
   */
  getState(): ExpressionState {
    return { ...this.state };
  }
}

export const expressionEngine = new ExpressionEngine();
