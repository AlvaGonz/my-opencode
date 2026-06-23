# Skill Readiness Baseline Audit

> Generated: 2026-06-23 (Updated)
> Tool: waza v0.37.0
> Scope: 89 eval suites (85 skills + 4 orphan waza-init suites)

## Summary

| Metric | Value |
|--------|-------|
| Total Skills Registered | 85 |
| With 4-Check Eval Suite | 85 (100%) |
| Coverage Parsing Failures | 0 |
| High Compliance | 12 (14%) |
| Medium Compliance | 22 (26%) |
| Low Compliance | 51 (60%) |
| Passed Schema Validation | 77 (91%) |
| Failed Schema Validation | 8 (9%) |
| Orphan Evals (need deletion) | 4 |

## Compliance Distribution

### High Compliance (12)
architecture, architecture-patterns, code-refactoring-refactor-clean, csharp-async, git-pushing, github, quality-qa, refactor-plan, security-guardrails, security-requirement-extraction, typescript-advanced-types, wcag-audit-patterns, web-design-guidelines, workflow-patterns

### Medium Compliance (22)
agent-memory-systems, animejs-animation, api-design-principles, code-review, composition-patterns, context7, csharp-nunit, csharp-xunit, dotnet-best-practices, dotnet-design-pattern-review, github-issue-creator, groq-autofix, nano-banana-pro-openrouter, red-team-tactics, red-team-tools, sql-optimization-patterns, typespec-create-agent, vite, vitest, web-artifacts-builder, workflow-automation

### Low Compliance (51)
accessibility, architecture-decision-records, backend-dev-guidelines, bash-defensive-patterns, code-refactoring-tech-debt, context, csharp-docs, csharp-mstest, csharp-tunit, design-taste-frontend, dotnet-upgrade, frontend-design, frontend-dev-guidelines, git-advanced-workflows, git-hooks-automation, git-pr-workflows-git-workflow, git-pr-workflows-onboard, git-pr-workflows-pr-enhance, github-actions-templates, github-automation, github-workflow-automation, i18n-localization, mcp-builder, mcp-builder-ms, nodejs-backend-patterns, nodejs-best-practices, opencode-skill-orchestrator, opencode-workflow-engine, owasp-security, planning-with-files, playwright, project-skill-audit, react-best-practices, reference-builder, secrets-management, security, security-audit, seo, smart-router-skill, stitch-ui-design, tailwind-css-patterns, task-management, test-driven-development, typescript-expert, typespec-api-operations, typespec-create-api-plugin, ui-visual-validator, web-coder, web-design-reviewer, workflow-orchestration-patterns

### Skills with Schema Validation Failures (8)
These skills have missing or malformed YAML frontmatter (no `name` or `description`):
- animejs-animation (version is number, not string; missing description)
- api-design-principles (missing description, version is number)
- design-taste-frontend (file too large: 89KB)
- i18n-localization (missing description, version is number)
- red-team-tactics (missing description, version is number)
- red-team-tools (missing description, version is number)
- security (missing description, version is number)
- sql-optimization-patterns (missing description, version is number)

## Verifier Check Types Coverage

| Check Type | Grader | Coverage |
|------------|--------|----------|
| Outcome | `text` regex | 81/85 (95%) |
| Process | `action_sequence` | 81/85 (95%) |
| Style | `prompt` LLM-as-judge | 81/85 (95%) |
| Efficiency | `behavior` | 81/85 (95%) |

> Note: 4 orphan evals (aws-cloud-security, context-manager, vercel-composition-patterns, vercel-react-best-practices) only have `code + text` graders — these were created by `waza init` for skill names that don't match the actual `skills/` directory structure.

## Task Types Per Skill

| Task Type | Count | Coverage |
|-----------|-------|----------|
| Positive Trigger (basic-usage) | 85 | 100% |
| Positive Trigger (edge-case) | 85 | 100% |
| Negative Trigger (should-not-trigger) | 85 | 100% |

## Known Issues

### Fixed
- **`output_schema` removed** — Waza v0.37.0 `prompt` grader does NOT support `output_schema` field (PromptGraderParameters model doesn't have it). Changed to block scalar prompt only. All 85 evals regenerate clean.
- **YAML multiline quotes** — Prompt strings with embedded double quotes (e.g., `"improve accessibility"`) broke YAML parsing. Fixed by switching to YAML block scalar (`|`) for all style_check prompts.
- **`tokens.limit` removed** — the `tokens:` section with `limit:` field was not a valid Waza eval spec parameter; removed.

### Remaining
1. **Fix frontmatter for 8 schema-failed skills** (missing description, invalid version type)
2. **Authenticate `copilot login`** — `waza quality` and `waza run` require GitHub Copilot CLI authentication (blocking LLM-as-judge execution)
3. **Delete 4 orphan evals** — `aws-cloud-security`, `context-manager`, `vercel-composition-patterns`, `vercel-react-best-practices` were created by `waza init` but don't match any skill
4. **Reduce token budgets** for Low-compliance skills (>1000 tokens)
5. **Add trigger sections** to low-compliance skills (`USE FOR:` / `DO NOT USE FOR:`)

## Next Steps

1. Fix frontmatter for 8 schema-failed skills (missing description, invalid version)
2. Reduce token budget for Low-compliance skills (>1000 tokens)
3. Run `waza dev` for interactive compliance improvement on low-scoring skills
4. Consider splitting oversized skills like `design-taste-frontend` (89KB)
5. Add `USE FOR:` and `DO NOT USE FOR:` trigger sections to low-compliance skills
