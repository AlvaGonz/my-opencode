// ponytail — OpenCode plugin (global install).
//
// Injects the ponytail ruleset into every chat's system prompt at the active
// intensity, persists /ponytail mode switches, and registers slash commands so
// they work when the package is installed from npm. Reuses the shared
// instruction builder so Claude Code, Codex, pi, and OpenCode all read one
// source of truth.
//
// OpenCode loads this as a server plugin — add it to your opencode.json:
//   { "plugin": ["./.opencode/plugins/ponytail.mjs"] }

import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global OpenCode paths (where hooks/skills/commands are installed)
const globalOpenCodeDir = path.join(os.homedir(), '.opencode');
const hooksDir = path.join(globalOpenCodeDir, 'hooks');
const skillsDir = path.join(globalOpenCodeDir, 'skills');
const commandsDir = path.join(globalOpenCodeDir, 'command');

// The shared instruction builder is CommonJS; bridge to it from this ES module.
const require = createRequire(import.meta.url);
const { getPonytailInstructions } = require(path.join(hooksDir, 'ponytail-instructions.js'));
const { getDefaultMode, normalizePersistedMode } = require(path.join(hooksDir, 'ponytail-config.js'));

// OpenCode has no flag-file convention of its own; keep mode beside its config.
const statePath = path.join(
  process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
  'opencode',
  '.ponytail-active',
);

function readMode() {
  try {
    return normalizePersistedMode(fs.readFileSync(statePath, 'utf8').trim()) || getDefaultMode();
  } catch (e) {
    return getDefaultMode();
  }
}

function writeMode(mode) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, mode);
}

export function parseCommandFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Tolerate CRLF: a Windows checkout (autocrlf) delivers \r\n, npm ships \n.
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;
  const description = match[1].match(/description:\s*(.+)/)?.[1]?.trim();
  return { description, template: match[2].trim() };
}

export default async ({ client } = {}) => {
  const log = (level, message) => {
    try { client && client.app && client.app.log({ body: { service: 'ponytail', level, message } }); } catch (e) {}
  };

  return {
    // Register slash commands + skills directory.
    config: async (config) => {
      if (!config.command) config.command = {};
      try {
        for (const file of fs.readdirSync(commandsDir).filter((f) => f.endsWith('.md'))) {
          const name = path.basename(file, '.md');
          const parsed = parseCommandFile(path.join(commandsDir, file));
          if (parsed) config.command[name] = parsed;
        }
      } catch (e) {}

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },

    // Append the ruleset to the system prompt every turn.
    'experimental.chat.system.transform': async (_input, output) => {
      const mode = readMode();
      if (mode === 'off') return;
      output.system.push(getPonytailInstructions(mode));
    },

    // Persist `/ponytail <level>` so the next turn's injection follows it.
    // ponytail: mode applies from the next message, not the current one — the
    // transform reads the flag the command writes. Good enough; switch to a
    // synchronous store if same-turn switching ever matters.
    'command.execute.before': async (input) => {
      if (!input || input.command !== 'ponytail') return;
      // `off` is persisted like any mode; the transform reads it and stays silent.
      const mode = normalizePersistedMode((input.arguments || '').trim()) || getDefaultMode();
      writeMode(mode);
      log('info', 'ponytail ' + mode);
    },
  };
};
