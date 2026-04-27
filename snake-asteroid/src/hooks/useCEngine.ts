'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { SnakeSegment, FoodItem } from '@/types/game';

interface CEngineState {
  alive: boolean;
  score: number;
  length: number;
  head: { x: number; y: number };
  dirX: number;
  dirY: number;
  food: { x: number; y: number; active: boolean };
  tail: { x: number; y: number }[];
}

const WS_URL = 'ws://localhost:3001';

export function useCEngine() {
  const wsRef = useRef<WebSocket | null>(null);
  const gameState = useGameStore((s) => s.gameState);
  const tickIntervalRef = useRef<number | null>(null);

  const updateFromCEngine = useCallback((data: CEngineState) => {
    const snake: SnakeSegment[] = [
      { x: data.head.x, y: data.head.y, index: 0, isHead: true },
      ...data.tail.map((seg, i) => ({
        x: seg.x,
        y: seg.y,
        index: i + 1,
        isHead: false,
      })),
    ];

    const food: FoodItem[] = data.food.active
      ? [{
          position: { x: data.food.x, y: data.food.y },
          type: 'normal' as const,
          points: 10,
          spawnTime: Date.now(),
        }]
      : [];

    const direction = 
      data.dirX === 1 ? 'RIGHT' :
      data.dirX === -1 ? 'LEFT' :
      data.dirY === -1 ? 'UP' : 'DOWN';

    useGameStore.setState({
      snake,
      food,
      direction,
      stats: {
        ...useGameStore.getState().stats,
        score: data.score,
        length: data.length,
      },
    });

    if (!data.alive && useGameStore.getState().gameState === 'playing') {
      useGameStore.getState().gameOver();
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to C engine');
    };

    ws.onmessage = (event) => {
      try {
        const data: CEngineState = JSON.parse(event.data);
        updateFromCEngine(data);
      } catch (e) {
        console.error('Failed to parse C engine state:', e);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from C engine');
      wsRef.current = null;
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };
  }, [updateFromCEngine]);

  const sendCommand = useCallback((cmd: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(cmd);
    }
  }, []);

  const sendDirection = useCallback((dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    const keyMap = { UP: 'w', DOWN: 's', LEFT: 'a', RIGHT: 'd' };
    sendCommand(keyMap[dir]);
  }, [sendCommand]);

  const tick = useCallback(() => {
    sendCommand('t');
  }, [sendCommand]);

  const restart = useCallback(() => {
    sendCommand('r');
  }, [sendCommand]);

  useEffect(() => {
    if (gameState === 'playing') {
      connect();
      
      const startTime = Date.now();
      
      tickIntervalRef.current = window.setInterval(() => {
        tick();
        useGameStore.setState((s) => ({
          stats: { ...s.stats, timeAlive: Date.now() - startTime },
        }));
      }, 150);
      
      setTimeout(() => {
        sendCommand('r');
      }, 100);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [gameState, connect, tick, sendCommand]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { sendDirection, tick, restart, sendCommand };
}
