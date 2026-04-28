/**
 * useGestureEngine — React hook wrapping the GestureEngine.
 *
 * Manages lifecycle, sends directions via WebSocket, and exposes
 * status for HUD display.
 */

// Placeholder — implementation in commit 6
import { useState } from 'react';

export function useGestureEngine() {
  const [gestureDir, setGestureDir] = useState(null);
  return { gestureDir, gestureStatus: 'inactive', gestureError: null };
}
