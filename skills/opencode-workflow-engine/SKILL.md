---
name: opencode-workflow-engine
description: "Orchestrate OpenCode sessions through guided multi-phase workflows: feature delivery, security audits, AI agent evolution, CI healing, and post-task hooks."
version: "3.0"
risk: none
source: self
date_added: "2026-06-23"
agents:
  - opencode
---

# OpenCode Workflow Engine

This skill turns any complex objective into a state-machine-driven sequence of OpenCode tool invocations, enforcing validation gates, idempotent execution, and mandatory post-task evaluation at the end of every session.

## OpenCode Integration

This skill is designed for the OpenCode agent runtime (opencode.ai). It leverages:

- **/rules** — project-level instruction files stored in `.opencode/rules/*.md` (replaces `.cursorrules`)
- **$OPENCODE_SHARE_DIR** — global shared skill data across sessions
- **Session memory** — `agents/sessions/<session_id>/` for per-session state
- **MCP tools** — declared per workflow phase under `requires_mcps`

## When to Use This Skill

Activate this skill when:

- The task spans multiple phases (plan → build → test → ship).
- The user asks for a best-practice guided execution for:
  - Shipping a feature end-to-end
  - Running a security audit with CI integration
  - Building or evolving an AI agent system
  - E2E browser automation and QA
  - Domain-driven design scaffolding
- A post-task evaluation is required after OpenCode completes a task.

## Workflow Source of Truth

Read in this order:

1. `docs/WORKFLOWS.md` — human-readable playbooks.
2. `data/workflows.json` — machine-readable workflow metadata and phase registry.

## How to Run This Skill

1. Identify the user's concrete outcome.
2. Propose the 1–2 best matching workflows from `data/workflows.json`.
3. Ask the user to choose one.
4. Execute step-by-step:
   - Announce the current phase and expected artifact.
   - Invoke the recommended skills for that phase.
   - Verify completion criteria before moving to the next phase.
5. At the end, provide:
   - Completed artifacts
   - Validation evidence
   - Remaining risks and next actions
6. **Telemetry**: On completion or failure, read `agents/templates/workflow_execution_report.md`, populate YAML metrics, and save to `agents/sessions/<session_id>/workflow_execution_report.md`.

## Execution Rules (Resumability & Idempotency)

The engine operates as a state machine — never restarts from scratch:

- **State Assessment**: Before any run, read `agents/sessions/<session_id>/task_plan.md` to audit completed phases.
- **Resumable Execution**: If a prior run was interrupted, resume from the exact failed phase. Never re-execute completed steps.
- **Idempotency (Check-Before-Act)**: Before writing a file or running a command, verify the expected output doesn't already exist. If it does, skip and proceed.

## Dynamic Workflow Generation

If the user's task doesn't match any workflow in `data/workflows.json`, activate the **Dynamic Workflow Synthesis Engine**:

1. **Match First**: Check `data/workflows.json` for an existing match.
2. **If No Match — Synthesize**:
   a. **Discover skills**: Run `node agents/skills/opencode-workflow-engine/scripts/scanner.mjs` to list all verified installed skills.
   b. **Decompose**: Break the objective into logical phases (Plan → Design → Build → Verify → Ship).
   c. **Assign skills**: Match each phase to a discovered skill. If none exists, mark phase as `MANUAL`.
   d. **Step 0 is mandatory**: Every synthesized workflow starts with `Step 0: Initialize Session Files (@opencode-session-init)`.
   e. **Validation Gates**: Every phase transition requires a `GATE:` check. Fail → halt, report, do NOT proceed.
   f. **MCP declarations**: Every phase that touches external state MUST declare `Required MCP Tool`.
   g. **Materialize**: Write `agents/workflows/<id>.md`, append to `data/workflows.json`, document in `docs/WORKFLOWS.md`.
3. **Execute** the newly synthesized workflow from Step 0.

## Default Workflow Routing

| Intent | Workflow ID |
|--------|-------------|
| New feature delivery | `opencode-feature-delivery` |
| Security review | `opencode-security-audit` |
| AI agent build/evolve | `opencode-agent-evolution` |
| E2E / browser testing | `opencode-qa-automation` |
| Domain-driven design | `opencode-ddd-scaffold` |
| Post-task evaluation | `opencode-post-task-hook` |
| CI failure healing | `opencode-ci-autofix` |

## Copy-Paste Prompts for OpenCode

```text
Use @opencode-workflow-engine to run the "Feature Delivery" workflow for my task.
```

```text
Use @opencode-workflow-engine to execute a full "Security Audit" workflow.
```

```text
Use @opencode-workflow-engine to guide the "Agent Evolution" workflow with post-task hooks.
```

```text
Use @opencode-workflow-engine to run the "Post-Task Hook Evaluation" after this session.
```

## Guardrails

- **Anti-Loop (DAG Enforcement)**: Workflows MUST NOT delegate back to the orchestrator. Execution is strictly downward: Orchestrator → Workflow → Atomic Skill. A failed phase triggers a manual fallback report — never a recursive call.
- **OpenCode Rules Sync**: On first run, verify `.opencode/rules/workflow-engine.md` exists. If not, create it with the active workflow's execution constraints as a `/rules` file.
- **CircuitBreaker**: All external tool calls (LLM, MCP, scripts) are wrapped in CircuitBreaker with `MAX_RETRIES=3`.

## Related Skills

- `opencode-session-init`
- `opencode-post-task-loop`
- `opencode-ecc-research`
- `opencode-evo-fitness`
- `opencode-security-firewall`
- `opencode-planning-files`