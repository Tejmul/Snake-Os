# 🐍 Asteroid Serpent

<div align="center">

**A next-generation Snake game powered by C backend, WebSocket communication, and stunning 3D graphics**

![Status](https://img.shields.io/badge/status-active-success.svg)
![Platform](https://img.shields.io/badge/platform-web-blue.svg)
![Backend](https://img.shields.io/badge/backend-C-green.svg)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB.svg)

[Features](#-features) • [Demo](#-demo) • [Setup](#-quick-start) • [Architecture](#-architecture) • [Controls](#-controls)

</div>

---

## 🌟 Features

### 🎮 Multiple Input Modes
Play the game your way with **three distinct input methods**:

- **⌨️ Keyboard Mode** - Classic WASD/Arrow key controls
- **👋 Gesture Mode** - Hand gesture recognition via webcam using MediaPipe
- **🎤 Voice Mode** - Voice commands ("left", "right", "up", "down", "pause")

### 🔥 Challenge System
Dynamic challenge system that keeps you on your toes:

- **Speed Run** - Complete objectives under time pressure
- **No Miss** - Don't miss any food items
- **Combo Master** - Maintain high combo streaks
- **Size Limit** - Achieve score without exceeding snake length
- Real-time challenge tracking with progress bars

### ⚡ C Backend Integration
Game logic powered by **pure C** for maximum performance:

- Custom memory allocator (`my_malloc`, `my_free`)
- Custom math operations (`my_sqrt`, `my_abs`, `my_clamp`)
- WebSocket bridge connecting C backend to React frontend
- Real-time state synchronization

### 🎨 Stunning 3D Graphics
Built with React Three Fiber and modern web technologies:

- Procedurally generated space environment with asteroids
- Volumetric lighting and bloom effects
- Chromatic aberration and post-processing
- Smooth animations and particle effects
- Custom target cursor with parallax

---

## 🖼️ Demo

### Main Menu
Beautiful cyberpunk-inspired UI with dynamic backgrounds and interactive elements.

### Game Modes
Choose your challenge level and input method before launching into the void.

### In-Game HUD
- Real-time score and combo tracking
- Challenge progress indicators
- Input mode indicator with visual feedback
- Mini-map for spatial awareness
- Backend status monitor (C/JS toggle)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- GCC or Clang compiler
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Snake-Os
```

2. **Build the C backend**
```bash
make asteroid_server
```
✅ You should see: `✅ Built build/asteroid_server`

3. **Install dependencies**
```bash
cd snake-asteroid
npm install
```

4. **Start the WebSocket server**
```bash
# Terminal 1 - Keep this running
node websocket-server.js
```
✅ You should see: `🚀 WebSocket server running on ws://localhost:8080`

5. **Start the React app**
```bash
# Terminal 2
npm run dev
```

6. **Open your browser**
Navigate to `http://localhost:3000`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           React Three Fiber (3D Rendering)           │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │         Game State Management (React)                │  │
│  │    • Input capture (keyboard/gesture/voice)          │  │
│  │    • Challenge system                                │  │
│  │    • HUD and UI components                           │  │
│  └────────────────────┬─────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────┘
                         │ WebSocket
                         │ (ws://localhost:8080)
┌────────────────────────▼──────────────────────────────────┐
│              Node.js WebSocket Server                      │
│  • Manages WebSocket connections                           │
│  • Spawns C process                                        │
│  • Bidirectional message routing                           │
└────────────────────────┬──────────────────────────────────┘
                         │ stdio (stdin/stdout)
┌────────────────────────▼──────────────────────────────────┐
│                 C Backend (asteroid_server)                │
│  • Core game logic (snake movement, collision)             │
│  • Custom memory management (my_malloc/my_free)            │
│  • Custom math operations (my_sqrt, my_clamp, my_mod)      │
│  • JSON state output                                       │
└────────────────────────────────────────────────────────────┘
```

### Communication Flow

**Input Flow (Browser → C):**
1. User input captured (keyboard/gesture/voice)
2. React sends command via WebSocket: `{"type":"direction","key":"w"}`
3. Node.js writes to C process stdin: `w`
4. C backend updates game state

**State Flow (C → Browser):**
1. C backend outputs JSON state to stdout
2. Node.js reads and forwards via WebSocket: `{"type":"state","data":{...}}`
3. React updates 3D rendering

---

## 🎮 Controls

### Keyboard Mode
| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move snake |
| R | Restart game |
| Space | Pause/Resume |
| I | Cycle input modes |

### Gesture Mode
Activate via the menu, then use hand gestures:
- **Point Left** - Move left
- **Point Right** - Move right
- **Point Up** - Move up
- **Point Down** - Move down
- **Thumbs Up** - Pause/Resume

### Voice Mode
Activate via the menu, then use voice commands:
- "left" / "go left"
- "right" / "go right"
- "up" / "go up"
- "down" / "go down"
- "pause" / "resume"
- "challenge" - Accept challenge

---

## 🧩 Project Structure

```
snake-asteroid/
├── src/
│   ├── app/
│   │   └── page.jsx              # Main app entry point
│   ├── components/
│   │   ├── AsteroidSerpent.jsx   # Main game component
│   │   ├── HomePage.jsx          # Landing page with menu
│   │   ├── Navbar.jsx            # Navigation bar
│   │   ├── Hyperspeed.jsx        # Background effect
│   │   └── TargetCursor.jsx      # Custom cursor
│   └── gesture/
│       ├── useGestureEngine.js   # Gesture recognition engine
│       └── stabilizer.js         # Gesture stabilization
├── websocket-server.js           # WebSocket bridge server
└── package.json

Snake-Os/                         # Root C project
├── src/
│   ├── memory.c                  # Custom allocator
│   ├── math.c                    # Math operations
│   ├── string.c                  # String utilities
│   └── asteroid_server.c         # Game logic server
├── include/
│   └── *.h                       # Header files
├── build/
│   └── asteroid_server           # Compiled binary
└── Makefile
```

---

## 🔧 Configuration

### Enable/Disable C Backend

In `AsteroidSerpent.jsx`:
```javascript
const USE_C_BACKEND = true;  // Set to false for pure JS mode
```

### Adjust Difficulty

In `AsteroidSerpent.jsx`:
```javascript
// Base game speed (lower = faster)
const BASE_SPEED = 150;

// Challenge mode speed multiplier
const CHALLENGE_SPEED_MULTIPLIER = 0.7;
```

### WebSocket Settings

In `websocket-server.js`:
```javascript
const PORT = 8080;
const C_SERVER_PATH = '../build/asteroid_server';
```

---

## 🧪 Testing

### Test C Backend Directly
```bash
cd Snake-Os
./build/asteroid_server
```
Type commands (`t` for tick, `w/a/s/d` for direction, `q` to quit) and observe JSON output.

### Test WebSocket Connection
Open browser DevTools → Console. Look for:
```
WebSocket connected to ws://localhost:8080
```

### Verify C Functions
Check the HUD top-right corner for backend status:
- 🟢 **C BACKEND** - C modules active
- 🔴 **C SERVER OFFLINE** - Fallback to JS

---

## 🎯 Challenges

The game features a dynamic challenge system that adapts to your skill:

| Challenge | Description | Reward |
|-----------|-------------|--------|
| **Speed Run** | Eat 5 food items in 30 seconds | +500 points |
| **No Miss** | Don't miss any food for 10 spawns | +300 points |
| **Combo Master** | Maintain 5x combo streak | +400 points |
| **Size Limit** | Score 200 without exceeding 15 length | +600 points |

Challenges appear randomly during gameplay with on-screen notifications and progress tracking.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📝 License

This project is part of an Operating Systems course project - Snake OS.

---

## 🙏 Acknowledgments

- **Three.js & React Three Fiber** - 3D graphics rendering
- **MediaPipe** - Hand gesture recognition
- **Web Speech API** - Voice command recognition
- **Next.js** - React framework
- **WebSocket API** - Real-time communication

---

## 📧 Contact

**Built by Tejmul** • OS Project 2026

---

<div align="center">

**[⬆ Back to Top](#-asteroid-serpent)**

Made with ❤️ and lots of C code

</div>
