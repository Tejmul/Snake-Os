/**
 * GestureEngine — orchestrates detector → mapper → stabilizer pipeline.
 *
 * Usage:
 *   const engine = new GestureEngine();
 *   engine.onDirection((dir) => sendToGame(dir));
 *   engine.onGesture((gesture) => updateHUD(gesture));
 *   engine.onError((err) => showError(err));
 *   await engine.start();
 *   // ...later
 *   engine.destroy();
 */

import { GestureDetector } from './detector';
import { mapLandmarksToGesture } from './mapper';
import { GestureStabilizer } from './stabilizer';

export { GestureDetector } from './detector';
export { mapLandmarksToGesture } from './mapper';
export { GestureStabilizer } from './stabilizer';

export class GestureEngine {
  constructor(options = {}) {
    this._detector = new GestureDetector(options.detector);
    this._stabilizer = new GestureStabilizer(options.stabilizer);

    this._directionCb = null;
    this._gestureCb = null;
    this._errorCb = null;
    this._fistCb = null;

    this._active = false;
    this._lastGesture = null;
    this._lastDirection = null;
    this._frameCount = 0;
    this._startTime = 0;
    this._debug = options.debug ?? false;

    // Wire detector results through mapper → stabilizer
    this._detector.onResults(({ landmarks, confidence }) => {
      this._frameCount++;

      const mapped = mapLandmarksToGesture(landmarks);
      const stabilized = this._stabilizer.push(mapped, confidence);

      // Update tracked state
      this._lastGesture = mapped.gesture;

      // Notify gesture callback (every frame, for HUD display)
      if (this._gestureCb) {
        this._gestureCb({
          rawGesture: mapped.gesture,
          rawDirection: mapped.direction,
          stableDirection: stabilized.direction,
          confidence,
        });
      }

      // Notify direction callback (only when stable direction changes)
      if (stabilized.direction && this._directionCb) {
        this._lastDirection = stabilized.direction;
        this._directionCb(stabilized.direction);

        if (this._debug) {
          console.log(`🖐️ Gesture → ${stabilized.direction} (confidence: ${confidence.toFixed(2)})`);
        }
      }

      // Notify fist callback (pause/resume)
      if (stabilized.fistAction && this._fistCb) {
        this._fistCb(stabilized.fistAction);

        if (this._debug) {
          console.log(`✊ Fist action → ${stabilized.fistAction}`);
        }
      }
    });

    this._detector.onError((err) => {
      if (this._errorCb) this._errorCb(err);
      if (this._debug) console.error(`🚫 Gesture error: ${err}`);
    });
  }

  /**
   * Register callback for stable direction changes.
   * @param {(direction: string) => void} cb
   */
  onDirection(cb) {
    this._directionCb = cb;
  }

  /**
   * Register callback for every frame gesture update (for HUD).
   * @param {(data: { rawGesture, rawDirection, stableDirection, confidence }) => void} cb
   */
  onGesture(cb) {
    this._gestureCb = cb;
  }

  /**
   * Register callback for fist actions (PAUSE).
   * @param {(action: string) => void} cb
   */
  onFist(cb) {
    this._fistCb = cb;
  }

  /**
   * Register callback for errors.
   * @param {(error: string) => void} cb
   */
  onError(cb) {
    this._errorCb = cb;
  }

  /**
   * Start the engine.
   */
  async start() {
    if (this._active) return;
    this._active = true;
    this._startTime = Date.now();
    this._frameCount = 0;
    await this._detector.start();
  }

  /**
   * Stop processing but keep resources alive.
   */
  stop() {
    this._active = false;
    this._detector.stop();
    this._stabilizer.reset();
  }

  /**
   * Full cleanup — cannot restart after this.
   */
  destroy() {
    this._active = false;
    this._detector.destroy();
    this._stabilizer.reset();
    this._directionCb = null;
    this._gestureCb = null;
    this._errorCb = null;
    this._fistCb = null;
  }

  /**
   * Get current engine status for debugging/HUD.
   */
  getStatus() {
    const elapsed = (Date.now() - this._startTime) / 1000;
    return {
      active: this._active,
      cameraReady: this._detector.active,
      lastGesture: this._lastGesture,
      lastDirection: this._lastDirection,
      fps: elapsed > 0 ? Math.round(this._frameCount / elapsed) : 0,
    };
  }
}
