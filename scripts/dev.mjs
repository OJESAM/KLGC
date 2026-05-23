import { spawn } from 'node:child_process';

const processes = [
  spawn('npm', ['run', 'dev:backend'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['run', 'dev:frontend'], { stdio: 'inherit', shell: true }),
];

function shutdown() {
  for (const child of processes) child.kill('SIGINT');
}

process.on('SIGINT', () => {
  shutdown();
  process.exit(0);
});
process.on('SIGTERM', () => {
  shutdown();
  process.exit(0);
});
