// ecc-verification-loop — OpenCode plugin (ECC Post-Task Verification).
//
// Runs post_task_loop.py orchestration on session.idle (task completion).
// Handles: memory persistence, git checkpoint, subagent cleanup, 
// codebase-memory refresh, and EvoAgentX fitness evaluation.
//
// OpenCode loads this as a server plugin — add it to your opencode.json:
//   { "plugin": ["./plugins/ecc-verification-loop.mjs"] }

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Debounce tracking
let lastRunTime = 0;
const DEBOUNCE_MS = 30000; // 30 seconds

// Session log path
const sessionLogPath = path.join(process.cwd(), '.codebase-memory', 'session-log.jsonl');
const lastEvalPath = path.join(process.cwd(), '.codebase-memory', 'last-eval.json');
const editAuditPath = path.join(process.cwd(), '.codebase-memory', 'edit-audit.jsonl');

function ensureMemoryDir() {
  const memDir = path.join(process.cwd(), '.codebase-memory');
  if (!fs.existsSync(memDir)) {
    fs.mkdirSync(memDir, { recursive: true });
  }
}

function runPostTaskLoop(mode = 'full', task = 'post-task verification', output = 'automated run') {
  return new Promise((resolve) => {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(process.cwd(), 'scripts', 'post_task_loop.py');
    
    if (!fs.existsSync(scriptPath)) {
      resolve({ success: false, error: 'post_task_loop.py not found', stdout: '', stderr: '' });
      return;
    }

    // Map mode to hook-mode
    const hookModeMap = {
      'full': 'ci',
      'eval': 'ci',
      'memory': 'ci',
      'checkpoint': 'ci'
    };
    const hookMode = hookModeMap[mode] || 'ci';

    const child = spawn(pythonCmd, [scriptPath, '--task', task, '--output', output, '--hook-mode', hookMode], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ success: code === 0, code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message, stdout, stderr });
    });
  });
}

function parsePostTaskOutput(stdout) {
  const result = {
    checkpoint: null,
    memoryUpdated: false,
    subagentsCleaned: 0,
    rawOutput: stdout
  };

  const lines = stdout.split('\n');
  for (const line of lines) {
    if (line.includes('CHECKPOINT:')) {
      result.checkpoint = line.split('CHECKPOINT:')[1].trim();
    }
    if (line.includes('MEMORY_UPDATED:')) {
      result.memoryUpdated = line.includes('true');
    }
    if (line.includes('SUBAGENTS_CLEANED:')) {
      result.subagentsCleaned = parseInt(line.split('SUBAGENTS_CLEANED:')[1]?.trim() || '0', 10);
    }
  }

  return result;
}

function appendSessionLog(entry) {
  ensureMemoryDir();
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...entry
  };
  fs.appendFileSync(sessionLogPath, JSON.stringify(logEntry) + '\n');
}

function appendEditAudit(filePath) {
  ensureMemoryDir();
  const entry = {
    timestamp: new Date().toISOString(),
    file: filePath,
    session: process.env.OPENCODE_SESSION_ID || 'unknown'
  };
  fs.appendFileSync(editAuditPath, JSON.stringify(entry) + '\n');
}

export default async ({ client } = {}) => {
  const log = (level, message) => {
    try { client && client.app && client.app.log({ body: { service: 'ecc-verification', level, message } }); } catch (e) {}
  };

  return {
    config: async (config) => {
      if (!config.command) config.command = {};
      
      config.command['verify:run'] = {
        description: 'Manually run post-task verification loop',
        template: `Running post-task verification (mode: {{mode}})...

This will:
- Persist session memory
- Create git checkpoint
- Clean up subagent sessions
- Refresh codebase-memory index
- Run EvoAgentX fitness evaluation

Results will be shown below.`
      };

      config.command['verify:status'] = {
        description: 'Show last verification run status',
        template: `Last Verification Run:
{{#if lastRun}}
- Time: {{lastRun.timestamp}}
- Mode: {{lastRun.mode}}
- Success: {{#if lastRun.success}}✅{{else}}❌{{/if}}
- Checkpoint: {{lastRun.checkpoint || 'N/A'}}
- Memory Updated: {{#if lastRun.memoryUpdated}}✅{{else}}❌{{/if}}
- Subagents Cleaned: {{lastRun.subagentsCleaned || 0}}
{{else}}
No verification runs recorded yet.
{{/if}}`
      };

      config.command['verify:eval'] = {
        description: 'Run EvoAgentX fitness evaluation on current session',
        template: `Running EvoAgentX fitness evaluation...

Evaluating:
- Security score (0-100)
- Test coverage (0-100)
- Convention compliance (0-100)
- Architecture quality (0-100)
- Composite fitness score

Results will be saved to .codebase-memory/last-eval.json`
      };
    },

    // Hook: session.idle - Main verification trigger
    'session.idle': async (ctx) => {
      const now = Date.now();
      if (now - lastRunTime < DEBOUNCE_MS) {
        log('debug', 'Skipping verification - debounce active');
        return;
      }
      lastRunTime = now;

      log('info', 'Session idle - running post-task verification loop');
      
      try {
        // Run full orchestration
        const result = await runPostTaskLoop('full');
        const parsed = parsePostTaskOutput(result.stdout);

        // Log to session log
        appendSessionLog({
          type: 'post_task_verification',
          mode: 'full',
          success: result.success,
          code: result.code,
          checkpoint: parsed.checkpoint,
          memoryUpdated: parsed.memoryUpdated,
          subagentsCleaned: parsed.subagentsCleaned,
          stdout: result.stdout.slice(-2000), // Last 2000 chars
          stderr: result.stderr.slice(-1000)
        });

        if (!result.success) {
          log('error', `post_task_loop FAILED (code ${result.code})`);
          // Could trigger toast notification here if client supports it
        } else {
          log('info', `Verification complete: checkpoint=${parsed.checkpoint}, memory=${parsed.memoryUpdated}, cleaned=${parsed.subagentsCleaned}`);
        }
      } catch (err) {
        log('error', `Verification loop error: ${err.message}`);
        appendSessionLog({
          type: 'post_task_verification',
          mode: 'full',
          success: false,
          error: err.message
        });
      }
    },

    // Hook: file.edited - Audit trail for non-memory files
    'file.edited': async (ctx) => {
      if (!ctx || !ctx.path) return;
      
      // Skip memory directory edits to avoid loops
      if (ctx.path.includes('.codebase-memory')) return;
      
      appendEditAudit(ctx.path);
    },

    // Hook: experimental.chat.system.transform - Inject verification status
    'experimental.chat.system.transform': async (_input, output) => {
      try {
        if (fs.existsSync(lastEvalPath)) {
          const evalData = JSON.parse(fs.readFileSync(lastEvalPath, 'utf8'));
          if (evalData.score !== undefined) {
            const scoreEmoji = evalData.score >= 80 ? '🟢' : evalData.score >= 60 ? '🟡' : '🔴';
            output.system.push(`\n[ECC Verification] Last fitness: ${scoreEmoji} ${evalData.score}/100 (${evalData.verdict || 'unknown'})`);
            if (evalData.flags && evalData.flags.length > 0) {
              output.system.push(`  Flags: ${evalData.flags.join(', ')}`);
            }
          }
        }
      } catch (e) {
        // Ignore if no eval data
      }
    },

    // Custom tools for manual verification control
    tools: {
      ecc_verify_run: {
        description: 'Manually invoke post_task_loop.py in full orchestration mode',
        parameters: {
          type: 'object',
          properties: {
            mode: { 
              type: 'string', 
              enum: ['full', 'eval', 'memory', 'checkpoint'], 
              default: 'full',
              description: 'Verification mode' 
            }
          }
        },
        execute: async (args) => {
          log('info', `Manual verification triggered: ${args.mode}`);
          const result = await runPostTaskLoop(args.mode);
          const parsed = parsePostTaskOutput(result.stdout);
          
          appendSessionLog({
            type: 'manual_verification',
            mode: args.mode,
            success: result.success,
            code: result.code,
            ...parsed
          });

          if (!result.success) {
            return `❌ Verification FAILED (mode: ${args.mode})\n\nExit code: ${result.code}\n\nStdout:\n${result.stdout.slice(-3000)}\n\nStderr:\n${result.stderr.slice(-1000)}`;
          }

          return `✅ Verification COMPLETE (mode: ${args.mode})\n\n` +
            `Checkpoint: ${parsed.checkpoint || 'N/A'}\n` +
            `Memory Updated: ${parsed.memoryUpdated ? 'Yes' : 'No'}\n` +
            `Subagents Cleaned: ${parsed.subagentsCleaned}\n\n` +
            `Output:\n${result.stdout.slice(-2000)}`;
        }
      },

      ecc_verify_eval: {
        description: 'Run EvoAgentX fitness evaluation on current session',
        parameters: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', description: 'Session ID to evaluate (default: current)' },
            threshold: { type: 'number', default: 0.7, description: 'Pass threshold (0-1)' }
          }
        },
        execute: async (args) => {
          // This would call post_task_loop.py with --mode eval
          // For now, run the eval mode
          const result = await runPostTaskLoop('eval');
          
          if (result.success) {
            // Try to parse fitness from output
            let fitnessInfo = '';
            try {
              if (fs.existsSync(lastEvalPath)) {
                const evalData = JSON.parse(fs.readFileSync(lastEvalPath, 'utf8'));
                fitnessInfo = `\nFitness Score: ${evalData.composite || evalData.score || 'N/A'}/100\n` +
                  `Security: ${evalData.security || 'N/A'}/100\n` +
                  `Coverage: ${evalData.coverage || 'N/A'}/100\n` +
                  `Convention: ${evalData.convention || 'N/A'}/100\n` +
                  `Architecture: ${evalData.architecture || 'N/A'}/100\n` +
                  `Verdict: ${evalData.verdict || evalData.passed ? 'PASS' : 'FAIL'}`;
              }
            } catch (e) {}
            
            return `✅ EvoAgentX Evaluation Complete${fitnessInfo}\n\nOutput:\n${result.stdout.slice(-2000)}`;
          }
          
          return `❌ Evaluation FAILED\n\n${result.stderr || result.stdout}`;
        }
      },

      ecc_verify_status: {
        description: 'Get status of last verification run',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          try {
            if (!fs.existsSync(sessionLogPath)) {
              return 'No verification runs recorded yet.';
            }
            
            const lines = fs.readFileSync(sessionLogPath, 'utf8').trim().split('\n');
            const lastLine = lines[lines.length - 1];
            const lastRun = JSON.parse(lastLine);
            
            return `Last Verification Run:\n` +
              `- Time: ${lastRun.timestamp}\n` +
              `- Mode: ${lastRun.mode}\n` +
              `- Success: ${lastRun.success ? '✅' : '❌'}\n` +
              `- Checkpoint: ${lastRun.checkpoint || 'N/A'}\n` +
              `- Memory Updated: ${lastRun.memoryUpdated ? '✅' : '❌'}\n` +
              `- Subagents Cleaned: ${lastRun.subagentsCleaned || 0}\n` +
              `- Type: ${lastRun.type}`;
          } catch (e) {
            return `Error reading status: ${e.message}`;
          }
        }
      },

      ecc_verify_session_log: {
        description: 'View recent session verification log entries',
        parameters: {
          type: 'object',
          properties: {
            limit: { type: 'number', default: 10, description: 'Number of entries to show' }
          }
        },
        execute: async (args) => {
          try {
            if (!fs.existsSync(sessionLogPath)) {
              return 'No session log found.';
            }
            
            const lines = fs.readFileSync(sessionLogPath, 'utf8').trim().split('\n');
            const recent = lines.slice(-args.limit);
            
            let output = `Recent Verification Log (last ${recent.length}):\n\n`;
            for (const line of recent) {
              const entry = JSON.parse(line);
              const time = new Date(entry.timestamp).toLocaleTimeString();
              const status = entry.success ? '✅' : '❌';
              output += `${status} ${time} | ${entry.mode} | ${entry.type}\n`;
              if (entry.checkpoint) output += `   Checkpoint: ${entry.checkpoint}\n`;
            }
            return output;
          } catch (e) {
            return `Error reading log: ${e.message}`;
          }
        }
      }
    }
  };
};