import { BlendshapeFrame } from '../core/types';
import {
  CAMERA_WIDTH,
  CAMERA_HEIGHT,
  NSFW_CHECK_INTERVAL,
  NSFW_CANVAS_SIZE,
  LIGHTING_MIN_BRIGHTNESS,
} from '../core/constants';
import { calculateBrightness } from '../utils/math';

type FaceLandmarkerResult = {
  faceBlendshapes?: Array<{
    categories: Array<{
      categoryName: string;
      score: number;
    }>;
  }>;
};

/**
 * FaceLandmarker: MediaPipe Tasks Vision face tracking with blendshapes.
 *
 * Replaces legacy FaceMesh v0.4 with @mediapipe/tasks-vision FaceLandmarker
 * which provides 52 named blendshape coefficients (ARKit-compatible).
 *
 * Features:
 * - GPU delegate with CPU fallback
 * - NSFW content filter (nsfwjs every 2s)
 * - Ambient lighting brightness check
 * - FPS monitoring
 */
export class FaceLandmarker {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private landmarker: any = null; // FaceLandmarker instance
  private nsfwModel: any = null;
  private nsfwCanvas: HTMLCanvasElement | null = null;
  private nsfwCtx: CanvasRenderingContext2D | null = null;

  private isRunning = false;
  private animFrameId: number | null = null;
  private lastNsfwCheck = 0;
  private lastFrameTime = 0;
  private fps = 0;
  private frameCount = 0;
  private fpsUpdateTime = 0;

  private useGpu = true;
  private lightingOk = true;
  private nsfwDetected = false;

  private listeners: ((frame: BlendshapeFrame) => void)[] = [];
  private statusListeners: ((status: FaceStatus) => void)[] = [];

  async initialize(): Promise<void> {
    // Check browser support
    if (typeof navigator === 'undefined') {
      throw new Error('Browser environment required for face tracking');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera not supported in this browser. Try Chrome, Safari, or Firefox on a device with a camera.');
    }

    // Initialize camera
    await this.initCamera();

    // Initialize FaceLandmarker
    await this.initLandmarker();

    // Initialize NSFW filter (non-blocking — game works without it)
    this.initNsfwFilter().catch(() => {});

    this.emitStatus({ type: 'ready', message: 'Face tracking ready' });
  }

  private async initCamera(): Promise<void> {
    this.video = document.createElement('video');
    this.video.setAttribute('playsinline', '');
    this.video.setAttribute('autoplay', '');
    this.video.muted = true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: CAMERA_WIDTH },
          height: { ideal: CAMERA_HEIGHT },
        },
        audio: false,
      });

      this.video.srcObject = this.stream;
      await this.video.play();
      this.emitStatus({ type: 'camera_ready', message: 'Camera initialized' });
    } catch (error: any) {
      const message = error?.name === 'NotAllowedError'
        ? 'Camera access denied. Please allow camera access in your browser settings.'
        : error?.name === 'NotFoundError'
        ? 'No camera found. Please connect a camera and try again.'
        : error?.name === 'NotReadableError'
        ? 'Camera is in use by another app. Close other apps using the camera.'
        : 'Camera access failed. Please check your camera permissions.';
      this.emitStatus({ type: 'camera_error', message });
      throw new Error(message);
    }
  }

  private async initLandmarker(): Promise<void> {
    try {
      // Dynamic import — @mediapipe/tasks-vision is loaded at runtime
      const vision = await import('@mediapipe/tasks-vision');
      const { FaceLandmarker: FLClass, FilesetResolver } = vision;

      const filesetResolver = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      try {
        // Try GPU delegate first
        this.landmarker = await FLClass.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        this.useGpu = true;
        this.emitStatus({ type: 'landmarker_ready', message: 'FaceLandmarker ready (GPU)' });
      } catch {
        // CPU fallback
        this.landmarker = await FLClass.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });
        this.useGpu = false;
        this.emitStatus({ type: 'landmarker_ready', message: 'FaceLandmarker ready (CPU fallback)' });
      }
    } catch (error) {
      this.emitStatus({ type: 'landmarker_error', message: 'FaceLandmarker failed to load' });
      throw error;
    }
  }

  private async initNsfwFilter(): Promise<void> {
    try {
      const nsfwjs = await import('nsfwjs');
      this.nsfwModel = await nsfwjs.load();

      // Create offscreen canvas for NSFW checks
      this.nsfwCanvas = document.createElement('canvas');
      this.nsfwCanvas.width = NSFW_CANVAS_SIZE;
      this.nsfwCanvas.height = NSFW_CANVAS_SIZE;
      this.nsfwCtx = this.nsfwCanvas.getContext('2d');
    } catch {
      console.warn('[FaceLandmarker] NSFW filter failed to load, continuing without it');
    }
  }

  /**
   * Start face tracking loop
   */
  start(): void {
    if (this.isRunning || !this.landmarker || !this.video) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = performance.now();
    this.frameCount = 0;
    this.loop();
  }

  private loop = (): void => {
    if (!this.isRunning || !this.video || !this.landmarker) return;

    const now = performance.now();

    // Track FPS
    this.frameCount++;
    if (now - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = now;
    }

    // Run face detection
    try {
      const result: FaceLandmarkerResult = this.landmarker.detectForVideo(
        this.video,
        now
      );

      if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
        const blendshapes = result.faceBlendshapes[0];
        const coefficients: Record<string, number> = {};

        for (const category of blendshapes.categories) {
          coefficients[category.categoryName] = category.score;
        }

        // Emit blendshape frame
        const frame: BlendshapeFrame = {
          coefficients,
          timestamp: Date.now(),
          confidence: 1.0, // FaceLandmarker doesn't expose per-frame confidence directly
        };

        this.notifyListeners(frame);
      }
    } catch (error) {
      // Silently handle detection errors (e.g. face not visible)
    }

    // Periodic NSFW check
    if (now - this.lastNsfwCheck >= NSFW_CHECK_INTERVAL) {
      this.checkNsfw();
      this.checkLighting();
      this.lastNsfwCheck = now;
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private async checkNsfw(): Promise<void> {
    if (!this.nsfwModel || !this.nsfwCtx || !this.nsfwCanvas || !this.video) return;

    try {
      this.nsfwCtx.drawImage(
        this.video,
        0, 0,
        NSFW_CANVAS_SIZE,
        NSFW_CANVAS_SIZE
      );

      const predictions = await this.nsfwModel.classify(this.nsfwCanvas);

      const nsfw = predictions.some(
        (p: { className: string; probability: number }) =>
          (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.7
      );

      if (nsfw && !this.nsfwDetected) {
        this.nsfwDetected = true;
        this.emitStatus({ type: 'nsfw_detected', message: 'Inappropriate content detected' });
      } else if (!nsfw && this.nsfwDetected) {
        this.nsfwDetected = false;
        this.emitStatus({ type: 'nsfw_cleared', message: 'Content check passed' });
      }
    } catch {
      // Silently handle NSFW check errors
    }
  }

  private checkLighting(): void {
    if (!this.nsfwCtx || !this.nsfwCanvas) return;

    try {
      const imageData = this.nsfwCtx.getImageData(0, 0, NSFW_CANVAS_SIZE, NSFW_CANVAS_SIZE);
      const brightness = calculateBrightness(imageData);

      const wasOk = this.lightingOk;
      this.lightingOk = brightness >= LIGHTING_MIN_BRIGHTNESS;

      if (!this.lightingOk && wasOk) {
        this.emitStatus({
          type: 'lighting_low',
          message: 'Low lighting detected — face tracking may be unreliable',
        });
      } else if (this.lightingOk && !wasOk) {
        this.emitStatus({ type: 'lighting_ok', message: 'Lighting is good' });
      }
    } catch {
      // Silently handle
    }
  }

  /**
   * Stop face tracking
   */
  stop(): void {
    this.isRunning = false;

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  /**
   * Destroy and release resources
   */
  destroy(): void {
    this.stop();

    if (this.stream) {
      for (const track of this.stream.getTracks()) {
        track.stop();
      }
      this.stream = null;
    }

    if (this.landmarker) {
      this.landmarker.close();
      this.landmarker = null;
    }

    this.video = null;
    this.nsfwCanvas = null;
    this.nsfwCtx = null;
    this.nsfwModel = null;
    this.listeners = [];
    this.statusListeners = [];
  }

  /**
   * Subscribe to blendshape frames
   */
  onFrame(callback: (frame: BlendshapeFrame) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Subscribe to status updates
   */
  onStatus(callback: (status: FaceStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(frame: BlendshapeFrame): void {
    for (const listener of this.listeners) {
      listener(frame);
    }
  }

  private emitStatus(status: FaceStatus): void {
    console.log(`[FaceLandmarker] ${status.type}: ${status.message}`);
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  /**
   * Get the video element (for face overlay display)
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }

  /**
   * Get the camera stream (for recording)
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get current FPS
   */
  getFps(): number {
    return this.fps;
  }

  /**
   * Is GPU acceleration active?
   */
  isGpuAccelerated(): boolean {
    return this.useGpu;
  }

  /**
   * Is NSFW content currently detected?
   */
  isNsfwDetected(): boolean {
    return this.nsfwDetected;
  }

  /**
   * Is lighting adequate?
   */
  isLightingOk(): boolean {
    return this.lightingOk;
  }
}

export interface FaceStatus {
  type: string;
  message: string;
}
