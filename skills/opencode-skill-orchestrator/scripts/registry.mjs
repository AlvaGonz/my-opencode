#!/usr/bin/env node
/**
 * opencode-skill-orchestrator / scripts / registry.mjs
 * 
 * Builds a structured Tool Calling schema from discovered skills.
 * Outputs JSON suitable for constrained enum-based skill selection.
 * 
 * Usage: node scripts/registry.mjs [--inline]
 */

import { execSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCANNER_PATH = resolve(__dirname, 'scanner.mjs');

function discoverSkills() {
  try {
    const cmd = 'node "' + SCANNER_PATH + '"';
    const stdout = execSync(cmd, { encoding: 'utf-8' });
    return JSON.parse(stdout);
  } catch (err) {
    console.error('[registry] Failed to discover skills:', err.message);
    return [];
  }
}

function buildRegistry(skills) {
  const skillNames = skills.map(function(s) { return s.name; });
  const descriptions = {};
  for (var i = 0; i < skills.length; i++) {
    var s = skills[i];
    descriptions[s.name] = s.description;
  }
  
  return {
    tool_schema: {
      name: 'invoke_skill',
      description: 'Select and invoke a discovered skill for the current task phase',
      parameters: {
        type: 'object',
        properties: {
          skill_name: {
            type: 'string',
            enum: skillNames,
            description: 'The name of the skill to invoke'
          },
          reason: {
            type: 'string',
            description: 'Why this skill is appropriate for the current task phase'
          }
        },
        required: ['skill_name', 'reason']
      }
    },
    skill_descriptions: descriptions,
    skill_count: skills.length
  };
}

// Main execution
var skills = discoverSkills();
var inline = process.argv.includes('--inline');

if (inline) {
  var definitions = skills.map(function(s) {
    return { name: s.name, description: s.description };
  });
  console.log(JSON.stringify({ skills: definitions }, null, 2));
} else {
  var registry = buildRegistry(skills);
  console.log(JSON.stringify(registry, null, 2));
}
