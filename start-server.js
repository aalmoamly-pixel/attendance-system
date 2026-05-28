// Simple script to start Vite server without PowerShell issues
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Vite development server...');
console.log('📂 Working directory:', __dirname);
console.log('');

const vitePath = path.join(__dirname, 'node_modules', '.bin', 'vite.cmd');
const server = spawn(vitePath, [], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});
