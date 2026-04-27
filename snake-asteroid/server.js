const { spawn } = require('child_process');
const WebSocket = require('ws');
const path = require('path');

const PORT = 3001;
const SNAKE_BIN = path.join(__dirname, '..', 'snake_server');

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server running on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  const snakeProcess = spawn(SNAKE_BIN);
  let buffer = '';
  
  snakeProcess.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    
    for (const line of lines) {
      if (line.trim()) {
        ws.send(line);
      }
    }
  });
  
  snakeProcess.stderr.on('data', (data) => {
    console.error('Snake error:', data.toString());
  });
  
  snakeProcess.on('close', (code) => {
    console.log('Snake process exited with code', code);
    ws.close();
  });
  
  ws.on('message', (message) => {
    const cmd = message.toString();
    snakeProcess.stdin.write(cmd);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    snakeProcess.stdin.write('q');
    snakeProcess.kill();
  });
});
