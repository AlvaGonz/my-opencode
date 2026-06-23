// scripts/session-init.mjs
// Genera un ID de sesión basado en timestamp y crea la carpeta de sesión con los 3 archivos de memoria
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const SESSIONS_DIR = 'agents/sessions';

export function createSession() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const sessionId = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const sessionPath = join(SESSIONS_DIR, sessionId);

  if (!existsSync(sessionPath)) {
    mkdirSync(sessionPath, { recursive: true });
  }

  const templates = {
    'task_plan.md': `# Task Plan — Session ${sessionId}\n> Created: ${now.toISOString()}\n\n## Objective\n[FILL IN BEFORE PROCEEDING]\n\n## Tasks\n| ID | Task | Status | Priority |\n|---|---|---|---|\n`,
    'findings.md':  `# Findings — Session ${sessionId}\n> Created: ${now.toISOString()}\n\n## Findings\n_No findings yet._\n`,
    'progress.md':  `# Progress — Session ${sessionId}\n> Last updated: ${now.toISOString()}\n\n## ✅ Completed\n_None yet._\n\n## 🔄 In Progress\n_None yet._\n\n## 🔜 Next\n_Not defined._\n`,
    'evolution_log.md': `# Evolution Log — Session ${sessionId}\n> Created: ${now.toISOString()}\n\n## Evolution Cycles\n_Record of each mutation cycle: timestamp, fitness vector, mutations proposed, skills written, circuit breaker status_\n\n| Timestamp | Fitness (Sec/Cov/Conv/Arch/Composite) | Mutations Proposed | Skills Written | Circuit Breakers |\n|---|---|---|---|---|\n`,
  };

  for (const [filename, content] of Object.entries(templates)) {
    const filePath = join(sessionPath, filename);
    if (!existsSync(filePath)) {
      writeFileSync(filePath, content, 'utf8');
    }
  }

  // Write session pointer so other scripts can find the active session
  writeFileSync(join(SESSIONS_DIR, 'ACTIVE_SESSION'), sessionId, 'utf8');

  console.log(`[session-init] Session created: ${sessionId}`);
  console.log(`[session-init] Path: ${sessionPath}`);
  return { sessionId, sessionPath };
}

// Run directly: node scripts/session-init.mjs
if (process.argv.includes('session-init')) {
  createSession();
}
