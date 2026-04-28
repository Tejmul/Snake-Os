/**
 * GestureDetector — MediaPipe Hands lifecycle + camera management.
 *
 * Loads the MediaPipe Hands model from CDN, acquires a webcam stream,
 * and emits raw landmark data on every processed frame.
 */

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4';

export class GestureDetector {
  constructor(options = {}) {
    this._active = false;
    this._destroyed = false;
    this._video = null;
    this._hands = null;
    this._animFrame = null;
    this._stream = null;
    this._resultCb = null;
    this._errorCb = null;

    // Tuned for reliability — higher than defaults
    this._minDetection = options.minDetectionConfidence ?? 0.7;
    this._minTracking = options.minTrackingConfidence ?? 0.6;
    this._cameraWidth = options.cameraWidth ?? 320;
    this._cameraHeight = options.cameraHeight ?? 240;
    this._frameRate = options.frameRate ?? 30;
  }

  /**
   * Register a callback for landmark results.
   * Callback receives: { landmarks: NormalizedLandmark[], confidence: number }
   */
  onResults(cb) {
    this._resultCb = cb;
  }

  /**
   * Register a callback for errors (camera denied, model load failure, etc.)
   */
  onError(cb) {
    this._errorCb = cb;
  }

  /**
   * Load MediaPipe from CDN if not already available.
   */
  async _loadMediaPipe() {
    if (typeof window === 'undefined') return;
    if (window.Hands) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${MEDIAPIPE_CDN}/hands.min.js`;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Failed to load MediaPipe Hands'));
      document.head.appendChild(script);
    });
  }

  /**
   * Acquire webcam stream.
   */
  async _acquireCamera() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: this._cameraWidth,
          height: this._cameraHeight,
          frameRate: this._frameRate,
        },
      });

      this._video = document.createElement('video');
      this._video.setAttribute('playsinline', '');
      this._video.muted = true;
      this._video.srcObject = this._stream;
      await this._video.play();
    } catch (err) {
      const errorType =
        err.name === 'NotAllowedError' ? 'CAMERA_DENIED' :
        err.name === 'NotFoundError' ? 'NO_CAMERA' :
        'CAMERA_ERROR';
      throw new Error(errorType);
    }
  }

  /**
   * Initialize MediaPipe Hands instance.
   */
  _initHands() {
    this._hands = new window.Hands({
      locateFile: (file) => `${MEDIAPIPE_CDN}/${file}`,
    });

    this._hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: this._minDetection,
      minTrackingConfidence: this._minTracking,
    });

    this._hands.onResults((results) => {
      if (!this._resultCb) return;
      if (!results.multiHandLandmarks?.length) return;

      const landmarks = results.multiHandLandmarks[0];
      const confidence = results.multiHandedness?.[0]?.score ?? 0;

      this._resultCb({ landmarks, confidence });
    });
  }

  /**
   * Detection loop — sends video frames to MediaPipe via requestAnimationFrame.
   */
  _detectLoop() {
    if (this._destroyed || !this._active) return;

    const detect = async () => {
      if (this._destroyed || !this._active) return;
      try {
        await this._hands.send({ image: this._video });
      } catch {
        // Silently skip dropped frames
      }
      this._animFrame = requestAnimationFrame(detect);
    };
    detect();
  }

  /**
   * Start the detector. Loads model, acquires camera, begins detection loop.
   */
  async start() {
    if (this._active || this._destroyed) return;

    try {
      await this._loadMediaPipe();
      await this._acquireCamera();

      if (this._destroyed) {
        this._releaseCamera();
        return;
      }

      this._initHands();
      this._active = true;
      this._detectLoop();
    } catch (err) {
      if (this._errorCb) {
        this._errorCb(err.message);
      }
    }
  }

  /**
   * Release camera tracks.
   */
  _releaseCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
    if (this._video) {
      this._video.srcObject = null;
      this._video = null;
    }
  }

  /**
   * Stop detection but keep resources alive for quick restart.
   */
  stop() {
    this._active = false;
    if (this._animFrame) {
      cancelAnimationFrame(this._animFrame);
      this._animFrame = null;
    }
  }

  /**
   * Full cleanup — release camera, nullify references.
   * Cannot be restarted after destroy.
   */
  destroy() {
    this._destroyed = true;
    this.stop();
    this._releaseCamera();
    this._hands = null;
    this._resultCb = null;
    this._errorCb = null;
  }

  /**
   * Check whether detector is currently processing frames.
   */
  get active() {
    return this._active;
  }
}
