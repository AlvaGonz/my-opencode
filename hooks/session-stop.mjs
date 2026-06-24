import fs from 'fs';
import path from 'path';

function sessionStop() {
  const activeSessionFile = 'agents/sessions/ACTIVE_SESSION';
  if (!fs.existsSync(activeSessionFile)) {
    console.log("No active session found");
    process.exit(0);
  }

  const sessionId = fs.readFileSync(activeSessionFile, 'utf8').trim();
  const sessionPath = path.join('agents', 'sessions', sessionId);

  let findingsCount = 0;
  const findingsFile = path.join(sessionPath, 'findings.md');
  if (fs.existsSync(findingsFile)) {
    const findingsContent = fs.readFileSync(findingsFile, 'utf8');
    findingsCount = findingsContent.split('\n').filter(line => line.trim() !== '').length;
  }

  const workingContextFile = '.opencode/WORKING-CONTEXT.md';
  const lastSessionText = `\n## Last Session: ${sessionId}\nLast Stop: ${new Date().toISOString()}\nFindings: ${findingsCount}\n`;
  
  if (fs.existsSync(workingContextFile)) {
    fs.appendFileSync(workingContextFile, lastSessionText, 'utf8');
  } else {
    const dir = path.dirname(workingContextFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(workingContextFile, lastSessionText, 'utf8');
  }

  fs.unlinkSync(activeSessionFile);

  console.log(`[session-stop] Session ${sessionId} closed.`);
  console.log(`[session-stop] State persisted to .opencode/WORKING-CONTEXT.md`);
  console.log(`[session-stop] Run 'git status' to review changes before committing.`);
}

import { fileURLToPath } from 'url';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  sessionStop();
}
export { sessionStop };
