/**
 * useGestureEngine — React hook wrapping GestureEngine.
 *
 * Manages engine lifecycle, sends directions via WebSocket,
 * handles fist-to-pause, and exposes status for the HUD.
 */

import { useState, useEffect, useRef } from 'react';
import { GestureEngine } from './index';

// Map game directions to C backend key codes.
const DIR_TO_KEY = { UP: 'w', DOWN: 's', LEFT: 'a', RIGHT: 'd' };

// Opposite directions for reverse-movement blocking.
const OPP = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

/**
 * @param {Object} params
 * @param {boolean} params.active       — Whether gesture input is enabled and game is running.
 * @param {Function} params.sendCommand — WebSocket sendCommand from useWebSocket.
 * @param {boolean} params.wsConnected  — Whether WebSocket is connected.
 * @param {Object} params.nDirRef       — Ref to current direction (nDir from AsteroidSerpent).
 * @param {Function} params.setPaused   — React state setter for pause.
 * @param {boolean} params.useCBackend  — Whether C backend is active.
 * @param {boolean} params.debug        — Log gestures to console.
 *
 * @returns {{ gestureDir, gestureStatus, gestureError, gestureInfo }}
 */
export function useGestureEngine({
  active,
  sendCommand,
  wsConnected,
  nDirRef,
  setPaused,
  useCBackend,
  debug = false,
}) {
  const [gestureDir, setGestureDir] = useState(null);
  const [gestureStatus, setGestureStatus] = useState('inactive');
  const [gestureError, setGestureError] = useState(null);
  const [gestureInfo, setGestureInfo] = useState({
    rawGesture: null,
    confidence: 0,
    fps: 0,
  });

  const engineRef = useRef(null);
  const sendCommandRef = useRef(sendCommand);
  const wsConnectedRef = useRef(wsConnected);
  const nDirRefRef = useRef(nDirRef);
  const setPausedRef = useRef(setPaused);

  // Keep refs fresh without re-creating the engine
  useEffect(() => { sendCommandRef.current = sendCommand; }, [sendCommand]);
  useEffect(() => { wsConnectedRef.current = wsConnected; }, [wsConnected]);
  useEffect(() => { nDirRefRef.current = nDirRef; }, [nDirRef]);
  useEffect(() => { setPausedRef.current = setPaused; }, [setPaused]);

  // Status polling interval
  const statusInterval = useRef(null);

  useEffect(() => {
    if (!active) {
      // Cleanup existing engine
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      setGestureStatus('inactive');
      setGestureDir(null);
      setGestureError(null);
      setGestureInfo({ rawGesture: null, confidence: 0, fps: 0 });

      if (statusInterval.current) {
        clearInterval(statusInterval.current);
        statusInterval.current = null;
      }
      return;
    }

    // Create and start engine
    const engine = new GestureEngine({ debug });
    engineRef.current = engine;
    setGestureStatus('loading');

    engine.onDirection((dir) => {
      // Block reverse direction
      const currentDir = nDirRefRef.current?.current;
      if (currentDir && OPP[dir] === currentDir) {
        return;
      }

      // Update game direction ref
      if (nDirRefRef.current) {
        nDirRefRef.current.current = dir;
      }

      // Send to C backend via WebSocket
      if (useCBackend && wsConnectedRef.current && sendCommandRef.current) {
        sendCommandRef.current('direction', { key: DIR_TO_KEY[dir] });
      }

      setGestureDir(dir);
    });

    engine.onGesture(({ rawGesture, confidence }) => {
      setGestureInfo((prev) => ({
        ...prev,
        rawGesture,
        confidence,
      }));
    });

    engine.onFist(() => {
      if (setPausedRef.current) {
        setPausedRef.current((p) => !p);
      }
    });

    engine.onError((err) => {
      setGestureError(err);
      setGestureStatus('error');
    });

    engine.start().then(() => {
      if (engineRef.current === engine) {
        setGestureStatus('active');
      }
    }).catch((err) => {
      setGestureError(err?.message || 'UNKNOWN_ERROR');
      setGestureStatus('error');
    });

    // Poll FPS for HUD
    statusInterval.current = setInterval(() => {
      if (engineRef.current) {
        const status = engineRef.current.getStatus();
        setGestureInfo((prev) => ({ ...prev, fps: status.fps }));
      }
    }, 1000);

    return () => {
      engine.destroy();
      if (engineRef.current === engine) {
        engineRef.current = null;
      }
      if (statusInterval.current) {
        clearInterval(statusInterval.current);
        statusInterval.current = null;
      }
    };
  }, [active, debug, useCBackend]);

  return { gestureDir, gestureStatus, gestureError, gestureInfo };
}
