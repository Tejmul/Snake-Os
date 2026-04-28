export default function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#05050a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Orbitron', monospace",
        color: "#00d4ff",
      }}
    >
      <div
        style={{
          fontSize: "clamp(24px, 4vw, 48px)",
          fontWeight: 900,
          letterSpacing: "6px",
          marginBottom: "24px",
          background:
            "linear-gradient(135deg, #00d4ff, #ff2d95, #ffd700)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        ASTEROID SERPENT
      </div>
      <div
        style={{
          width: "200px",
          height: "2px",
          background: "rgba(0,212,255,0.3)",
          borderRadius: "1px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-40%",
            width: "40%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent, #00d4ff, transparent)",
            animation: "loadSlide 1.5s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
        @keyframes loadSlide {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
