import { ExpressionType, BlendshapeMapping } from '../core/types';
import { WINK_CLOSED_THRESHOLD, WINK_OPEN_THRESHOLD } from '../core/constants';

/**
 * Maps 52 MediaPipe FaceLandmarker blendshape coefficients to 24 ExpressionTypes.
 *
 * Blendshape names follow the ARKit naming convention used by MediaPipe:
 * https://developers.google.com/mediapipe/solutions/vision/face_landmarker
 */

// All 52 blendshape names from MediaPipe FaceLandmarker
export const BLENDSHAPE_NAMES = [
  '_neutral', 'browDownLeft', 'browDownRight', 'browInnerUp', 'browOuterUpLeft',
  'browOuterUpRight', 'cheekPuff', 'cheekSquintLeft', 'cheekSquintRight',
  'eyeBlinkLeft', 'eyeBlinkRight', 'eyeLookDownLeft', 'eyeLookDownRight',
  'eyeLookInLeft', 'eyeLookInRight', 'eyeLookOutLeft', 'eyeLookOutRight',
  'eyeLookUpLeft', 'eyeLookUpRight', 'eyeSquintLeft', 'eyeSquintRight',
  'eyeWideLeft', 'eyeWideRight', 'jawForward', 'jawLeft', 'jawOpen',
  'jawRight', 'mouthClose', 'mouthDimpleLeft', 'mouthDimpleRight',
  'mouthFrownLeft', 'mouthFrownRight', 'mouthFunnel', 'mouthLeft',
  'mouthLowerDownLeft', 'mouthLowerDownRight', 'mouthPressLeft',
  'mouthPressRight', 'mouthPucker', 'mouthRight', 'mouthRollLower',
  'mouthRollUpper', 'mouthShrugLower', 'mouthShrugUpper', 'mouthSmileLeft',
  'mouthSmileRight', 'mouthStretchLeft', 'mouthStretchRight', 'mouthUpperUpLeft',
  'mouthUpperUpRight', 'noseSneerLeft', 'noseSneerRight', 'tongueOut',
] as const;

/**
 * Mapping definitions: blendshape coefficients → ExpressionType values.
 * Each mapping includes a compute function that returns 0-1.
 */
export const BLENDSHAPE_MAPPINGS: BlendshapeMapping[] = [
  {
    expression: ExpressionType.LEFT_BROW_UP,
    primary: ['browOuterUpLeft', 'browInnerUp'],
    compute: (c) => Math.max(c.browOuterUpLeft || 0, (c.browInnerUp || 0) * 0.7),
    holdTime: 300,
  },
  {
    expression: ExpressionType.RIGHT_BROW_UP,
    primary: ['browOuterUpRight', 'browInnerUp'],
    compute: (c) => Math.max(c.browOuterUpRight || 0, (c.browInnerUp || 0) * 0.7),
    holdTime: 300,
  },
  {
    expression: ExpressionType.BROWS_DOWN,
    primary: ['browDownLeft', 'browDownRight'],
    compute: (c) => ((c.browDownLeft || 0) + (c.browDownRight || 0)) / 2,
    holdTime: 400,
  },
  {
    expression: ExpressionType.BOTH_BROWS_UP,
    primary: ['browOuterUpLeft', 'browOuterUpRight', 'browInnerUp'],
    compute: (c) => {
      const left = c.browOuterUpLeft || 0;
      const right = c.browOuterUpRight || 0;
      const inner = c.browInnerUp || 0;
      // Both must be raised — use minimum of the two sides
      return Math.min(left, right) * 0.5 + inner * 0.5;
    },
    holdTime: 350,
  },
  {
    expression: ExpressionType.LEFT_WINK,
    primary: ['eyeBlinkLeft', 'eyeBlinkRight'],
    compute: (c) => {
      const blinkL = c.eyeBlinkLeft || 0;
      const blinkR = c.eyeBlinkRight || 0;
      // Left eye closed AND right eye open = left wink
      if (blinkL > WINK_CLOSED_THRESHOLD && blinkR < WINK_OPEN_THRESHOLD) {
        return blinkL;
      }
      return 0;
    },
    holdTime: 400,
  },
  {
    expression: ExpressionType.RIGHT_WINK,
    primary: ['eyeBlinkLeft', 'eyeBlinkRight'],
    compute: (c) => {
      const blinkL = c.eyeBlinkLeft || 0;
      const blinkR = c.eyeBlinkRight || 0;
      // Right eye closed AND left eye open = right wink
      if (blinkR > WINK_CLOSED_THRESHOLD && blinkL < WINK_OPEN_THRESHOLD) {
        return blinkR;
      }
      return 0;
    },
    holdTime: 400,
  },
  {
    expression: ExpressionType.EYES_WIDE,
    primary: ['eyeWideLeft', 'eyeWideRight'],
    compute: (c) => ((c.eyeWideLeft || 0) + (c.eyeWideRight || 0)) / 2,
    holdTime: 500,
  },
  {
    expression: ExpressionType.SQUINT,
    primary: ['eyeSquintLeft', 'eyeSquintRight'],
    compute: (c) => ((c.eyeSquintLeft || 0) + (c.eyeSquintRight || 0)) / 2,
    holdTime: 500,
  },
  {
    expression: ExpressionType.SMILE,
    primary: ['mouthSmileLeft', 'mouthSmileRight'],
    compute: (c) => ((c.mouthSmileLeft || 0) + (c.mouthSmileRight || 0)) / 2,
    holdTime: 350,
  },
  {
    expression: ExpressionType.LIPS_PURSE,
    primary: ['mouthPucker', 'mouthFunnel'],
    compute: (c) => Math.max(c.mouthPucker || 0, c.mouthFunnel || 0),
    holdTime: 400,
  },
  {
    expression: ExpressionType.MOUTH_OPEN,
    primary: ['jawOpen'],
    compute: (c) => {
      const jawOpen = c.jawOpen || 0;
      // Moderate mouth open (not wide)
      return jawOpen > 0.15 && jawOpen < 0.6 ? jawOpen : 0;
    },
    holdTime: 300,
  },
  {
    expression: ExpressionType.MOUTH_WIDE,
    primary: ['jawOpen'],
    compute: (c) => {
      const jawOpen = c.jawOpen || 0;
      // Wide open mouth
      return jawOpen >= 0.6 ? jawOpen : 0;
    },
    holdTime: 500,
  },
  {
    expression: ExpressionType.JAW_CLENCH,
    primary: ['mouthClose', 'jawForward'],
    compute: (c) => {
      // Jaw clenched = mouth closed tight + slight jaw forward
      const close = c.mouthClose || 0;
      const forward = c.jawForward || 0;
      return close * 0.7 + forward * 0.3;
    },
    holdTime: 450,
  },
  {
    expression: ExpressionType.HEAD_YAW_LEFT,
    primary: ['jawLeft'],
    compute: (c) => c.jawLeft || 0,
    holdTime: 300,
  },
  {
    expression: ExpressionType.HEAD_YAW_RIGHT,
    primary: ['jawRight'],
    compute: (c) => c.jawRight || 0,
    holdTime: 300,
  },
  {
    expression: ExpressionType.LIPS_PRESS,
    primary: ['mouthPressLeft', 'mouthPressRight'],
    compute: (c) => ((c.mouthPressLeft || 0) + (c.mouthPressRight || 0)) / 2,
    holdTime: 300,
  },
  {
    expression: ExpressionType.CHIN_TUCK,
    primary: ['mouthRollLower', 'mouthShrugLower'],
    compute: (c) => {
      const roll = c.mouthRollLower || 0;
      const shrug = c.mouthShrugLower || 0;
      return Math.max(roll, shrug);
    },
    holdTime: 300,
  },
  {
    expression: ExpressionType.TONGUE_OUT,
    primary: ['tongueOut'],
    compute: (c) => c.tongueOut || 0,
    holdTime: 500,
  },
  {
    expression: ExpressionType.HEAD_TILT_UP,
    primary: ['eyeLookUpLeft', 'eyeLookUpRight'],
    compute: (c) => ((c.eyeLookUpLeft || 0) + (c.eyeLookUpRight || 0)) / 2,
    holdTime: 600,
  },
  {
    expression: ExpressionType.HEAD_TILT_DOWN,
    primary: ['eyeLookDownLeft', 'eyeLookDownRight'],
    compute: (c) => ((c.eyeLookDownLeft || 0) + (c.eyeLookDownRight || 0)) / 2,
    holdTime: 500,
  },
  {
    expression: ExpressionType.HEAD_NOD,
    primary: ['eyeLookDownLeft', 'eyeLookDownRight', 'jawForward'],
    compute: (c) => {
      const lookDown = ((c.eyeLookDownLeft || 0) + (c.eyeLookDownRight || 0)) / 2;
      const jawFwd = c.jawForward || 0;
      return lookDown * 0.6 + jawFwd * 0.4;
    },
    holdTime: 400,
  },
  {
    expression: ExpressionType.CHEEKS_PUFFED,
    primary: ['cheekPuff'],
    compute: (c) => c.cheekPuff || 0,
    holdTime: 450,
  },
  {
    expression: ExpressionType.NOSE_WRINKLE,
    primary: ['noseSneerLeft', 'noseSneerRight'],
    compute: (c) => ((c.noseSneerLeft || 0) + (c.noseSneerRight || 0)) / 2,
    holdTime: 400,
  },
  {
    expression: ExpressionType.KISSY_FACE,
    primary: ['mouthPucker', 'mouthFunnel', 'mouthSmileLeft', 'mouthSmileRight'],
    compute: (c) => {
      const pucker = c.mouthPucker || 0;
      const funnel = c.mouthFunnel || 0;
      // Kissy = pucker high but NOT smiling
      const smile = ((c.mouthSmileLeft || 0) + (c.mouthSmileRight || 0)) / 2;
      if (smile > 0.3) return 0; // Smiling, not kissy
      return Math.max(pucker, funnel);
    },
    holdTime: 600,
  },
];

// Pre-built lookup by ExpressionType for fast access
const MAPPING_BY_TYPE: Map<ExpressionType, BlendshapeMapping> = new Map();
for (const mapping of BLENDSHAPE_MAPPINGS) {
  MAPPING_BY_TYPE.set(mapping.expression, mapping);
}

/**
 * Convert raw blendshape coefficients to ExpressionType values.
 * @param coefficients Raw 52-value blendshape record from FaceLandmarker
 * @returns Mapped values per ExpressionType (0-1)
 */
export function mapBlendshapes(
  coefficients: Record<string, number>
): Record<ExpressionType, number> {
  const result = {} as Record<ExpressionType, number>;

  for (const mapping of BLENDSHAPE_MAPPINGS) {
    result[mapping.expression] = mapping.compute(coefficients);
  }

  return result;
}

/**
 * Get hold time for an expression type
 */
export function getHoldTime(expression: ExpressionType): number {
  return MAPPING_BY_TYPE.get(expression)?.holdTime ?? 400;
}

/**
 * Get blendshape coefficient vector for cosine similarity (Copy This Face)
 */
export function getBlendshapeVector(coefficients: Record<string, number>): number[] {
  return BLENDSHAPE_NAMES.map(name => coefficients[name] || 0);
}
