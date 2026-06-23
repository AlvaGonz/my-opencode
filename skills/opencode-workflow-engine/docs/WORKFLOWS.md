# OpenCode Workflow Engine — Catalog

Designed for the OpenCode agent runtime (opencode.ai). All workflows follow a strict operational model:

**Step 0 — Session Init (@opencode-session-init)**: Every workflow initializes `agents/sessions/<session_id>/task_plan.md` before any action.

**Validation Gates (GATE:)**: Phase transitions require explicit pass/fail checks. Fail → halt immediately.

**Post-Task Hook**: The `opencode-post-task-hook` workflow runs automatically after every task via `run-pipeline.sh`.

## Workflow Catalog

| ID | Name | Category | Trigger | Required Skills |
|----|------|----------|---------|-----------------|
| `opencode-feature-delivery` | Feature Delivery Pipeline | Development | When implementing a new feature end-to-end | `@opencode-session-init` |
| `opencode-ci-autofix` | CI Auto-Heal Loop | CI/CD | CI/CD failure detected on GitHub | `@opencode-session-init`, `@opencode-error-mining`, `@opencode-tdd` |
| `opencode-debug-session` | Debug Session | Debugging | Unexpected error or behavior encountered | `@opencode-session-init` |
| `opencode-boundary-check` | Architecture Boundary Check | Quality | Before refactoring or boundary verification | `@opencode-session-init` |
| `opencode-codebase-audit` | Full Codebase Audit | Quality | Periodic audit of structure, dead code, domains | `@opencode-session-init` |
| `opencode-dead-code-sweep` | Dead Code Sweep | Maintenance | Remove unused files, exports, stale artifacts | `@opencode-session-init` |
| `opencode-frontend-restructure` | Feature-Based Frontend Restructure | Refactoring | Enforce `src/features/<domain>/` structure | `@opencode-session-init` |
| `opencode-backend-restructure` | Domain-Module Backend Restructure | Refactoring | Enforce `server/src/modules/<domain>/` structure | `@opencode-session-init` |
| `opencode-memory-sync` | Cross-Session Memory Sync | Maintenance | Session start or gap > 24h | `@opencode-session-init` |
| `opencode-post-task-hook` | Post-Task Hook Evaluation | CI/CD + QA | Auto-runs after every completed task | `@opencode-session-init` |
| `opencode-coverage-backlog` | Test Coverage Backlog | Quality | Coverage drops or backlog needed | `@opencode-session-init`, `@opencode-coverage-evolution` |
| `opencode-error-digest` | Error Digest | Quality | Recurring error pattern analysis | `@opencode-session-init` |
| `opencode-evolve-prompts` | LOW-FITNESS Prompt Evolution | Maintenance | Underperforming agent skill optimization | `@opencode-session-init` |
| `opencode-evolve-skills` | LOW-FITNESS Skill Evolution | Maintenance | Skills with fitness < 60% | `@opencode-session-init`, `@opencode-skill-fitness` |
| `opencode-security-audit` | Security Audit + CI/CD Integration | Security | Full security review + automated pipeline | `@opencode-session-init`, `@opencode-security-firewall` |
| `opencode-agent-evolution` | AI Agent Evolution Pipeline | Agent | Build or evolve AI agent with ECC + EvoAgentX | `@opencode-session-init`, `@opencode-ecc-research`, `@opencode-evo-fitness` |

## Orchestration Flow

```
OpenCode Session Start
        │
        ▼
@opencode-session-init (Step 0 — mandatory)
        │
        ▼
Workflow Engine selects matching workflow from data/workflows.json
        │
        ▼
Phase 1 → GATE → Phase 2 → GATE → Phase N
        │
        ▼
@opencode-post-task-hook (always last — runs post_task_loop.py)
        │
        ▼
Archivist → evolution_log.md → skills-lock.json rebuild
```

## OpenCode Rules Integration

Every workflow writes its execution constraints to `.opencode/rules/workflow-engine.md` so OpenCode can enforce them natively via its `/rules` system.