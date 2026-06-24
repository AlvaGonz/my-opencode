// scripts/registry.mjs
// Builds the skill registry for LLM injection — MINIMAL payload only
// The LLM receives name + short_description (200 chars max) — never the full SKILL.md body
import { scanSkills } from './skill-scanner.mjs';
import { writeFileSync, readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

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

export function buildAgentRegistry() {
  // Dynamic scanner: reads agents/subagents/*.md files and parses
  // ACTIVATION CONTRACT sections for trigger keywords and metadata.
  // Uses top-level imports: readdirSync, readFileSync, existsSync, join

  const subagentsDir = join('agents', 'subagents');
  const agents = [];

  if (!existsSync(subagentsDir)) {
    console.warn('[registry] agents/subagents/ directory not found');
    return { generated_at: new Date().toISOString(), total: 0, agents: [] };
  }

  const files = readdirSync(subagentsDir).filter(
    (f) => f.endsWith('.md') && !f.startsWith('.')
  );

  for (const file of files) {
    const filePath = join(subagentsDir, file);
    const content = readFileSync(filePath, 'utf8');
    const name = file.replace('.md', '');

    // Parse ACTIVATION CONTRACT section
    const contractMatch = content.match(
      /## ACTIVATION CONTRACT\s*\n([\s\S]*?)(?=\n## [A-Z]|\n---|\Z)/
    );
    const contractBlock = contractMatch ? contractMatch[1] : '';

    // Extract trigger keywords
    const triggerMatch = contractBlock.match(
      /Trigger keywords?:\s*(.+)/i
    );
    const triggers = triggerMatch
      ? triggerMatch[1].split(',').map((t) => t.trim()).filter(Boolean)
      : [name];

    // Extract blocks flag
    const blocksMatch = contractBlock.match(/Blocks:\s*(.+)/i);
    const blocks = blocksMatch
      ? blocksMatch[1].trim().toLowerCase().startsWith('yes')
      : false;

    // Extract approval gate flag
    const approvalMatch = contractBlock.match(
      /Approval gate required:\s*(.+)/i
    );
    const requiresApproval = approvalMatch
      ? approvalMatch[1].trim().toLowerCase().startsWith('yes')
      : false;

    // Extract circuit-breaker threshold
    const cbMatch = contractBlock.match(
      /circuit-breaker threshold:\s*(\d+)/i
    );
    const circuitBreakerThreshold = cbMatch ? parseInt(cbMatch[1], 10) : 3;

    // Parse OUTPUT CONTRACT for status types
    const outputMatch = content.match(
      /## OUTPUT CONTRACT\s*\n([\s\S]*?)(?=\n## [A-Z]|\n---|\Z)/
    );
    const outputBlock = outputMatch ? outputMatch[1] : '';
    const statusMatch = outputBlock.match(
      /status:\s*"([^"]+)"\s*\|\s*"([^"]+)"\s*\|\s*"([^"]+)"/
    );
    const statuses = statusMatch
      ? [statusMatch[1], statusMatch[2], statusMatch[3]]
      : ['success', 'needs_review', 'blocked'];

    agents.push({
      name,
      triggers,
      blocks,
      requires_approval: requiresApproval,
      circuit_breaker_threshold: circuitBreakerThreshold,
      output_statuses: statuses,
      source_file: filePath,
    });
  }

  const agentRegistry = {
    generated_at: new Date().toISOString(),
    total: agents.length,
    agents,
  };

  writeFileSync(
    'agents-lock.json',
    JSON.stringify(agentRegistry, null, 2),
    'utf8'
  );
  console.log(
    `[registry] Built agent registry with ${agents.length} agents → agents-lock.json`
  );
  return agentRegistry;
}

// Run directly
if (process.argv.includes('registry') || (process.argv[1] && (process.argv[1].endsWith('registry.mjs') || process.argv[1].endsWith('registry')))) {
  buildRegistry();
  buildAgentRegistry();
}
