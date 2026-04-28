const WebSocket = require('ws');
const { spawn } = require('child_process');
const path = require('path');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('✅ Client connected');
  
  // Spawn the C asteroid_server process (uses math.c!)
  const cServerPath = path.join(__dirname, '../build/asteroid_server');
  const snakeProcess = spawn(cServerPath, [], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  console.log(`🎮 Spawned C server: ${cServerPath}`);
  
  let jsonBuffer = '';
  
  // Handle output from C process (JSON game state)
  snakeProcess.stdout.on('data', (data) => {
    jsonBuffer += data.toString();
    
    // Parse complete JSON objects (one per line)
    const lines = jsonBuffer.split('\n');
    jsonBuffer = lines.pop(); // Keep incomplete line in buffer
    
    lines.forEach(line => {
      if (line.trim()) {
        try {
          const gameState = JSON.parse(line);
          // Send game state to browser
          ws.send(JSON.stringify({
            type: 'state',
            data: gameState
          }));
        } catch (e) {
          console.error('JSON parse error:', e.message, 'Line:', line);
        }
      }
    });
  });
  
  snakeProcess.stderr.on('data', (data) => {
    console.error('C process error:', data.toString());
  });
  
  snakeProcess.on('close', (code) => {
    console.log(`C process exited with code ${code}`);
    ws.close();
  });
  
  // Handle messages from browser (input commands)
  ws.on('message', (message) => {
    try {
      const cmd = JSON.parse(message);
      
      switch(cmd.type) {
        case 'direction':
          // Send direction key to C process (w,a,s,d)
          snakeProcess.stdin.write(cmd.key);
          break;
          
        case 'tick':
          // Send tick command to advance game
          snakeProcess.stdin.write('t');
          break;
          
        case 'reset':
          // Send reset command
          snakeProcess.stdin.write('r');
          break;
          
        case 'quit':
          snakeProcess.stdin.write('q');
          break;
      }
    } catch (e) {
      console.error('Invalid message:', e.message);
    }
  });
  
  ws.on('close', () => {
    console.log('❌ Client disconnected');
    snakeProcess.kill();
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    snakeProcess.kill();
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  wss.clients.forEach(client => client.close());
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
