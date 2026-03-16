import {
  ExpressionType,
  ExpressionEvent,
  ComboDefinition,
  ComboState,
  MoveType,
} from '../core/types';

// Generic combos available to all fighters
const GENERIC_COMBOS: ComboDefinition[] = [
  // Tier 1 - 2 step combos
  {
    id: 'double_jab',
    name: 'Double Jab',
    steps: [
      { expression: ExpressionType.LEFT_BROW_UP, window: 500 },
      { expression: ExpressionType.RIGHT_BROW_UP, window: 500 },
    ],
    resultMove: MoveType.LIGHT_RIGHT,
    tier: 1,
    meterCost: 0,
    damage: 12,
  },
  {
    id: 'dodge_counter',
    name: 'Dodge Counter',
    steps: [
      { expression: ExpressionType.LEFT_WINK, window: 600 },
      { expression: ExpressionType.BROWS_DOWN, window: 500 },
    ],
    resultMove: MoveType.HEAVY,
    tier: 1,
    meterCost: 0,
    damage: 20,
  },
  {
    id: 'stun_strike',
    name: 'Stun Strike',
    steps: [
      { expression: ExpressionType.EYES_WIDE, window: 600 },
      { expression: ExpressionType.JAW_CLENCH, window: 500 },
    ],
    resultMove: MoveType.COUNTER,
    tier: 1,
    meterCost: 0,
    damage: 15,
  },

  // Tier 2 - 3 step combos
  {
    id: 'launcher_finisher',
    name: 'Launcher Finisher',
    steps: [
      { expression: ExpressionType.LEFT_BROW_UP, window: 500 },
      { expression: ExpressionType.RIGHT_BROW_UP, window: 500 },
      { expression: ExpressionType.MOUTH_OPEN, window: 600 },
    ],
    resultMove: MoveType.UPPERCUT,
    tier: 2,
    meterCost: 15,
    damage: 28,
  },
  {
    id: 'dodge_stun_heavy',
    name: 'Phantom Strike',
    steps: [
      { expression: ExpressionType.RIGHT_WINK, window: 600 },
      { expression: ExpressionType.LIPS_PURSE, window: 500 },
      { expression: ExpressionType.BROWS_DOWN, window: 600 },
    ],
    resultMove: MoveType.HEAVY,
    tier: 2,
    meterCost: 20,
    damage: 25,
  },
  {
    id: 'burst_special',
    name: 'Burst Special',
    steps: [
      { expression: ExpressionType.LIPS_PURSE, window: 500 },
      { expression: ExpressionType.MOUTH_OPEN, window: 600 },
    ],
    resultMove: MoveType.SPECIAL,
    tier: 2,
    meterCost: 30,
    damage: 35,
  },
];

// Maximum combo window
const MAX_COMBO_WINDOW = 2000;

export class ComboEngine {
  private combos: ComboDefinition[];
  private state: ComboState;
  private windowModifier: number = 1.0;
  private inputHistory: ExpressionEvent[] = [];
  private listeners: ((combo: ComboDefinition) => void)[] = [];

  constructor(additionalCombos?: ComboDefinition[]) {
    this.combos = [...GENERIC_COMBOS, ...(additionalCombos || [])];
    this.state = this.createInitialState();
  }

  private createInitialState(): ComboState {
    return {
      currentCombo: null,
      currentStep: 0,
      windowStart: 0,
      isExecuting: false,
    };
  }

  /**
   * Set fighter-specific window modifier
   */
  setWindowModifier(modifier: number): void {
    this.windowModifier = modifier;
  }

  /**
   * Add fighter-specific combos
   */
  addCombos(combos: ComboDefinition[]): void {
    this.combos.push(...combos);
  }

  /**
   * Process expression event for combo detection
   */
  processExpression(event: ExpressionEvent, currentMeter: number): ComboDefinition | null {
    const now = event.timestamp;

    // Add to history
    this.inputHistory.push(event);

    // Trim old inputs
    this.inputHistory = this.inputHistory.filter(
      e => now - e.timestamp < MAX_COMBO_WINDOW
    );

    // Check if continuing current combo
    if (this.state.currentCombo) {
      const combo = this.state.currentCombo;
      const currentStep = combo.steps[this.state.currentStep];
      const adjustedWindow = currentStep.window * this.windowModifier;

      if (now - this.state.windowStart > adjustedWindow) {
        // Window expired
        this.reset();
      } else if (event.type === currentStep.expression) {
        // Correct input
        this.state.currentStep++;
        this.state.windowStart = now;

        // Check if combo complete
        if (this.state.currentStep >= combo.steps.length) {
          // Check meter requirement
          if (currentMeter >= combo.meterCost) {
            const completedCombo = this.state.currentCombo;
            this.reset();
            this.notifyListeners(completedCombo);
            return completedCombo;
          } else {
            // Not enough meter
            this.reset();
          }
        }
        return null;
      }
    }

    // Check for new combo starts
    for (const combo of this.combos) {
      if (combo.steps[0].expression === event.type) {
        // Don't start combos we can't afford
        if (combo.meterCost > currentMeter) continue;

        // Check if this combo matches better than current
        if (!this.state.currentCombo || combo.tier > this.state.currentCombo.tier) {
          this.state.currentCombo = combo;
          this.state.currentStep = 1;
          this.state.windowStart = now;
        }
      }
    }

    return null;
  }

  /**
   * Check if currently in combo
   */
  isInCombo(): boolean {
    return this.state.currentCombo !== null;
  }

  /**
   * Get current combo progress
   */
  getProgress(): { combo: ComboDefinition | null; step: number; total: number } {
    if (!this.state.currentCombo) {
      return { combo: null, step: 0, total: 0 };
    }

    return {
      combo: this.state.currentCombo,
      step: this.state.currentStep,
      total: this.state.currentCombo.steps.length,
    };
  }

  /**
   * Get time remaining in current window
   */
  getWindowRemaining(): number {
    if (!this.state.currentCombo) return 0;

    const currentStep = this.state.currentCombo.steps[this.state.currentStep];
    const adjustedWindow = currentStep.window * this.windowModifier;
    const remaining = adjustedWindow - (Date.now() - this.state.windowStart);

    return Math.max(0, remaining);
  }

  /**
   * Reset combo state
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Add combo completion listener
   */
  onComboComplete(callback: (combo: ComboDefinition) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(combo: ComboDefinition): void {
    for (const listener of this.listeners) {
      listener(combo);
    }
  }

  /**
   * Get all available combos
   */
  getCombos(): ComboDefinition[] {
    return [...this.combos];
  }

  /**
   * Get combo by ID
   */
  getCombo(id: string): ComboDefinition | undefined {
    return this.combos.find(c => c.id === id);
  }
}

export const comboEngine = new ComboEngine();
