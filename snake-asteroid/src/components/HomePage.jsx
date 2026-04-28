"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import Navbar from "./Navbar";

const Hyperspeed = dynamic(() => import("./Hyperspeed"), {
  ssr: false,
});

export default function HomePage({ 
  onStartGame, 
  challengeMode, 
  onToggleChallengeMode, 
  inputMode, 
  onSetInputMode 
}) {
  const [isHovering, setIsHovering] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const hyperspeedOptions = useMemo(
    () => ({
      distortion: "mountainDistortion",
      length: 400,
      roadWidth: 9,
      islandWidth: 2,
      lanesPerRoad: 3,
      fov: 90,
      fovSpeedUp: 150,
      speedUp: 2,
      carLightsFade: 0.4,
      totalSideLightSticks: 50,
      lightPairsPerRoadWay: 50,
      colors: {
        roadColor: 0x080808,
        islandColor: 0x0a0a0a,
        background: 0x000000,
        shoulderLines: 0x131318,
        brokenLines: 0x131318,
        leftCars: [0xff2d95, 0xea4c89, 0xff2d95],
        rightCars: [0x00d4ff, 0x0091ea, 0x00d4ff],
        sticks: 0x00d4ff,
      },
    }),
    []
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000",
        overflow: "hidden",
        fontFamily: "'Orbitron', monospace",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap');
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.5),
                        0 0 40px rgba(0, 212, 255, 0.3),
                        0 0 60px rgba(0, 212, 255, 0.2),
                        inset 0 0 20px rgba(0, 212, 255, 0.1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(0, 212, 255, 0.8),
                        0 0 60px rgba(0, 212, 255, 0.5),
                        0 0 90px rgba(0, 212, 255, 0.3),
                        inset 0 0 30px rgba(0, 212, 255, 0.2);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 968px) {
          #home {
            flex-direction: column !important;
            text-align: center !important;
            padding: 0 20px !important;
          }
          #home > div {
            flex: none !important;
            max-width: 100% !important;
          }
          #home h1 {
            text-align: center !important;
          }
          #home button {
            align-self: center !important;
          }
        }
      `}</style>

      <Hyperspeed effectOptions={hyperspeedOptions} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)",
          pointerEvents: "none",
        }}
      />

      {!showMenu && <Navbar />}

      <div
        id="home"
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: showMenu ? "row" : "column",
          alignItems: "center",
          justifyContent: showMenu ? "space-between" : "center",
          minHeight: "100vh",
          padding: showMenu ? "0 60px" : "0 20px",
          textAlign: showMenu ? "left" : "center",
          gap: showMenu ? "60px" : "0",
          maxWidth: showMenu ? "1400px" : "100%",
          margin: "0 auto",
          transition: "all 0.5s ease",
        }}
      >
        <div
          style={{
            animation: "slideIn 1s ease-out",
            marginBottom: showMenu ? "0" : "30px",
            flex: showMenu ? "1" : "none",
          }}
        >
          <h1
            style={{
              fontSize: showMenu
                ? "clamp(38px, 7vw, 88px)"
                : "clamp(48px, 8vw, 120px)",
              fontWeight: 900,
              letterSpacing: showMenu ? "clamp(4px, 1vw, 12px)" : "8px",
              marginBottom: showMenu ? "30px" : "80px",
              background:
                "linear-gradient(135deg, #00d4ff 0%, #ff2d95 50%, #ffd700 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.1,
              animation: showMenu ? "none" : "float 3s ease-in-out infinite",
              transition: "all 0.5s ease",
              textAlign: showMenu ? "left" : "center",
            }}
          >
            ASTEROID
            <br />
            SERPENT
          </h1>

          {!showMenu ? (
            <div
              style={{
                display: "flex",
                gap: "20px",
                justifyContent: "center",
                flexWrap: "wrap",
                animation: "slideIn 1s ease-out 0.4s backwards",
              }}
            >
              <button
                onClick={() => setShowMenu(true)}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                style={{
                  padding: "20px 50px",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  border: "2px solid #00d4ff",
                  background: isHovering
                    ? "linear-gradient(135deg, #00d4ff, #0091ea)"
                    : "rgba(0, 212, 255, 0.1)",
                  color: "#fff",
                  cursor: "pointer",
                  borderRadius: "0",
                  fontFamily: "'Orbitron', monospace",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                  animation: "glow 2s ease-in-out infinite",
                  transform: isHovering ? "scale(1.05)" : "scale(1)",
                }}
              >
                <span style={{ position: "relative", zIndex: 1 }}>
                  PLAY NOW
                </span>
              </button>

              <button
                onClick={() => {
                  const featuresSection = document.getElementById("features");
                  featuresSection?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  padding: "20px 50px",
                  fontSize: "18px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.05)",
                  color: "rgba(255, 255, 255, 0.9)",
                  cursor: "pointer",
                  borderRadius: "0",
                  fontFamily: "'Orbitron', monospace",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.borderColor = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.05)";
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.3)";
                }}
              >
                LEARN MORE
              </button>
            </div>
          ) : null}
        </div>

        {showMenu && (
          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              alignItems: "flex-start",
              animation: "slideIn 0.5s ease-out",
              maxWidth: "500px",
              padding: "40px",
              background: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 212, 255, 0.1)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                letterSpacing: "8px",
                color: "#00d4ff",
                textTransform: "uppercase",
                fontFamily: "'Share Tech Mono', monospace",
                marginBottom: "10px",
              }}
            >
              // SYSTEM ONLINE
            </div>

            <div
              style={{
                fontSize: "14px",
                letterSpacing: "3px",
                color: "rgba(255, 255, 255, 0.5)",
                textTransform: "uppercase",
                marginBottom: "20px",
              }}
            >
              NAVIGATE THE VOID • DEVOUR THE COSMOS
            </div>

            <button
              onClick={onStartGame}
              style={{
                padding: "18px 60px",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                border: "2px solid #39ff14",
                background: "rgba(57, 255, 20, 0.1)",
                color: "#39ff14",
                cursor: "pointer",
                borderRadius: "0",
                fontFamily: "'Orbitron', monospace",
                transition: "all 0.3s ease",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "rgba(57, 255, 20, 0.2)";
                e.target.style.transform = "translateX(5px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "rgba(57, 255, 20, 0.1)";
                e.target.style.transform = "translateX(0)";
              }}
            >
              ▶ LAUNCH GAME
            </button>

            <button
              onClick={onToggleChallengeMode}
              style={{
                padding: "18px 60px",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                border: challengeMode
                  ? "2px solid #ff2d95"
                  : "2px solid rgba(194, 0, 255, 0.5)",
                background: challengeMode
                  ? "rgba(255, 45, 149, 0.1)"
                  : "rgba(194, 0, 255, 0.05)",
                color: challengeMode ? "#ff2d95" : "#c200ff",
                cursor: "pointer",
                borderRadius: "0",
                fontFamily: "'Orbitron', monospace",
                transition: "all 0.3s ease",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateX(5px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateX(0)";
              }}
            >
              ⚡ CHALLENGE MODE {challengeMode ? "ON" : "OFF"}
            </button>

            <button
              onClick={() =>
                onSetInputMode(inputMode === "keyboard" ? "gamepad" : "keyboard")
              }
              style={{
                padding: "18px 60px",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                background: "rgba(255, 255, 255, 0.05)",
                color: "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                borderRadius: "0",
                fontFamily: "'Orbitron', monospace",
                transition: "all 0.3s ease",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.4)";
                e.target.style.transform = "translateX(5px)";
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
                e.target.style.transform = "translateX(0)";
              }}
            >
              {inputMode === "keyboard" ? "⌨" : "🎮"} INPUT:{" "}
              {inputMode.toUpperCase()}
            </button>

            <button
              onClick={() => setShowMenu(false)}
              style={{
                marginTop: "20px",
                padding: "12px 40px",
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "transparent",
                color: "rgba(255, 255, 255, 0.5)",
                cursor: "pointer",
                borderRadius: "0",
                fontFamily: "'Orbitron', monospace",
                transition: "all 0.3s ease",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#00d4ff";
                e.target.style.borderColor = "#00d4ff";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "rgba(255, 255, 255, 0.5)";
                e.target.style.borderColor = "rgba(255, 255, 255, 0.2)";
              }}
            >
              ← BACK
            </button>
          </div>
        )}

        {!showMenu && (
          <div
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                letterSpacing: "2px",
                color: "rgba(255, 255, 255, 0.5)",
                textTransform: "uppercase",
              }}
            >
              Scroll to explore
            </div>
            <div
              style={{
                width: "2px",
                height: "30px",
                background:
                  "linear-gradient(to bottom, #00d4ff, transparent)",
              }}
            />
          </div>
        )}
      </div>

      {!showMenu && (
        <div
          id="features"
          style={{
            position: "relative",
            zIndex: 10,
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "100px 20px",
          }}
        >
        <div style={{ maxWidth: "1200px", width: "100%" }}>
          <h2
            style={{
              fontSize: "clamp(32px, 6vw, 64px)",
              fontWeight: 900,
              textAlign: "center",
              marginBottom: "80px",
              background: "linear-gradient(135deg, #00d4ff, #ff2d95)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            FEATURES
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "30px",
            }}
          >
            {[
              {
                title: "C BACKEND",
                desc: "Pure C game logic running via WebSocket bridge",
                icon: "⚡",
              },
              {
                title: "REAL-TIME PHYSICS",
                desc: "Custom memory allocator and math operations in C",
                icon: "🎮",
              },
              {
                title: "3D GRAPHICS",
                desc: "Stunning Three.js rendering with post-processing",
                icon: "🌟",
              },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  padding: "40px",
                  background: "rgba(0, 212, 255, 0.05)",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  backdropFilter: "blur(10px)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.background =
                    "rgba(0, 212, 255, 0.1)";
                  e.currentTarget.style.borderColor = "#00d4ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background =
                    "rgba(0, 212, 255, 0.05)";
                  e.currentTarget.style.borderColor =
                    "rgba(0, 212, 255, 0.2)";
                }}
              >
                <div
                  style={{
                    fontSize: "48px",
                    marginBottom: "20px",
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#00d4ff",
                    marginBottom: "15px",
                    letterSpacing: "2px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: "16px",
                    color: "rgba(255, 255, 255, 0.7)",
                    lineHeight: 1.6,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
