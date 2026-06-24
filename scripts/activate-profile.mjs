// scripts/activate-profile.mjs
// Activates a named profile: resolves its components, updates opencode.json
// and .opencode/WORKING-CONTEXT.md with the active profile state.
//
// Usage: node scripts/activate-profile.mjs <profile-name>
// Example: node scripts/activate-profile.mjs developer
//
// Profile names: essential | developer | business | advanced | full

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');

// ── Schema: component prefix → base directory in repo ──────────
const COMPONENT_MAP = {
  'agent':    'agents/core',
  'subagent': 'agents/subagents',
  'skill':    'skills',
  'command':  'command',
  'context':  'context',
  'tool':     'tool',
  'config':   '.',   // config:env-example → ./env.example
  'plugin':   'plugin',
};

// ── VALID PROFILE NAMES ─────────────────────────────────────────
const VALID_PROFILES = ['essential', 'developer', 'business', 'advanced', 'full'];

// ── IMMUTABLE opencode.json KEYS (never overwritten) ───────────
const IMMUTABLE_KEYS = ['commands', 'context_root', 'version', 'approval_gates'];

// ───────────────────────────────────────────────────────────────
function loadProfile(profileName) {
  const profilePath = join(REPO_ROOT, 'profiles', profileName, 'profile.json');
  if (!existsSync(profilePath)) {
    throw new Error(`Profile not found: ${profilePath}`);
  }
  return JSON.parse(readFileSync(profilePath, 'utf8'));
}

// ───────────────────────────────────────────────────────────────
function resolveComponents(components) {
  const resolved = {
    agents:   [],
    subagents: [],
    skills:   [],
    commands: [],
    contexts: [],
    tools:    [],
    missing:  [],
  };

  for (const component of components) {
    const colonIdx = component.indexOf(':');
    if (colonIdx === -1) {
      resolved.missing.push({ component, reason: 'no colon separator' });
      continue;
    }

    const prefix = component.substring(0, colonIdx);
    const name   = component.substring(colonIdx + 1);
    const baseDir = COMPONENT_MAP[prefix];

    if (!baseDir) {
      // Unknown prefix — log but do not block activation
      resolved.missing.push({ component, reason: `unknown prefix: ${prefix}` });
      continue;
    }

    // Handle glob patterns like "context:core/*"
    if (name.endsWith('/*')) {
      const dir = join(REPO_ROOT, baseDir, name.slice(0, -2));
      if (existsSync(dir)) {
        try {
          const files = readdirSync(dir);
          const category = prefix === 'agent' ? 'agents'
            : prefix === 'subagent' ? 'subagents'
            : prefix === 'skill' ? 'skills'
            : prefix === 'command' ? 'commands'
            : prefix === 'context' ? 'contexts'
            : 'tools';
          files.forEach(f => resolved[category].push(join(baseDir, name.slice(0, -2), f).replace(/\\/g, '/')));
        } catch {
          resolved.missing.push({ component, reason: 'directory unreadable' });
        }
      } else {
        resolved.missing.push({ component, reason: `glob dir not found: ${dir}` });
      }
      continue;
    }

    // Resolve single component to a file path
    const dir = join(REPO_ROOT, baseDir);
    // Try common extensions in order
    const extensions = ['', '.md', '.mjs', '.js', '.json', '.yaml', '.ps1', '.py'];
    let found = false;
    for (const ext of extensions) {
      const fullPath = join(dir, `${name}${ext}`);
      if (existsSync(fullPath)) {
        const category = prefix === 'agent' ? 'agents'
          : prefix === 'subagent' ? 'subagents'
          : prefix === 'skill' ? 'skills'
          : prefix === 'command' ? 'commands'
          : prefix === 'context' ? 'contexts'
          : 'tools';
        resolved[category].push(join(baseDir, `${name}${ext}`).replace(/\\/g, '/'));
        found = true;
        break;
      }
    }
    if (!found) {
      resolved.missing.push({ component, reason: `file not found in ${dir}` });
    }
  }

  return resolved;
}

// ───────────────────────────────────────────────────────────────
function updateOpencodeJson(profileName, resolved) {
  const opencodeJsonPath = join(REPO_ROOT, 'opencode.json');
  const current = JSON.parse(readFileSync(opencodeJsonPath, 'utf8'));

  // Build the delta — only override NON-IMMUTABLE keys
  const delta = {};

  // Map resolved components to opencode.json expected arrays
  if (resolved.subagents.length > 0) {
    delta.subagents = resolved.subagents;
  }
  if (resolved.skills.length > 0) {
    delta.skills = resolved.skills;
  }

  // Set active_profile marker (non-immutable custom field)
  delta.active_profile = profileName;
  delta.profile_activated_at = new Date().toISOString();

  // Apply delta — never touch IMMUTABLE_KEYS
  const updated = { ...current };
  for (const [key, value] of Object.entries(delta)) {
    if (!IMMUTABLE_KEYS.includes(key)) {
      updated[key] = value;
    }
  }

  writeFileSync(opencodeJsonPath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  return { before: current, after: updated, delta };
}

// ───────────────────────────────────────────────────────────────
function updateWorkingContext(profileName, projectPath) {
  const wcPath = join(REPO_ROOT, '.opencode', 'WORKING-CONTEXT.md');
  if (!existsSync(wcPath)) {
    console.warn('[activate-profile] ⚠️  .opencode/WORKING-CONTEXT.md not found — skipping update');
    return;
  }

  let content = readFileSync(wcPath, 'utf8');
  const now = new Date().toISOString();

  // Update "Active Profile:" line (parsed by hooks/session-start.mjs)
  content = content.replace(
    /^Active Profile:.*$/m,
    `Active Profile: ${profileName}`
  );

  // Update "Active Project:" line
  if (projectPath) {
    content = content.replace(
      /^Active Project:.*$/m,
      `Active Project: ${projectPath}`
    );
    content = content.replace(
      /^Active Project Path:.*$/m,
      `Active Project Path: ${resolve(projectPath)}`
    );
  }

  // Update "Last Updated:" timestamp
  content = content.replace(
    /^Last Updated:.*$/m,
    `Last Updated: ${now}`
  );

  writeFileSync(wcPath, content, 'utf8');
}

// ───────────────────────────────────────────────────────────────
function printSummary(profileName, profile, resolved, delta) {
  const BOLD  = '\x1b[1m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED   = '\x1b[31m';
  const RESET = '\x1b[0m';

  console.log('');
  console.log(`${BOLD}╔══════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}║  PROFILE ACTIVATED: ${profileName.toUpperCase().padEnd(25)}║${RESET}`);
  console.log(`${BOLD}╚══════════════════════════════════════════════╝${RESET}`);
  console.log('');
  console.log(`  ${BOLD}Name:${RESET}       ${profile.name}`);
  console.log(`  ${BOLD}Badge:${RESET}      ${profile.badge || '—'}`);
  console.log(`  ${BOLD}Description:${RESET}`);
  console.log(`    ${profile.description}`);
  console.log('');
  console.log(`  ${GREEN}✅ Subagents loaded:${RESET}   ${resolved.subagents.length}`);
  console.log(`  ${GREEN}✅ Skills loaded:${RESET}      ${resolved.skills.length}`);
  console.log(`  ${GREEN}✅ Commands available:${RESET} ${resolved.commands.length}`);
  console.log(`  ${GREEN}✅ Contexts loaded:${RESET}    ${resolved.contexts.length}`);

  if (resolved.missing.length > 0) {
    console.log('');
    console.log(`  ${YELLOW}⚠️  ${resolved.missing.length} component(s) not resolved:${RESET}`);
    resolved.missing.forEach(({ component, reason }) => {
      console.log(`     ${YELLOW}→ ${component}${RESET} (${reason})`);
    });
    console.log(`  ${YELLOW}   These will be skipped. Review profiles/${profileName}/profile.json${RESET}`);
  }

  console.log('');
  console.log(`  ${BOLD}opencode.json updated:${RESET}`);
  if (delta.delta.subagents) {
    console.log(`    subagents[]: ${delta.before.subagents?.length ?? 0} → ${delta.after.subagents.length} entries`);
  }
  if (delta.delta.skills) {
    console.log(`    skills[]:    ${delta.before.skills?.length ?? 0} → ${delta.after.skills.length} entries`);
  }
  console.log(`    active_profile: "${profileName}"`);
  console.log('');
  console.log(`  ${GREEN}✅ WORKING-CONTEXT.md updated${RESET}`);
  console.log('');
  console.log(`  ${BOLD}Next step:${RESET} node hooks/session-start.mjs`);
  console.log('');
}

// ───────────────────────────────────────────────────────────────
// MAIN
// ───────────────────────────────────────────────────────────────
export async function activateProfile(profileName, projectPath = null) {
  if (!VALID_PROFILES.includes(profileName)) {
    throw new Error(
      `Invalid profile: "${profileName}"\n` +
      `Valid options: ${VALID_PROFILES.join(' | ')}`
    );
  }

  console.log(`[activate-profile] Loading profile: ${profileName}...`);

  const profile  = loadProfile(profileName);
  const resolved = resolveComponents(profile.components || []);
  const delta    = updateOpencodeJson(profileName, resolved);
  updateWorkingContext(profileName, projectPath);
  printSummary(profileName, profile, resolved, delta);

  return { profileName, resolved, delta };
}

// Entry point guard — cross-platform safe
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const profileName  = process.argv[2];
  const projectPath  = process.argv[3] || null;   // optional: path to project

  if (!profileName) {
    console.error('[activate-profile] ❌ No profile name provided.');
    console.error(`Usage: node scripts/activate-profile.mjs <profile-name> [project-path]`);
    console.error(`Valid:  essential | developer | business | advanced | full`);
    process.exit(1);
  }

  activateProfile(profileName, projectPath)
    .catch(err => {
      console.error('[activate-profile] ❌ Fatal:', err.message);
      process.exit(1);
    });
}
