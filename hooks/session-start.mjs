import { createSession } from '../scripts/session-init.mjs';
import { buildRegistry } from '../scripts/registry.mjs';
import fs from 'fs';
import path from 'path';

function sessionStart() {
  const { sessionId, sessionPath } = createSession();

  let activeProfile = 'Default';
  try {
    const workingContext = fs.readFileSync('.opencode/WORKING-CONTEXT.md', 'utf8');
    const match = workingContext.match(/Active Profile:\s*(.+)/);
    if (match && match[1]) {
      activeProfile = match[1].trim();
    }
  } catch (err) {
    console.warn('[session-start] .opencode/WORKING-CONTEXT.md not found or could not be read, continuing with default profile.');
  }

  const registry = buildRegistry();

  console.log(`╔══════════════════════════════════════╗`);
  console.log(`║ OpenCode Agent — Session Active      ║`);
  console.log(`╠══════════════════════════════════════╣`);
  console.log(`║ Session ID : ${sessionId.padEnd(23)} ║`);
  console.log(`║ Profile    : ${activeProfile.padEnd(23)} ║`);
  console.log(`║ Skills     : ${String(registry.total).padEnd(23)} ║`);
  console.log(`║ CWD        : ${process.cwd().padEnd(23)} ║`);
  console.log(`╚══════════════════════════════════════╝`);

  const progressPath = path.join(sessionPath, 'progress.md');
  const startupEvent = `\n## Session Started\n> ${new Date().toISOString()} | Profile: ${activeProfile}\n`;
  fs.appendFileSync(progressPath, startupEvent, 'utf8');
}

import { fileURLToPath } from 'url';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  sessionStart();
}
export { sessionStart };
