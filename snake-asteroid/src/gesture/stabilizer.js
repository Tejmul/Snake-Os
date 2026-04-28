/**
 * GestureStabilizer — debounce, frame voting, and confidence filtering.
 *
 * Thumb gestures are noisier than index finger, so this uses:
 *   - 7-frame sliding window with 4/7 agreement
 *   - 250ms debounce between direction changes
 *   - Consecutive-frame boost (must see same gesture 2x in a row before voting)
 *   - 400ms fist hold for pause toggle
 *   - 200ms gesture lock after direction is sent
 */

const WINDOW_SIZE = 7;
const AGREEMENT_THRESHOLD = 4;
const DEBOUNCE_MS = 250;
const FIST_HOLD_MS = 400;
const GESTURE_LOCK_MS = 200;
const MIN_CONFIDENCE = 0.7;

export class GestureStabilizer {
  constructor(options = {}) {
    this._windowSize = options.windowSize ?? WINDOW_SIZE;
    this._agreementThreshold = options.agreementThreshold ?? AGREEMENT_THRESHOLD;
    this._debounceMs = options.debounceMs ?? DEBOUNCE_MS;
    this._fistHoldMs = options.fistHoldMs ?? FIST_HOLD_MS;
    this._gestureLockMs = options.gestureLockMs ?? GESTURE_LOCK_MS;
    this._minConfidence = options.minConfidence ?? MIN_CONFIDENCE;

    this._window = [];
    this._lastDirection = null;
    this._lastDirectionTime = 0;
    this._lastGesture = null;
    this._consecutiveCount = 0;
    this._lastConsecutive = null;

    // Fist tracking
    this._fistStart = 0;
    this._fistTriggered = false;
    this._fistReleased = true;

    // Gesture lock
    this._locked = false;
    this._lockTimer = null;
  }

  /**
   * Push a new frame result and get stabilized output.
   *
   * @param {{ gesture: string, direction: string|null }} mapped
   *   Output from mapLandmarksToGesture.
   * @param {number} confidence
   *   MediaPipe hand confidence score (0–1).
   * @returns {{ direction: string|null, gesture: string, fistAction: string|null }}
   *   direction: stable direction or null
   *   gesture: current raw gesture name
   *   fistAction: 'PAUSE' when fist is held long enough, null otherwise
   */
  push(mapped, confidence = 1) {
    if (!mapped) {
      return { direction: null, gesture: 'NONE', fistAction: null };
    }

    const { gesture, direction } = mapped;
    const now = Date.now();

    // Drop low-confidence frames
    if (confidence < this._minConfidence) {
      return { direction: null, gesture, fistAction: null };
    }

    // --- Fist handling (independent of direction pipeline) ---
    let fistAction = null;
    if (gesture === 'FIST') {
      if (this._fistStart === 0) {
        this._fistStart = now;
      }

      // Fist held long enough and not already triggered
      if (
        now - this._fistStart >= this._fistHoldMs &&
        !this._fistTriggered &&
        this._fistReleased
      ) {
        this._fistTriggered = true;
        this._fistReleased = false;
        fistAction = 'PAUSE';
      }
    } else {
      // Hand opened — reset fist state
      if (this._fistStart !== 0) {
        this._fistReleased = true;
      }
      this._fistStart = 0;
      this._fistTriggered = false;
    }

    // Non-direction gestures don't enter voting pipeline
    if (!direction) {
      return { direction: null, gesture, fistAction };
    }

    // --- Consecutive-frame boost ---
    // Direction must appear in 2 consecutive frames before entering the window
    if (direction !== this._lastConsecutive) {
      this._consecutiveCount = 1;
      this._lastConsecutive = direction;
      return { direction: null, gesture, fistAction };
    }

    this._consecutiveCount++;
    if (this._consecutiveCount < 2) {
      return { direction: null, gesture, fistAction };
    }

    // --- Sliding window voting ---
    this._window.push(direction);
    if (this._window.length > this._windowSize) {
      this._window.shift();
    }

    // Count votes
    const votes = {};
    for (const d of this._window) {
      votes[d] = (votes[d] || 0) + 1;
    }

    // Find winner
    let winner = null;
    let maxVotes = 0;
    for (const [dir, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = dir;
      }
    }

    // Not enough agreement
    if (maxVotes < this._agreementThreshold) {
      return { direction: null, gesture, fistAction };
    }

    // --- Debounce ---
    if (now - this._lastDirectionTime < this._debounceMs) {
      return { direction: null, gesture, fistAction };
    }

    // --- Gesture lock ---
    if (this._locked) {
      return { direction: null, gesture, fistAction };
    }

    // Same direction as last — no need to re-send
    if (winner === this._lastDirection) {
      return { direction: null, gesture, fistAction };
    }

    // Fire direction!
    this._lastDirection = winner;
    this._lastDirectionTime = now;

    // Lock briefly to prevent flooding
    this._locked = true;
    if (this._lockTimer) clearTimeout(this._lockTimer);
    this._lockTimer = setTimeout(() => {
      this._locked = false;
    }, this._gestureLockMs);

    return { direction: winner, gesture, fistAction };
  }

  /**
   * Reset all state. Call when gesture mode is toggled off.
   */
  reset() {
    this._window = [];
    this._lastDirection = null;
    this._lastDirectionTime = 0;
    this._lastGesture = null;
    this._consecutiveCount = 0;
    this._lastConsecutive = null;
    this._fistStart = 0;
    this._fistTriggered = false;
    this._fistReleased = true;
    this._locked = false;
    if (this._lockTimer) {
      clearTimeout(this._lockTimer);
      this._lockTimer = null;
    }
  }
}
