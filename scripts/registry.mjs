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

export function buildAgentRegistry() {
  // Hard-coded from opencode.json subagents array
  // Source of truth: agents/subagents/ directory
  const agents = [
    {
      name: "planner",
      triggers: ["plan", "breakdown", "feature planning", "tasks"],
      capabilities: ["task decomposition", "priority ordering", "milestone definition"],
      dependencies: ["task-delegation-basics.md"],
      output_schema: "task_plan.md"
    },
    {
      name: "security-reviewer",
      triggers: ["security", "owasp", "vulnerability", "audit", "auth"],
      capabilities: ["OWASP Top 10 analysis", "auth flow review", "input validation"],
      dependencies: ["owasp-security.md"],
      output_schema: "findings.md"
    },
    {
      name: "code-reviewer",
      triggers: ["review", "quality", "code review", "best practices"],
      capabilities: ["code quality analysis", "anti-pattern detection", "readability"],
      dependencies: ["code-quality.md"],
      output_schema: "findings.md"
    },
    {
      name: "tdd-guide",
      triggers: ["test", "tdd", "spec", "coverage", "unit test"],
      capabilities: ["test case design", "coverage analysis", "TDD cycle"],
      dependencies: ["test-coverage.md"],
      output_schema: "task_plan.md"
    },
    {
      name: "architect",
      triggers: ["architecture", "ADR", "design", "system design", "pattern"],
      capabilities: ["ADR writing", "C4 diagrams", "pattern selection"],
      dependencies: ["architecture-decision-records.md"],
      output_schema: "findings.md"
    },
    {
      name: "refactor-cleaner",
      triggers: ["refactor", "clean", "debt", "simplify", "rename"],
      capabilities: ["dead code removal", "naming improvement", "coupling reduction"],
      dependencies: ["code-quality.md"],
      output_schema: "progress.md"
    },
    {
      name: "build-error-resolver",
      triggers: ["error", "build fail", "stack trace", "exception", "crash"],
      capabilities: ["stack trace analysis", "root cause isolation", "fix strategy"],
      dependencies: ["error-handling.md"],
      output_schema: "findings.md"
    }
  ];

  const agentRegistry = {
    generated_at: new Date().toISOString(),
    total: agents.length,
    agents
  };

  writeFileSync('agents-lock.json', JSON.stringify(agentRegistry, null, 2), 'utf8');
  console.log(`[registry] Built agent registry with ${agents.length} agents → agents-lock.json`);
  return agentRegistry;
}

// Run directly
if (process.argv.includes('registry') || (process.argv[1] && (process.argv[1].endsWith('registry.mjs') || process.argv[1].endsWith('registry')))) {
  buildRegistry();
  buildAgentRegistry();
}
