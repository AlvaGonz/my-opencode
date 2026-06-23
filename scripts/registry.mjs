// scripts/registry.mjs
// Builds the skill registry for LLM injection — MINIMAL payload only
// The LLM receives name + short_description (200 chars max) — never the full SKILL.md body
import { scanSkills } from './skill-scanner.mjs';
import { writeFileSync } from 'fs';

/**
 * Builds a minimal registry object safe for LLM System Prompt injection.
 * Full skill content is NEVER included — agents must call loadSkill(name) to get details.
 */
export function buildRegistry() {
  const skills = scanSkills();

  const registry = {
    generated_at: new Date().toISOString(),
    total: skills.length,
    skills: skills.map((s) => ({
      name: s.name,
      short_description: s.description, // Already truncated to 200 chars by scanner
      version: s.version,
      // sourcePath intentionally OMITTED from LLM payload
    })),
  };

  // Write the safe registry (replaces skills-lock.json)
  writeFileSync('skills-lock.json', JSON.stringify(registry, null, 2), 'utf8');
  console.log(`[registry] Built registry with ${registry.total} skills → skills-lock.json`);

  return registry;
}

// Run directly
if (process.argv.includes('registry') || (process.argv[1] && (process.argv[1].endsWith('registry.mjs') || process.argv[1].endsWith('registry')))) {
  buildRegistry();
}
