/**
 * GestureMapper — converts raw hand landmarks into game directions.
 *
 * Uses thumb tip (landmark 4) relative to wrist (landmark 0) for
 * directional input. Requires other four fingers to be curled.
 *
 * Landmark reference:
 *   0  = wrist
 *   4  = thumb tip
 *   8  = index tip,  5  = index MCP
 *   12 = middle tip,  9 = middle MCP
 *   16 = ring tip,   13 = ring MCP
 *   20 = pinky tip,  17 = pinky MCP
 */

// Minimum thumb-to-wrist vector magnitude for direction detection.
// Higher than index finger (0.12) because thumb is shorter and noisier.
const MIN_VECTOR = 0.15;

// Dead zone — ignore tiny movements that are just hand noise.
const DEAD_ZONE = 0.1;

// Fingertip and MCP landmark indices (excluding thumb).
const FINGER_TIPS = [8, 12, 16, 20];
const FINGER_MCPS = [5, 9, 13, 17];

// Thumb landmarks for curl detection.
const THUMB_TIP = 4;
const THUMB_MCP = 2;

/**
 * Check if a finger is curled (tip below its MCP joint).
 * In MediaPipe normalized coords, y increases downward.
 */
function isFingerCurled(landmarks, tipIdx, mcpIdx) {
  return landmarks[tipIdx].y > landmarks[mcpIdx].y;
}

/**
 * Check if a finger is extended (tip above its MCP joint).
 */
function isFingerExtended(landmarks, tipIdx, mcpIdx) {
  return landmarks[tipIdx].y < landmarks[mcpIdx].y;
}

/**
 * Check if all four non-thumb fingers are curled.
 */
function areOtherFingersCurled(landmarks) {
  for (let i = 0; i < FINGER_TIPS.length; i++) {
    if (!isFingerCurled(landmarks, FINGER_TIPS[i], FINGER_MCPS[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Check if all five fingers are extended (open palm).
 */
function isOpenPalm(landmarks) {
  // Check thumb — use x-distance since thumb extends sideways
  const thumbExtended =
    Math.abs(landmarks[THUMB_TIP].x - landmarks[THUMB_MCP].x) > 0.05;

  if (!thumbExtended) return false;

  for (let i = 0; i < FINGER_TIPS.length; i++) {
    if (!isFingerExtended(landmarks, FINGER_TIPS[i], FINGER_MCPS[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Check if all five fingers are curled (fist).
 */
function isFist(landmarks) {
  // Thumb curled — tip is close to palm center
  const thumbCurled =
    Math.abs(landmarks[THUMB_TIP].x - landmarks[THUMB_MCP].x) < 0.06 &&
    landmarks[THUMB_TIP].y > landmarks[THUMB_MCP].y - 0.03;

  if (!thumbCurled) return false;

  for (let i = 0; i < FINGER_TIPS.length; i++) {
    if (!isFingerCurled(landmarks, FINGER_TIPS[i], FINGER_MCPS[i])) {
      return false;
    }
  }
  return true;
}

/**
 * Maps hand landmarks to a game gesture.
 *
 * @param {Array} landmarks - Array of 21 normalized landmarks from MediaPipe.
 * @returns {{ gesture: string, direction: string|null }}
 *   gesture: 'FIST' | 'STOP' | 'POINT' | 'NONE'
 *   direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | null
 */
export function mapLandmarksToGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { gesture: 'NONE', direction: null };
  }

  // 1. Check fist first — all fingers curled
  if (isFist(landmarks)) {
    return { gesture: 'FIST', direction: null };
  }

  // 2. Check open palm — all fingers extended
  if (isOpenPalm(landmarks)) {
    return { gesture: 'STOP', direction: null };
  }

  // 3. Check thumb direction — requires other 4 fingers curled
  if (!areOtherFingersCurled(landmarks)) {
    return { gesture: 'NONE', direction: null };
  }

  const thumbTip = landmarks[4];
  const wrist = landmarks[0];

  // Direction vector from wrist to thumb tip
  let dx = thumbTip.x - wrist.x;
  const dy = thumbTip.y - wrist.y;

  // Mirror correction — webcam is horizontally flipped
  dx = -dx;

  // Dead zone — ignore tiny movements
  if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) {
    return { gesture: 'NONE', direction: null };
  }

  // Check minimum vector magnitude
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude < MIN_VECTOR) {
    return { gesture: 'NONE', direction: null };
  }

  // Dominant axis determines direction
  let direction;
  if (Math.abs(dx) > Math.abs(dy)) {
    direction = dx > 0 ? 'RIGHT' : 'LEFT';
  } else {
    // In MediaPipe, y increases downward — dy < 0 means thumb is above wrist
    direction = dy < 0 ? 'UP' : 'DOWN';
  }

  return { gesture: 'POINT', direction };
}
