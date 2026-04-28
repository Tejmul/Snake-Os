import React, { useState, useEffect, useRef, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
} from "@react-three/postprocessing";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════════════════
   WEBSOCKET-BASED ASTEROID SERPENT
   Uses C backend via WebSocket for game logic
   ═══════════════════════════════════════════════════════════════════════════════ */

const WS_URL = "ws://localhost:8080";
const G = 25; // Board size matches C snake_server (BOARD_WIDTH/HEIGHT)

// Reuse CSS from original
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
:root{
  --void:#030308;--neb:#080812;--cyan:#00e5ff;--pink:#ff2d95;
  --gold:#ffd600;--green:#39ff14;--red:#ff1744;--mag:#c200ff;
  --white:#d8d8f0;--dim:rgba(216,216,240,.35);
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--void);overflow:hidden;font-family:'Rajdhani',sans-serif;color:var(--white)}

.root{position:fixed;inset:0}
.cvs{position:fixed;inset:0;z-index:1}
.ui{position:fixed;inset:0;z-index:10;pointer-events:none}
.ui>*{pointer-events:auto}

.hud-tl{position:absolute;top:20px;left:20px;background:rgba(3,3,8,.7);
  backdrop-filter:blur(14px);border:1px solid rgba(0,229,255,.12);
  border-radius:10px;padding:14px 22px}
.hud-score{font-family:'Orbitron',monospace;font-size:26px;font-weight:800;
  color:var(--gold);text-shadow:0 0 18px rgba(255,214,0,.4);
  display:flex;align-items:center;gap:10px}
.hud-meta{font-family:'Share Tech Mono',monospace;font-size:12px;color:var(--dim);
  margin-top:5px;display:flex;gap:14px}

.status{position:absolute;top:20px;right:20px;font-family:'Orbitron',monospace;
  font-size:11px;letter-spacing:2px;background:rgba(3,3,8,.7);
  backdrop-filter:blur(14px);border:1px solid rgba(0,229,255,.1);
  border-radius:8px;padding:9px 16px}
.status.connected{color:var(--green);border-color:var(--green)}
.status.disconnected{color:var(--red);border-color:var(--red)}

.go-scr{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;
  align-items:center;justify-content:center;background:rgba(3,3,8,.92);
  backdrop-filter:blur(14px)}
.go-title{font-family:'Orbitron',monospace;font-size:clamp(36px,6vw,72px);font-weight:900;
  color:var(--red);text-shadow:0 0 50px rgba(255,23,68,.5);letter-spacing:8px}
.go-stats{margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:10px 36px}
.go-s{text-align:center}
.go-sl{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:2px;
  color:var(--dim);text-transform:uppercase}
.go-sv{font-family:'Orbitron',monospace;font-size:22px;font-weight:700;
  color:var(--gold);text-shadow:0 0 12px rgba(255,214,0,.35)}
.go-btns{margin-top:36px;display:flex;gap:14px}

.hb{font-family:'Orbitron',monospace;font-size:13px;font-weight:600;letter-spacing:4px;
  padding:15px 56px;min-width:320px;text-align:center;border:1px solid;border-radius:2px;
  background:transparent;cursor:pointer;position:relative;overflow:hidden;
  transition:all .35s;text-transform:uppercase}
.hb.go{color:var(--green);border-color:var(--green)}
.hb.inp{color:var(--cyan);border-color:rgba(0,229,255,.35)}
`;

/* ═══════════════════════════════════════════════════════════════════════════════
   3D Components
   ═══════════════════════════════════════════════════════════════════════════════ */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.06} color="#0a0a20" />
      <directionalLight position={[15, 20, -8]} intensity={0.5} color="#ff8833" />
      <directionalLight position={[-10, 12, 10]} intensity={0.2} color="#0044ff" />
    </>
  );
}

function Snake({ snake, alive }) {
  const grp = useRef();
  
  if (!snake || snake.length === 0) return null;
  
  const head = snake[0];
  const tail = snake.slice(1);
  
  return (
    <group ref={grp}>
      {/* Head */}
      <group position={[head.x + 0.5, 0.4, head.y + 0.5]}>
        <mesh castShadow>
          <dodecahedronGeometry args={[0.36, 1]} />
          <meshStandardMaterial
            color={alive ? "#39ff14" : "#ff1744"}
            emissive={alive ? "#39ff14" : "#ff1744"}
            emissiveIntensity={0.9}
            metalness={0.7}
            roughness={0.15}
          />
        </mesh>
        <pointLight color={alive ? "#39ff14" : "#ff1744"} intensity={1.5} distance={8} />
      </group>
      
      {/* Tail */}
      {tail.map((seg, i) => {
        const r = tail.length > 0 ? i / tail.length : 0;
        const sc = 1 - r * 0.4;
        const gv = Math.round(255 - r * 200);
        const sCol = `rgb(16,${gv},20)`;
        
        return (
          <mesh
            key={i}
            position={[seg.x + 0.5, 0.35, seg.y + 0.5]}
            scale={[sc, sc, sc]}
            castShadow
          >
            <sphereGeometry args={[0.3, 10, 10]} />
            <meshStandardMaterial
              color={sCol}
              emissive={sCol}
              emissiveIntensity={0.3}
              metalness={0.5}
              roughness={0.25}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Food({ food }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.015;
    ref.current.rotation.y += 0.02;
    ref.current.position.y = 0.5 + Math.sin(clock.elapsedTime * 2.5) * 0.18;
  });
  
  if (!food || !food.active) return null;
  
  return (
    <group position={[food.x + 0.5, 0.5, food.y + 0.5]}>
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color="#ff6a00"
          emissive="#ff6a00"
          emissiveIntensity={0.5}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>
      <pointLight color="#ff6a00" intensity={0.8} distance={5} />
    </group>
  );
}

function Cam({ snake }) {
  const { camera } = useThree();
  const tPos = useRef(new THREE.Vector3(G / 2, G * 1.05, G / 2 + G * 0.15));
  const tLook = useRef(new THREE.Vector3(G / 2, 0, G / 2));
  
  useFrame(() => {
    tPos.current.set(G / 2, G * 1.05, G / 2 + G * 0.15);
    tLook.current.set(G / 2, 0, G / 2);
    camera.position.lerp(tPos.current, 0.035);
    camera.lookAt(tLook.current);
  });
  
  return null;
}

function PostFX() {
  return (
    <EffectComposer>
      <Bloom intensity={0.7} luminanceThreshold={0.4} luminanceSmoothing={0.9} mipmapBlur />
      <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
      <Vignette darkness={0.6} offset={0.25} />
      <Noise opacity={0.035} />
    </EffectComposer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WebSocket Hook
   ═══════════════════════════════════════════════════════════════════════════════ */
function useWebSocketGame() {
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log("✅ Connected to game server");
        setConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "state") {
            setGameState(msg.data);
          }
        } catch (e) {
          console.error("Failed to parse message:", e);
        }
      };
      
      ws.onclose = () => {
        console.log("❌ Disconnected from game server");
        setConnected(false);
        // Auto-reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error("Connection failed:", error);
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    }
  }, []);
  
  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);
  
  const sendCommand = useCallback((type, data = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, ...data }));
    }
  }, []);
  
  return { connected, gameState, sendCommand };
}

/* ═══════════════════════════════════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════════════════════════════════ */
export default function AsteroidSerpentWebSocket() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);
  
  const { connected, gameState, sendCommand } = useWebSocketGame();
  const tickIntervalRef = useRef(null);
  
  // Auto-tick the game every 150ms when connected and alive
  useEffect(() => {
    if (connected && gameState?.alive) {
      tickIntervalRef.current = setInterval(() => {
        sendCommand("tick");
      }, 150);
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    }
    
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [connected, gameState?.alive, sendCommand]);
  
  // Keyboard input
  useEffect(() => {
    const handleKey = (e) => {
      const keyMap = {
        ArrowUp: "w", w: "w", W: "w",
        ArrowDown: "s", s: "s", S: "s",
        ArrowLeft: "a", a: "a", A: "a",
        ArrowRight: "d", d: "d", D: "d"
      };
      
      const key = keyMap[e.key];
      if (key && connected) {
        e.preventDefault();
        sendCommand("direction", { key });
      }
      
      if ((e.key === "r" || e.key === "R") && connected) {
        e.preventDefault();
        sendCommand("reset");
      }
    };
    
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [connected, sendCommand]);
  
  // Build snake array: head + tail
  const snakeArray = gameState
    ? [gameState.head, ...(gameState.tail || [])]
    : [];
  
  return (
    <div className="root">
      <div className="cvs">
        <Canvas
          camera={{ position: [G / 2, G * 1.05, G / 2 + G * 0.15], fov: 58 }}
          shadows
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.85
          }}
          dpr={[1, 1.5]}
        >
          <color attach="background" args={["#030308"]} />
          <fog attach="fog" args={["#030308", 30, 65]} />
          <Lighting />
          <Stars radius={140} depth={70} count={7000} factor={3.5} saturation={0} fade speed={0.2} />
          
          {gameState && (
            <>
              <Snake snake={snakeArray} alive={gameState.alive} />
              <Food food={gameState.food} />
              <Cam snake={snakeArray} />
            </>
          )}
          
          <PostFX />
        </Canvas>
      </div>
      
      <div className="ui">
        <div className="hud-tl">
          <div className="hud-score">
            <span>◆ {gameState?.score || 0}</span>
          </div>
          <div className="hud-meta">
            <span>◇ LEN {gameState?.length || 0}</span>
          </div>
        </div>
        
        <div className={`status ${connected ? "connected" : "disconnected"}`}>
          {connected ? "🟢 C SERVER ONLINE" : "🔴 CONNECTING..."}
        </div>
        
        {gameState && !gameState.alive && (
          <div className="go-scr">
            <div className="go-title">GAME OVER</div>
            <div className="go-stats">
              <div className="go-s">
                <div className="go-sl">SCORE</div>
                <div className="go-sv">{gameState.score}</div>
              </div>
              <div className="go-s">
                <div className="go-sl">LENGTH</div>
                <div className="go-sv">{gameState.length}</div>
              </div>
            </div>
            <div className="go-btns">
              <button className="hb go" onClick={() => sendCommand("reset")}>
                ▶ PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
