#!/usr/bin/env node
/**
 * AgriLens Rwanda - Port Management Utility
 * Finds and safely terminates any orphaned or hanging process listening on target port (default 3000).
 * Prevents EADDRINUSE errors across Windows PowerShell, CMD, Git Bash, and Unix shells.
 */
const { execSync } = require('child_process');

function getPidsOnPort(port) {
  const pids = new Set();
  const currentPid = process.pid;

  if (process.platform === 'win32') {
    try {
      const output = execSync('netstat -ano -p tcp', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true,
      });

      const lines = output.split('\n');
      for (const line of lines) {
        // e.g. "  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234"
        // or   "  TCP    [::]:3000              [::]:0                 LISTENING       1234"
        if (line.includes(`:${port}`) && line.toUpperCase().includes('LISTENING')) {
          const parts = line.trim().split(/\s+/);
          const pid = parseInt(parts[parts.length - 1], 10);
          if (pid && !isNaN(pid) && pid !== currentPid) {
            pids.add(pid);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  } else {
    try {
      const output = execSync(`lsof -ti:${port}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const pid = parseInt(line.trim(), 10);
        if (pid && !isNaN(pid) && pid !== currentPid) {
          pids.add(pid);
        }
      }
    } catch (e) {
      // ignore
    }
  }

  return Array.from(pids);
}

function freePort(port) {
  const targetPort = parseInt(port || process.env.PORT || '3000', 10);
  const pids = getPidsOnPort(targetPort);

  if (pids.length === 0) {
    // Port is completely free
    return true;
  }

  console.log(`[AgriLens Port Guard] Port ${targetPort} is occupied by PID(s): ${pids.join(', ')}.`);
  console.log(`[AgriLens Port Guard] Terminating orphaned process(es) to prevent EADDRINUSE...`);

  for (const pid of pids) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', windowsHide: true });
      } else {
        process.kill(pid, 'SIGKILL');
      }
      console.log(`[AgriLens Port Guard] Successfully terminated PID ${pid}.`);
    } catch (err) {
      // Process may have already exited
    }
  }

  // Sleep 600ms to allow Windows TCP socket stack to transition from TIME_WAIT to released
  const start = Date.now();
  while (Date.now() - start < 600) {
    // wait
  }

  const remaining = getPidsOnPort(targetPort);
  if (remaining.length === 0) {
    console.log(`[AgriLens Port Guard] Port ${targetPort} is now completely free.`);
    return true;
  } else {
    console.warn(`[AgriLens Port Guard] Warning: PID(s) ${remaining.join(', ')} still occupying port ${targetPort}.`);
    return false;
  }
}

if (require.main === module) {
  const portArg = process.argv[2] || process.env.PORT || 3000;
  freePort(portArg);
}

module.exports = { freePort, getPidsOnPort };
