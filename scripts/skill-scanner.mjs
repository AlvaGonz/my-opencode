// scripts/skill-scanner.mjs
// Scans skills/ directory for SKILL.md files, validates schema, sanitizes content
// SECURITY: Truncates all string fields to prevent prompt injection + context bloat
import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import { CircuitBreaker } from './circuit-breaker.mjs';

const SKILL_DIRS = ['skills'];
const MAX_DESC_CHARS = 200;      // Anti-injection + context bloat guard
const MAX_NAME_CHARS = 64;
const ALLOWED_NAME_PATTERN = /^[a-z0-9-_]+$/i; // No special chars in skill names

// ── Strict Zod schema for SKILL.md frontmatter ──────────────────────────────
const SkillFrontmatterSchema = z.object({
  name: z
    .string()
    .max(MAX_NAME_CHARS, 'Skill name exceeds 64 chars')
    .regex(ALLOWED_NAME_PATTERN, 'Skill name must be alphanumeric, dashes, underscores only'),
  description: z
    .string()
    .max(MAX_DESC_CHARS * 5, 'Raw description too long — likely injection attempt')
    .transform((v) => v.slice(0, MAX_DESC_CHARS).replace(/[<>{}]/g, '')), // Sanitize + truncate
  version: z
    .string()
    .regex(/^\d+\.\d+(\.\d+)?$/, 'Version must be semver format: X.Y or X.Y.Z')
    .optional()
    .default('1.0'),
  agents: z
    .array(z.string().max(64))
    .optional()
    .default([]),
});

/** @typedef {{ name: string, description: string, version: string, agents: string[], sourcePath: string }} SkillEntry */

/**
 * Scans the skills directory and returns validated, sanitized skill entries.
 * Malformed or suspicious SKILL.md files are discarded with a warning — never thrown.
 * @returns {SkillEntry[]}
 */
export function scanSkills() {
  const cb = new CircuitBreaker('skill-scanner');
  const validSkills = [];
  const discarded = [];
  const seenNames = new Set();

  for (const skillsDir of SKILL_DIRS) {
    if (!existsSync(skillsDir)) {
      console.warn(`[skill-scanner] Skills directory not found: ${skillsDir}`);
      continue;
    }

    const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    for (const dir of skillDirs) {
      if (seenNames.has(dir)) continue; // Deduplicate: first-found wins
      seenNames.add(dir);

      cb.increment(`Scanning skill: ${dir}`);
      
      const skillFilePath = join(skillsDir, dir, 'SKILL.md');
      
      if (!existsSync(skillFilePath)) {
        console.warn(`[skill-scanner] No SKILL.md in ${dir} — skipping`);
        cb.reset();
        continue;
      }

      try {
        const raw = readFileSync(skillFilePath, 'utf8');

      // SECURITY CHECK 1: File size guard (>50KB = likely injection or bloat)
      if (raw.length > 50_000) {
        console.warn(`[skill-scanner] DISCARDED ${dir}: File too large (${raw.length} bytes). Possible injection.`);
        discarded.push({ dir, reason: 'file_too_large' });
        cb.reset();
        continue;
      }

      const { data: frontmatter } = matter(raw);

      // SECURITY CHECK 2: Strict schema validation
      const parsed = SkillFrontmatterSchema.safeParse(frontmatter);
      
      if (!parsed.success) {
        const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        console.warn(`[skill-scanner] DISCARDED ${dir}: Schema validation failed — ${issues}`);
        discarded.push({ dir, reason: 'schema_invalid', issues });
        cb.reset();
        continue;
      }

      validSkills.push({
        ...parsed.data,
        sourcePath: skillFilePath,
      });

      cb.reset();
    } catch (err) {
      if (err.message.includes('CircuitBreaker')) throw err; // Hard stop
      console.warn(`[skill-scanner] DISCARDED ${dir}: Read error — ${err.message}`);
      discarded.push({ dir, reason: 'read_error', error: err.message });
    }
  }

  console.log(`[skill-scanner] Valid: ${validSkills.length} | Discarded: ${discarded.length}`);
  if (discarded.length > 0) {
    console.warn('[skill-scanner] Discarded skills:', JSON.stringify(discarded, null, 2));
  }

  return validSkills;
  }
}

// Run directly: node scripts/skill-scanner.mjs
if (process.argv[1] && (process.argv[1].endsWith('skill-scanner.mjs') || process.argv[1].endsWith('skill-scanner'))) {
  scanSkills();
}
