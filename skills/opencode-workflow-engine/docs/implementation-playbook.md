# OpenCode Workflow Engine — Implementation Playbook

This document defines the execution contract for every workflow run inside the OpenCode agent runtime (opencode.ai).

## OpenCode Runtime Notes

- **Skills** live in agents/skills/<skill-name>/SKILL.md
- **Rules** live in .opencode/rules/<rule-name>.md — loaded natively by OpenCode at session start
- **\** provides global shared data accessible across all sessions
- **Session state**: agents/sessions/<session_id>/ — task_plan.md, findings.md, progress.md, evolution_log.md

## Execution Contract

For every workflow:

1. Confirm objective and scope.
2. Select the best-matching workflow from data/workflows.json.
3. Execute workflow phases in order — never skip, never re-execute completed phases.
4. Produce one concrete artifact per phase.
5. Validate before continuing (GATE check).

## Phase Artifact Examples

| Phase | Expected Artifact |
|-------|-------------------|
| Session Init | agents/sessions/<id>/task_plan.md created |
| Spec Generation | SPEC.md with Mermaid diagram |
| Agent Prompt | Markdown prompt block ready for OpenCode |
| Security Audit | AUDIT.md + reviewdog.json |
| Post-Task Hook | evolution_log.md + updated skills-lock.json |
| Commit | Git commit with conventional message |

## Safety Guardrails

- Never run destructive actions without explicit user approval.
- If a required skill is missing, state the gap and fall back to the closest available skill. Mark phase as MANUAL.
- Security testing requires explicit authorization.
- All LLM calls are wrapped in CircuitBreaker(MAX_RETRIES=3).
- DenialOfWalletGuard limits to MAX_CALLS_PER_RUN=26.

## OpenCode Rules Sync

Before the first phase, verify .opencode/rules/workflow-engine.md exists. If not, create it with:

`	ext
# Workflow Engine Rules
- Always initialize session files before any task.
- Always run @opencode-post-task-hook after every completed task.
- Never skip validation gates.
- All HIGH severity issues must be addressed before commit.
`

## Workflow Completion Format

Return at the end of every workflow:

- ✅ Completed phases
- 📄 Artifacts produced
- 🔬 Validation evidence
- ⚠️ Open risks
- ➡️ Suggested next action
