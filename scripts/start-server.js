const net = require('net');
const { spawn } = require('child_process');

const START_PORT = 3030;

/**
 * Checks if a port is free
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

/**
 * Finds the first free port starting from startPort
 */
async function findAvailablePort(startPort) {
  let port = startPort;
  while (true) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
    console.log(`Port ${port} is occupied, checking port ${port + 1}...`);
    port++;
  }
}

async function main() {
  const port = await findAvailablePort(START_PORT);
  console.log(`\n>>> Launching DiaBit on available port: ${port}\n`);

  const args = [...process.argv.slice(2)];
  
  // Replace or add port flag
  const portIndex = args.indexOf('-p');
  if (portIndex !== -1) {
    args[portIndex + 1] = String(port);
  } else {
    args.push('-p', String(port));
  }

  // Determine whether to run dev or start
  const isStart = process.env.npm_lifecycle_event === 'start';
  const command = 'npx';
  const cmdArgs = isStart ? ['next', 'start', ...args] : ['next', 'dev', ...args];

  const child = spawn(command, cmdArgs, { stdio: 'inherit', shell: true });

  child.on('close', (code) => {
    process.exit(code);
  });
}

main().catch((err) => {
  console.error('Failed to run start-server:', err);
  process.exit(1);
});
