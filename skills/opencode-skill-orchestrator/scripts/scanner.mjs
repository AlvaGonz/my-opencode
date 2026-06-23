#!/usr/bin/env node
/**
 * opencode-skill-orchestrator / scripts / scanner.mjs
 * 
 * Scans OpenCode skills directories for SKILL.md files,
 * extracts frontmatter metadata, and outputs a JSON array.
 * 
 * SECURITY: Never reads full skill body. Only extracts YAML frontmatter.
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORCHESTRATOR_DIR = resolve(__dirname, '..');
const PARENT_SKILLS_DIR = resolve(ORCHESTRATOR_DIR, '..');

// Directories to scan: pre-installed skills/ + parent skills dir
const SCAN_PATHS = [
  resolve(process.cwd(), 'skills'),
  PARENT_SKILLS_DIR
];

// Also check OPENCODE_SHARE_DIR
if (process.env.OPENCODE_SHARE_DIR) {
  SCAN_PATHS.push(resolve(process.env.OPENCODE_SHARE_DIR, 'skills'));
}

function extractFrontmatter(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    
    const frontmatter = {};
    const lines = match[1].split('\n');
    for (const line of lines) {
      const sep = line.indexOf(':');
      if (sep === -1) continue;
      const key = line.slice(0, sep).trim();
      const value = line.slice(sep + 1).trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
    return frontmatter;
  } catch {
    return null;
  }
}

function scanDirectory(dirPath) {
  if (!existsSync(dirPath)) return [];
  
  const results = [];
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillDir = join(dirPath, entry.name);
      const skillFile = join(skillDir, 'SKILL.md');
      
      if (!existsSync(skillFile)) continue;
      
      const meta = extractFrontmatter(skillFile);
      if (!meta || !meta.name) continue;
      
      results.push({
        name: meta.name,
        description: (meta.description || '').slice(0, 200),
        source: skillDir,
        path: skillFile
      });
    }
  } catch (err) {
    console.error('[scanner] Warning scanning ' + dirPath + ': ' + err.message);
  }
  
  return results;
}

// Main execution
const allSkills = [];
const seen = new Set();

for (const scanPath of SCAN_PATHS) {
  const skills = scanDirectory(scanPath);
  for (const skill of skills) {
    if (!seen.has(skill.name)) {
      seen.add(skill.name);
      allSkills.push(skill);
    }
  }
}

const pretty = process.argv.includes('--pretty');
const output = JSON.stringify(allSkills, null, pretty ? 2 : 0);
console.log(output);
