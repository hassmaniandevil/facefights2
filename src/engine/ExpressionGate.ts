import { ExpressionType, ExpressionGateState } from '../core/types';
import { EMA_ALPHA, DESPERATION_HP_THRESHOLD, DESPERATION_HOLD_MULTIPLIER } from '../core/constants';
import { ema } from '../utils/math';
import { getHoldTime } from './BlendshapeMapper';

/**
 * ExpressionGate: EMA smoothing + per-expression hold-time gating.
 *
 * Raw blendshape values pass through two stages:
 * 1. EMA smoothing (α=0.35) to reduce jitter
 * 2. Hold-time gating (300-600ms per expression) — the expression must be
 *    sustained above threshold for the required duration before it fires.
 *
 * Visual output: holdProgress (0-1) per expression for UI progress arcs.
 * Desperation Face: below 20% HP → 30% less hold time required.
 */
export class ExpressionGate {
  private smoothedValues: Record<string, number> = {};
  private holdStartTime: Record<string, number> = {};
  private holdProgress: Record<string, number> = {};
  private desperationMode = false;
  private thresholds: Record<ExpressionType, number>;

  constructor() {
    // Default activation thresholds (will be overridden by calibration)
    this.thresholds = {} as Record<ExpressionType, number>;
    for (const type of Object.values(ExpressionType)) {
      this.smoothedValues[type] = 0;
      this.holdStartTime[type] = 0;
      this.holdProgress[type] = 0;
      this.thresholds[type] = 0.3; // default threshold
    }
  }

  /**
   * Set activation thresholds (from calibration or fighter modifiers)
   */
  setThresholds(thresholds: Partial<Record<ExpressionType, number>>): void {
    for (const [type, value] of Object.entries(thresholds)) {
      this.thresholds[type as ExpressionType] = value;
    }
  }

  /**
   * Enable/disable desperation mode (< 20% HP)
   */
  setDesperationMode(enabled: boolean): void {
    this.desperationMode = enabled;
  }

  /**
   * Process raw mapped values through EMA smoothing and hold-time gating.
   * Returns only expressions that have passed the full hold-time gate.
   *
   * @param rawValues Mapped expression values from BlendshapeMapper (0-1)
   * @returns Expressions that have completed their hold-time gate
   */
  process(rawValues: Record<ExpressionType, number>): ExpressionType[] {
    const now = Date.now();
    const gatedExpressions: ExpressionType[] = [];

    for (const type of Object.values(ExpressionType)) {
      const raw = rawValues[type] ?? 0;

      // Stage 1: EMA smoothing
      const prevSmoothed = this.smoothedValues[type] ?? 0;
      const smoothed = ema(raw, prevSmoothed, EMA_ALPHA);
      this.smoothedValues[type] = smoothed;

      const threshold = this.thresholds[type] ?? 0.3;

      // Stage 2: Hold-time gating
      if (smoothed >= threshold) {
        // Above threshold — accumulate hold time
        if (this.holdStartTime[type] === 0) {
          this.holdStartTime[type] = now;
        }

        const holdDuration = now - this.holdStartTime[type];
        let requiredHold = getHoldTime(type);

        // Desperation Face: 30% less hold time
        if (this.desperationMode) {
          requiredHold *= DESPERATION_HOLD_MULTIPLIER;
        }

        this.holdProgress[type] = Math.min(1, holdDuration / requiredHold);

        // Gate passed!
        if (holdDuration >= requiredHold) {
          gatedExpressions.push(type);
          // Reset hold timer so it doesn't re-fire immediately
          this.holdStartTime[type] = 0;
          this.holdProgress[type] = 0;
        }
      } else {
        // Below threshold — reset hold
        this.holdStartTime[type] = 0;
        this.holdProgress[type] = 0;
      }
    }

    return gatedExpressions;
  }

  /**
   * Get EMA-smoothed values for all expressions (for UI/rendering)
   */
  getSmoothedValues(): Record<ExpressionType, number> {
    return { ...this.smoothedValues } as Record<ExpressionType, number>;
  }

  /**
   * Get hold progress for all expressions (0-1, for UI progress arcs)
   */
  getHoldProgress(): Record<ExpressionType, number> {
    return { ...this.holdProgress } as Record<ExpressionType, number>;
  }

  /**
   * Get full gate state for debugging/display
   */
  getState(): ExpressionGateState {
    return {
      holdProgress: { ...this.holdProgress } as Record<ExpressionType, number>,
      holdStartTime: { ...this.holdStartTime } as Record<ExpressionType, number>,
      smoothedValues: { ...this.smoothedValues } as Record<ExpressionType, number>,
      desperationMode: this.desperationMode,
    };
  }

  /**
   * Reset all state
   */
  reset(): void {
    for (const type of Object.values(ExpressionType)) {
      this.smoothedValues[type] = 0;
      this.holdStartTime[type] = 0;
      this.holdProgress[type] = 0;
    }
    this.desperationMode = false;
  }
}
