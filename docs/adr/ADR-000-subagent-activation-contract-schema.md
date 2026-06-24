# ADR-000 — ECC Subagent Activation Contract Schema

## Status: Accepted

## Context
The OpenCode agent OS has 7 specialized subagents (planner, architect, security-reviewer, tdd-guide, code-reviewer, refactor-cleaner, build-error-resolver) that need a consistent, machine-parseable contract format. Without a standardized schema, the registry scanner cannot dynamically extract trigger conditions, blocking behavior, and approval requirements from subagent files.

## Decision
All subagent `.md` files in `agents/subagents/` MUST follow this exact schema:

```markdown
# [Name] — [Short Description]

## ACTIVATION CONTRACT
Trigger keywords: [comma-separated list]
Invoked by: [who calls this agent and when]
Blocks: [yes/no — does this agent block the workflow?]
Approval gate required: [yes/no — does this need scripts/approval-gate.mjs?]
circuit-breaker threshold: [N] failures before tripping

## ROLE & SCOPE
[What this agent does and does NOT do]

## INPUT SCHEMA
[Structured inputs expected from openagent.md]

## EXECUTION STEPS
[Numbered list of concrete actions]

## OUTPUT CONTRACT
Returns to openagent.md:
  - status: "success" | "needs_review" | "blocked"
  - findings: Finding[]
  - recommendation: string
  - requires_approval: boolean

## INTEGRATION HOOKS
On success → [next step]
On needs_review → [next step]
On blocked → [next step]

## CONSTRAINTS
[Hard rules that cannot be violated]
```

The `scripts/registry.mjs` `buildAgentRegistry()` function dynamically scans all `.md` files in `agents/subagents/` and parses the `## ACTIVATION CONTRACT` section to extract:
- Trigger keywords → used for routing by openagent.md
- Blocks flag → determines workflow blocking behavior
- Approval gate flag → determines if `scripts/approval-gate.mjs` is called
- Circuit-breaker threshold → configures `scripts/circuit-breaker.mjs`

## Consequences
**Gains:**
- Self-documenting subagents: the contract IS the documentation
- Dynamic registry: adding a new subagent only requires creating a `.md` file — no manual registry updates
- Machine-parseable: regex extraction is deterministic and testable
- Consistent handoff protocol: all subagents return the same output structure

**Trade-offs:**
- Schema is rigid — subagents with non-standard workflows need to fit the template
- Regex parsing is fragile — typos in section headers will cause silent failures
- No runtime validation — the schema is enforced by convention, not by code

## Alternatives Rejected
1. **YAML frontmatter only**: Used by ECC's original format (e.g., planner.md had YAML front matter). Rejected because YAML frontmatter does not support structured multi-field contracts (triggers, blocks, approval) without becoming unwieldy.
2. **JSON schema files alongside .md**: Would require maintaining two files per subagent. Rejected for violating DRY and increasing maintenance burden.
3. **Hardcoded registry in registry.mjs**: The previous approach. Rejected because it requires manual updates every time a subagent is added or modified.

## References
- `agents/core/openagent.md` — the orchestrator that consumes the registry
- `scripts/registry.mjs` — the dynamic scanner implementation
- `scripts/approval-gate.mjs` — the approval mechanism referenced in contracts
- `scripts/circuit-breaker.mjs` — the failure threshold mechanism
- Gap 5 implementation plan
