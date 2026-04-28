"use client";

export default function Navbar() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: "20px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "rgba(5, 5, 10, 0.3)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0, 212, 255, 0.1)",
      }}
    >
      <div
        style={{
          fontSize: "24px",
          fontWeight: 900,
          letterSpacing: "2px",
          background: "linear-gradient(135deg, #00d4ff, #ff2d95)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          fontFamily: "'Orbitron', monospace",
        }}
      >
        ASTEROID SERPENT
      </div>

      <div style={{ display: "flex", gap: "30px", alignItems: "center" }}>
        <a
          href="#home"
          style={{
            color: "#00d4ff",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'Orbitron', monospace",
            transition: "all 0.3s ease",
            position: "relative",
          }}
          onMouseEnter={(e) => {
            e.target.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "#00d4ff";
          }}
        >
          Home
        </a>
        <a
          href="#features"
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'Orbitron', monospace",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.color = "#00d4ff";
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          Features
        </a>
        <a
          href="#about"
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'Orbitron', monospace",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.color = "#00d4ff";
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "rgba(255, 255, 255, 0.7)";
          }}
        >
          About
        </a>
      </div>
    </nav>
  );
}
