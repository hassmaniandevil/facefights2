import { ExpressionType, CalibrationData, CalibrationSession, BlendshapeFrame } from '../core/types';
import { BLENDSHAPE_NAMES } from './BlendshapeMapper';
import { mapBlendshapes } from './BlendshapeMapper';
import { calculateBrightness } from '../utils/math';

/**
 * CalibrationEngine: 3-step theatrical calibration.
 *
 * Step 1: Neutral baseline (2s) — "Relax your face"
 * Step 2: Max expressions (3 prompts) — "Show me your biggest smile!", etc.
 * Step 3: Normalize — Compute personalized thresholds
 *
 * The calibration is disguised as character interaction:
 * - Selected fighter appears and speaks the prompts
 * - Fighter mirrors the player's expression with 2x exaggeration
 * - Feels like a performance, not a setup screen
 */

export type CalibrationStep = 'idle' | 'neutral' | 'expression' | 'complete';

export interface CalibrationPrompt {
  expression: ExpressionType;
  prompt: string;
  funPrompt: string; // What the fighter says
  duration: number;  // ms
}

const CALIBRATION_PROMPTS: CalibrationPrompt[] = [
  {
    expression: ExpressionType.SMILE,
    prompt: 'Smile as big as you can!',
    funPrompt: 'Show me your war face! ...actually, start with a smile.',
    duration: 3000,
  },
  {
    expression: ExpressionType.MOUTH_WIDE,
    prompt: 'Open your mouth wide!',
    funPrompt: 'Pretend you just saw the bill at a fancy restaurant.',
    duration: 3000,
  },
  {
    expression: ExpressionType.BOTH_BROWS_UP,
    prompt: 'Raise your eyebrows!',
    funPrompt: 'Look as surprised as possible. Like REALLY surprised.',
    duration: 3000,
  },
  {
    expression: ExpressionType.BROWS_DOWN,
    prompt: 'Frown — angry face!',
    funPrompt: 'Give me your scariest angry glare. Terrify me.',
    duration: 3000,
  },
  {
    expression: ExpressionType.LEFT_WINK,
    prompt: 'Wink with your left eye!',
    funPrompt: 'Give me a cheeky wink. Left eye.',
    duration: 3000,
  },
  {
    expression: ExpressionType.CHEEKS_PUFFED,
    prompt: 'Puff your cheeks!',
    funPrompt: 'Blow up those cheeks like a pufferfish!',
    duration: 3000,
  },
];

const NEUTRAL_DURATION = 2000;
// Select 3 random prompts for variety
const PROMPTS_PER_CALIBRATION = 3;

export class CalibrationEngine {
  private session: CalibrationSession;
  private step: CalibrationStep = 'idle';
  private currentPromptIndex = 0;
  private selectedPrompts: CalibrationPrompt[] = [];
  private frameBuffer: BlendshapeFrame[] = [];
  private stepStartTime = 0;
  private listeners: ((event: CalibrationEvent) => void)[] = [];

  constructor() {
    this.session = this.createEmptySession();
  }

  private createEmptySession(): CalibrationSession {
    const thresholds = {} as CalibrationData['thresholds'];
    for (const type of Object.values(ExpressionType)) {
      thresholds[type] = { activation: 0.3, release: 0.15 };
    }

    return {
      neutralBaseline: {},
      maxValues: {},
      thresholds,
      completed: false,
      timestamp: 0,
      lightingBrightness: 128,
    };
  }

  /**
   * Start the calibration process
   */
  start(): void {
    this.session = this.createEmptySession();
    this.frameBuffer = [];
    this.currentPromptIndex = 0;

    // Select random prompts
    const shuffled = [...CALIBRATION_PROMPTS].sort(() => Math.random() - 0.5);
    this.selectedPrompts = shuffled.slice(0, PROMPTS_PER_CALIBRATION);

    this.step = 'neutral';
    this.stepStartTime = Date.now();

    this.emit({
      type: 'step_start',
      step: 'neutral',
      prompt: 'Relax your face and look at the camera',
      funPrompt: 'Just chill for a sec. Look natural. Be yourself.',
      duration: NEUTRAL_DURATION,
    });
  }

  /**
   * Feed a blendshape frame during calibration
   */
  processFrame(frame: BlendshapeFrame): void {
    if (this.step === 'idle' || this.step === 'complete') return;

    this.frameBuffer.push(frame);
    const elapsed = Date.now() - this.stepStartTime;

    if (this.step === 'neutral') {
      // Emit progress
      this.emit({ type: 'progress', progress: elapsed / NEUTRAL_DURATION });

      if (elapsed >= NEUTRAL_DURATION) {
        this.computeNeutralBaseline();
        this.advanceToNextExpression();
      }
    } else if (this.step === 'expression') {
      const prompt = this.selectedPrompts[this.currentPromptIndex];
      this.emit({ type: 'progress', progress: elapsed / prompt.duration });

      if (elapsed >= prompt.duration) {
        this.computeExpressionMax(prompt.expression);
        this.currentPromptIndex++;

        if (this.currentPromptIndex >= this.selectedPrompts.length) {
          this.finalize();
        } else {
          this.advanceToNextExpression();
        }
      }
    }
  }

  private computeNeutralBaseline(): void {
    const baseline: Record<string, number> = {};

    // Average all frames for neutral position
    for (const name of BLENDSHAPE_NAMES) {
      let sum = 0;
      for (const frame of this.frameBuffer) {
        sum += frame.coefficients[name] || 0;
      }
      baseline[name] = this.frameBuffer.length > 0 ? sum / this.frameBuffer.length : 0;
    }

    this.session.neutralBaseline = baseline;
    this.frameBuffer = [];
  }

  private computeExpressionMax(expression: ExpressionType): void {
    // Find the max mapped value for this expression across collected frames
    let maxVal = 0;
    for (const frame of this.frameBuffer) {
      const mapped = mapBlendshapes(frame.coefficients);
      const val = mapped[expression] || 0;
      if (val > maxVal) maxVal = val;
    }

    this.session.maxValues[expression] = maxVal;
    this.frameBuffer = [];
  }

  private advanceToNextExpression(): void {
    this.step = 'expression';
    this.stepStartTime = Date.now();
    this.frameBuffer = [];

    const prompt = this.selectedPrompts[this.currentPromptIndex];

    this.emit({
      type: 'step_start',
      step: 'expression',
      prompt: prompt.prompt,
      funPrompt: prompt.funPrompt,
      expression: prompt.expression,
      duration: prompt.duration,
      promptIndex: this.currentPromptIndex,
      totalPrompts: this.selectedPrompts.length,
    });
  }

  private finalize(): void {
    // Compute personalized thresholds from max observed values
    const thresholds = {} as CalibrationData['thresholds'];

    for (const type of Object.values(ExpressionType)) {
      const maxVal = this.session.maxValues[type];
      if (maxVal && maxVal > 0.1) {
        // Activation = 40% of max observed, Release = 20% of max
        thresholds[type] = {
          activation: maxVal * 0.4,
          release: maxVal * 0.2,
        };
      } else {
        // Use defaults for unobserved expressions
        thresholds[type] = { activation: 0.3, release: 0.15 };
      }
    }

    this.session.thresholds = thresholds;
    this.session.completed = true;
    this.session.timestamp = Date.now();
    this.step = 'complete';

    this.emit({
      type: 'complete',
      session: this.session,
    });
  }

  /**
   * Get the calibration result
   */
  getCalibrationData(): CalibrationData | null {
    if (!this.session.completed) return null;

    return {
      thresholds: this.session.thresholds,
      trackingQuality: 1.0,
      timestamp: this.session.timestamp,
    };
  }

  /**
   * Get the full session (for saving)
   */
  getSession(): CalibrationSession {
    return { ...this.session };
  }

  /**
   * Load a previous session
   */
  loadSession(session: CalibrationSession): void {
    this.session = session;
    this.step = session.completed ? 'complete' : 'idle';
  }

  /**
   * Get current step
   */
  getStep(): CalibrationStep {
    return this.step;
  }

  /**
   * Subscribe to calibration events
   */
  onEvent(callback: (event: CalibrationEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emit(event: CalibrationEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Reset
   */
  reset(): void {
    this.session = this.createEmptySession();
    this.step = 'idle';
    this.frameBuffer = [];
    this.currentPromptIndex = 0;
  }
}

export type CalibrationEvent =
  | { type: 'step_start'; step: string; prompt: string; funPrompt: string; duration: number; expression?: ExpressionType; promptIndex?: number; totalPrompts?: number }
  | { type: 'progress'; progress: number }
  | { type: 'complete'; session: CalibrationSession };
