# WebSocket Integration Guide

This guide explains how to run your Asteroid Serpent game with the **C backend** via WebSocket.

## Architecture

```
┌─────────────┐         WebSocket          ┌──────────────┐
│   Browser   │ ◄──────────────────────► │  Node.js WS  │
│  (React)    │                            │    Server    │
└─────────────┘                            └──────┬───────┘
                                                   │ spawn + stdio
                                                   │
                                            ┌──────▼───────┐
                                            │  snake_server│
                                            │   (C Process)│
                                            └──────────────┘
```

## Setup Instructions

### 1. Build the C Server

```bash
cd /Users/spylook/Snake-Os
cp Makefile.websocket Makefile
make snake_server
```

This creates `build/snake_server` which:
- Reads input commands from stdin (w,a,s,d,t,r,q)
- Outputs JSON game state to stdout after each command

### 2. Install Node.js Dependencies

```bash
cd snake-asteroid
cp package.json.websocket package.json
npm install
```

### 3. Start the WebSocket Server

```bash
cd snake-asteroid
npm run server
```

You should see:
```
🚀 WebSocket server running on ws://localhost:8080
```

### 4. Update Your React App

Replace the import in your main App file:

```javascript
// Old
import AsteroidSerpent from './components/AsteroidSerpent';

// New
import AsteroidSerpent from './components/AsteroidSerpentWebSocket';
```

### 5. Start Your React Dev Server

```bash
cd snake-asteroid
npm start
```

## How It Works

### Input Flow (Browser → C)

1. User presses arrow key in browser
2. React component captures keydown event
3. Maps key to C command:
   - Arrow Up/W → `"w"`
   - Arrow Left/A → `"a"`
   - Arrow Down/S → `"s"`
   - Arrow Right/D → `"d"`
4. Sends via WebSocket: `{"type":"direction","key":"w"}`
5. Node.js writes `"w"` to C process stdin
6. C server updates direction

### Game Loop

1. React sends `{"type":"tick"}` every 150ms
2. Node.js writes `"t"` to C process stdin
3. C server advances game by one tick
4. C outputs JSON state to stdout

### State Flow (C → Browser)

1. C server writes JSON to stdout:
```json
{
  "alive": true,
  "score": 42,
  "length": 8,
  "head": {"x": 12, "y": 15},
  "dirX": 1,
  "dirY": 0,
  "food": {"x": 8, "y": 10, "active": true},
  "tail": [{"x":11,"y":15}, {"x":10,"y":15}, ...]
}
```

2. Node.js reads stdout, parses JSON
3. Sends via WebSocket: `{"type":"state","data":{...}}`
4. React updates 3D rendering with new snake position

## Commands

| Browser Action | WebSocket Message | C Command | Effect |
|---------------|-------------------|-----------|--------|
| Arrow Up/W | `{"type":"direction","key":"w"}` | `w` | Move up |
| Arrow Left/A | `{"type":"direction","key":"a"}` | `a` | Move left |
| Arrow Down/S | `{"type":"direction","key":"s"}` | `s` | Move down |
| Arrow Right/D | `{"type":"direction","key":"d"}` | `d` | Move right |
| Auto (150ms) | `{"type":"tick"}` | `t` | Advance game |
| Press R | `{"type":"reset"}` | `r` | Reset game |

## Testing the C Server Directly

You can test the C server independently:

```bash
cd /Users/spylook/Snake-Os
./build/snake_server
```

Then type commands:
- `t` - tick the game
- `w` - move up
- `a` - move left
- `s` - move down
- `d` - move right
- `r` - reset game
- `q` - quit

You'll see JSON output after each command.

## Troubleshooting

### "Connection failed" in browser

1. Make sure WebSocket server is running: `npm run server`
2. Check the C executable exists: `ls -la build/snake_server`
3. Check server logs for errors

### C process crashes

Check Node.js terminal for stderr output from C process.

### No game state updates

1. Verify C server outputs JSON (test directly)
2. Check Node.js console for JSON parse errors
3. Enable WebSocket debugging in browser DevTools

## Benefits of This Architecture

✅ **Game logic in C** - Use your custom memory allocator, math, and string functions
✅ **Fast** - C handles heavy computation
✅ **Beautiful UI** - React Three Fiber for 3D rendering
✅ **Separation of concerns** - Backend (C) vs Frontend (React)
✅ **Real OS integration** - Your C modules are actually used!

## Next Steps

- Add more game features in C (power-ups, obstacles)
- Implement challenge modes in C backend
- Add multiplayer by connecting multiple browsers to same C process
- Replace stdio with actual WebSocket in C (using libwebsockets)
