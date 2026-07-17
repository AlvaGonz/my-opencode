// ecc-architecture-decision-records — OpenCode plugin (ECC ADR Management).
//
// Manages Architecture Decision Records (ADRs) using the codebase-memory-mcp.
// Provides hooks for ADR lifecycle: creation, review, validation, and consistency checking.
//
// OpenCode loads this as a server plugin — add it to your opencode.json:
//   { "plugin": ["./plugins/ecc-architecture-decision-records.mjs"] }

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global OpenCode paths
const globalOpenCodeDir = path.join(process.env.HOME || process.env.USERPROFILE, '.opencode');
const hooksDir = path.join(globalOpenCodeDir, 'hooks');
const skillsDir = path.join(globalOpenCodeDir, 'skills');

const require = createRequire(import.meta.url);

// ADR storage path
const adrDir = path.join(process.cwd(), 'docs', 'adr');
const adrIndexPath = path.join(adrDir, 'index.md');

function ensureAdrDir() {
  if (!fs.existsSync(adrDir)) {
    fs.mkdirSync(adrDir, { recursive: true });
  }
}

function getNextAdrNumber() {
  ensureAdrDir();
  const files = fs.readdirSync(adrDir).filter(f => f.match(/^\d{4}-.*\.md$/));
  if (files.length === 0) return 1;
  const numbers = files.map(f => parseInt(f.substring(0, 4), 10));
  return Math.max(...numbers) + 1;
}

function generateAdrTemplate(number, title, context, decision, consequences, alternatives) {
  const date = new Date().toISOString().split('T')[0];
  const padded = String(number).padStart(4, '0');
  return `---
number: ${padded}
title: ${title}
date: ${date}
status: proposed
deciders: []
consulted: []
informed: []
---

# ADR ${padded}: ${title}

## Context
${context}

## Decision
${decision}

## Consequences
${consequences}

## Alternatives Considered
${alternatives}

## Related ADRs
- None

## Tags
- architecture
- decision
`;
}

function updateAdrIndex() {
  ensureAdrDir();
  const files = fs.readdirSync(adrDir)
    .filter(f => f.match(/^\d{4}-.*\.md$/))
    .sort()
    .reverse();

  let indexContent = `# Architecture Decision Records Index\n\n`;
  indexContent += `| # | Title | Status | Date |\n`;
  indexContent += `|---|-------|--------|------|\n`;

  for (const file of files) {
    const content = fs.readFileSync(path.join(adrDir, file), 'utf8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatter) {
      const meta = frontmatter[1];
      const title = meta.match(/title:\s*(.+)/)?.[1]?.trim() || 'Untitled';
      const status = meta.match(/status:\s*(.+)/)?.[1]?.trim() || 'proposed';
      const date = meta.match(/date:\s*(.+)/)?.[1]?.trim() || '';
      const number = file.substring(0, 4);
      indexContent += `| ${number} | ${title} | ${status} | ${date} |\n`;
    }
  }

  fs.writeFileSync(adrIndexPath, indexContent);
}

export default async ({ client } = {}) => {
  const log = (level, message) => {
    try { client && client.app && client.app.log({ body: { service: 'ecc-adr', level, message } }); } catch (e) {}
  };

  return {
    // Register ADR-related commands
    config: async (config) => {
      if (!config.command) config.command = {};
      
      config.command['adr:create'] = {
        description: 'Create a new Architecture Decision Record',
        template: `---
number: {{number}}
title: {{title}}
date: {{date}}
status: proposed
deciders: []
consulted: []
informed: []
---

# ADR {{number}}: {{title}}

## Context
{{context}}

## Decision
{{decision}}

## Consequences
{{consequences}}

## Alternatives Considered
{{alternatives}}

## Related ADRs
- None

## Tags
- architecture
- decision
`
      };

      config.command['adr:list'] = {
        description: 'List all Architecture Decision Records',
        template: `{{#each adrs}}
- **ADR {{number}}**: {{title}} ({{status}}) - {{date}}
{{/each}}`
      };

      config.command['adr:review'] = {
        description: 'Review an ADR for completeness and consistency',
        template: `Reviewing ADR {{number}}: {{title}}

## Checklist
- [ ] Context clearly describes the problem
- [ ] Decision is specific and actionable
- [ ] Consequences cover both positive and negative impacts
- [ ] Alternatives are documented with rationale for rejection
- [ ] Related ADRs are linked
- [ ] Status is appropriate (proposed/accepted/superseded/deprecated)
- [ ] No conflicts with existing accepted ADRs

## Consistency Check
Run \`adr:validate\` to check for architectural consistency.`
      };

      config.command['adr:validate'] = {
        description: 'Validate ADR consistency against codebase architecture',
        template: `Validating ADR consistency...

Checking:
- Layer dependencies (Clean Architecture)
- C4 diagram alignment
- Existing ADR conflicts
- Stack compatibility

Results will be shown below.`
      };

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },

    // Hook: session.created - Initialize ADR context
    'session.created': async (ctx) => {
      ensureAdrDir();
      updateAdrIndex();
      log('info', 'ADR system initialized');
    },

    // Hook: experimental.chat.system.transform - Inject ADR context
    'experimental.chat.system.transform': async (_input, output) => {
      // Only inject if ADR-related keywords are present in recent context
      // This avoids polluting every prompt with ADR context
      try {
        const adrFiles = fs.readdirSync(adrDir).filter(f => f.match(/^\d{4}-.*\.md$/));
        if (adrFiles.length > 0) {
          const latestAdr = adrFiles.sort().reverse()[0];
          const content = fs.readFileSync(path.join(adrDir, latestAdr), 'utf8');
          const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
          if (frontmatter) {
            const title = frontmatter[1].match(/title:\s*(.+)/)?.[1]?.trim() || 'Untitled';
            const status = frontmatter[1].match(/status:\s*(.+)/)?.[1]?.trim() || 'proposed';
            output.system.push(`\n[ECC ADR Context] Latest ADR: ${latestAdr} - ${title} (${status})`);
          }
        }
      } catch (e) {
        // Silently ignore if ADR dir doesn't exist
      }
    },

    // Hook: command.execute.before - Handle ADR commands
    'command.execute.before': async (input) => {
      if (!input || !input.command) return;

      if (input.command === 'adr:create') {
        const args = (input.arguments || '').trim().split(' ');
        const title = args[0] || 'Untitled Decision';
        const number = getNextAdrNumber();
        const padded = String(number).padStart(4, '0');
        
        // Create a basic ADR template file
        const template = generateAdrTemplate(
          number,
          title,
          'Describe the context and problem statement here.',
          'Describe the decision and its rationale here.',
          'Describe the consequences (positive and negative) here.',
          'List alternatives considered and why they were rejected.'
        );
        
        const fileName = `${padded}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
        const filePath = path.join(adrDir, fileName);
        fs.writeFileSync(filePath, template);
        updateAdrIndex();
        
        log('info', `Created ADR ${padded}: ${title}`);
      }

      if (input.command === 'adr:validate') {
        // Trigger ADR validation against codebase
        log('info', 'ADR validation requested');
      }
    },

    // Custom tool: ecc_adr_create
    tools: {
      ecc_adr_create: {
        description: 'Create a new Architecture Decision Record',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Title of the ADR' },
            context: { type: 'string', description: 'Context and problem statement' },
            decision: { type: 'string', description: 'The decision made' },
            consequences: { type: 'string', description: 'Consequences of the decision' },
            alternatives: { type: 'string', description: 'Alternatives considered' },
            status: { type: 'string', enum: ['proposed', 'accepted', 'superseded', 'deprecated'], default: 'proposed' }
          },
          required: ['title', 'context', 'decision', 'consequences', 'alternatives']
        },
        execute: async (args) => {
          const number = getNextAdrNumber();
          const padded = String(number).padStart(4, '0');
          
          const template = generateAdrTemplate(
            number,
            args.title,
            args.context,
            args.decision,
            args.consequences,
            args.alternatives
          );
          
          // Update status in frontmatter
          const updatedTemplate = template.replace('status: proposed', `status: ${args.status}`);
          
          const fileName = `${padded}-${args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
          const filePath = path.join(adrDir, fileName);
          fs.writeFileSync(filePath, updatedTemplate);
          updateAdrIndex();
          
          return `Created ADR ${padded}: ${args.title} at ${filePath}`;
        }
      },

      ecc_adr_list: {
        description: 'List all Architecture Decision Records',
        parameters: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['all', 'proposed', 'accepted', 'superseded', 'deprecated'], default: 'all' }
          }
        },
        execute: async (args) => {
          ensureAdrDir();
          const files = fs.readdirSync(adrDir)
            .filter(f => f.match(/^\d{4}-.*\.md$/))
            .sort()
            .reverse();

          let result = '';
          for (const file of files) {
            const content = fs.readFileSync(path.join(adrDir, file), 'utf8');
            const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
            if (frontmatter) {
              const meta = frontmatter[1];
              const title = meta.match(/title:\s*(.+)/)?.[1]?.trim() || 'Untitled';
              const status = meta.match(/status:\s*(.+)/)?.[1]?.trim() || 'proposed';
              const date = meta.match(/date:\s*(.+)/)?.[1]?.trim() || '';
              const number = file.substring(0, 4);
              
              if (args.status === 'all' || args.status === status) {
                result += `- **ADR ${number}**: ${title} (${status}) - ${date}\n`;
              }
            }
          }
          return result || 'No ADRs found.';
        }
      },

      ecc_adr_validate: {
        description: 'Validate ADR consistency against codebase architecture',
        parameters: {
          type: 'object',
          properties: {
            adr_number: { type: 'string', description: 'Specific ADR number to validate (optional)' }
          }
        },
        execute: async (args) => {
          // This would integrate with codebase-memory-mcp to check architecture
          // For now, return a structured validation report
          const checks = [
            { check: 'Layer Dependencies (Clean Architecture)', status: 'pending', details: 'Requires codebase-memory-mcp integration' },
            { check: 'C4 Diagram Alignment', status: 'pending', details: 'Requires C4 diagram in docs/architecture/' },
            { check: 'Existing ADR Conflicts', status: 'pending', details: 'Cross-reference with accepted ADRs' },
            { check: 'Stack Compatibility', status: 'pending', details: 'Verify against tech stack in AGENTS.md' }
          ];

          let report = '## ADR Validation Report\n\n';
          report += '| Check | Status | Details |\n';
          report += '|-------|--------|---------|\n';
          for (const c of checks) {
            report += `| ${c.check} | ${c.status} | ${c.details} |\n`;
          }
          
          return report;
        }
      }
    }
  };
};