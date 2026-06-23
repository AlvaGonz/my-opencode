# Verifier Architecture for the OpenCode Skill System

> Document version: 1.0
> Last updated: 2026-06-23

## Overview

This document describes the production-grade verifier system for every skill in the OpenCode project. Every skill has a self-contained, runnable eval suite that surfaces regressions before any skill edit is merged or deployed.

## Verifier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Verifier Architecture                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐     ┌──────────────────────────────┐  │
│  │   SKILL.md       │     │   evals/<skill>/eval.yaml    │  │
│  │   (Skill Def)    │────▶│   (Evaluation Specification) │  │
│  └──────────────────┘     └──────────┬───────────────────┘  │
│                                      │                       │
│                                      ▼                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │             4 Grader Types (per eval)               │     │
│  │                                                     │     │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────┐  │     │
│  │  │Outcome  │  │Process  │  │ Style   │  │Effic. │  │     │
│  │  │text     │  │action   │  │ prompt  │  │behav. │  │     │
│  │  │regex    │  │sequence │  │LLM-judge│  │limits │  │     │
│  │  └─────────┘  └─────────┘  └─────────┘  └───────┘  │     │
│  └────────────────────────────────────────────────────┘     │
│                                      │                       │
│                                      ▼                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Tasks (3 per skill)                    │     │
│  │  ┌──────────────────┐  ┌──────────────────────────┐ │     │
│  │  │ Positive Trigger  │  │    Negative Trigger      │ │     │
│  │  │ (basic-usage)     │  │    (should-not-trigger)  │ │     │
│  │  │ (edge-case)       │  │                          │ │     │
│  │  └──────────────────┘  └──────────────────────────┘ │     │
│  └────────────────────────────────────────────────────┘     │
│                                      │                       │
│                                      ▼                       │
│  ┌────────────────────────────────────────────────────┐     │
│  │               Output Schema                         │     │
│  │  JSON: { overall_pass, score, checks: [...] }      │     │
│  │  Schema: evals/schemas/rubric.schema.json           │     │
│  └────────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Runner: Waza

[Waza](https://github.com/microsoft/waza) is the primary evaluation runner. It is NOT a custom-built runner — it is Microsoft's open-source AI skill evaluation framework.

### Key Waza Commands

| Command | Purpose |
|---------|---------|
| `waza init <dir> --no-skill` | Initialize project with skills/ and evals/ directories |
| `waza new eval <skill>` | Scaffold eval suite from existing SKILL.md |
| `waza check <skill>` | Readiness check (compliance, tokens, spec) |
| `waza run <eval.yaml>` | Execute evaluation benchmark |
| `waza run --discover --strict` | Run all evals in project |
| `waza quality <skill>` | LLM-as-judge quality scoring |
| `waza coverage --format markdown` | Generate coverage grid |
| `waza tokens compare main --skills --threshold 10` | Token budget regression check |
| `waza cache clear` | Clear cached results |
| `waza suggest <skill> --apply` | Auto-generate missing eval artifacts |

## 4-Check Taxonomy

Every skill eval includes the following four grader types, aligned with the [OpenAI Eval Skills pattern](https://developers.openai.com/blog/eval-skills):

### 1. Outcome Checks (Deterministic)
- **Grader type:** `text` with `regex_match`
- **Purpose:** Did the task complete? Was output produced?
- **Example:** `regex_match: ["(?i)(completed|finished|success|created|implemented)"]`
- **Why deterministic:** Fast, explainable, no LLM cost. Catches obvious failures immediately.

### 2. Process Checks (Deterministic)
- **Grader type:** `action_sequence` with `matching_mode: all_anywhere`
- **Purpose:** Did the skill follow expected steps? Were the right tools invoked?
- **Example:** `expected_actions: ["bash", "read", "write", "edit"]`
- **Why deterministic:** Validates the skill executed its workflow, not just produced output.

### 3. Style Checks (LLM-as-Judge)
- **Grader type:** `prompt` (no `output_schema` — Waza v0.37.0's `PromptGraderParameters` model does not support this field)
- **Purpose:** Does the output match quality conventions?
- **Configuration:** Uses a YAML block scalar (`|`) prompt to avoid quoting issues with embedded double quotes:
  ```yaml
  - type: prompt
    name: style_check
    config:
      prompt: |
        Evaluate if the output matches the expected quality standards for '<skill>': <description>. Assess clarity, correctness, completeness, and adherence to conventions.
  ```
- **Why LLM-as-judge:** Style and convention are inherently qualitative. Deterministic checks can't assess "does this look right?"
- **Known limitation:** The rubric schema (`evals/schemas/rubric.schema.json`) is maintained for documentation and future use but is NOT wired to the Waza prompt grader in v0.37.0. Either a Waza upgrade or a custom grader will be needed to get structured rubric output.

### 4. Efficiency Checks (Deterministic)
- **Grader type:** `behavior` with `max_tool_calls` and `max_duration_ms`
- **Purpose:** Did the skill complete without thrashing? No unnecessary commands?
- **Example:** `max_tool_calls: 30, max_duration_ms: 300000`
- **Why deterministic:** Prevents token bloat and infinite loops. Catches regressions where a skill starts doing unnecessary work.

## Rubric Schema Location

The shared rubric JSON schema lives at:

```
evals/schemas/rubric.schema.json
```

This schema is maintained for documentation and future use but is **not currently wired** to the Waza prompt grader (v0.37.0 Waza does not support `output_schema` in `PromptGraderParameters`). When Waza adds structured output support, re-enable via:

```yaml
- type: prompt
  name: style_check
  config:
    prompt: "..."
    output_schema: schemas/rubric.schema.json  # FUTURE: add when Waza supports this
```

## Task Structure

Each skill has 3 task YAML files under `evals/<skill>/tasks/`:

| File | Type | `should_trigger` |
|------|------|------------------|
| `basic-usage.yaml` | Positive (primary use case) | `true` |
| `edge-case.yaml` | Positive (variation) | `true` |
| `should-not-trigger.yaml` | Negative (false positive guard) | `false` |

### Positive Task Example
```yaml
id: basic-usage-001
name: Basic Usage - Positive Trigger
inputs:
  prompt: "Run an accessibility audit on this form component to check WCAG 2.2 compliance."
expected:
  outcomes:
    - type: task_completed
should_trigger: true
```

### Negative Task Example
```yaml
id: negative-trigger-001
name: Should Not Trigger
inputs:
  prompt: "Add more padding and margin to this container element."
expected:
  outcomes:
    - type: skill_not_invoked
should_trigger: false
```

## How to Add a New Skill with Its Eval

1. Create the skill: `waza new skill <skill-name>`
2. Scaffold the eval: `waza new eval <skill-name>`
3. Customize the task prompts in `evals/<skill>/tasks/`:
   - `basic-usage.yaml` — set prompt to the skill's primary use case
   - `edge-case.yaml` — set prompt to a secondary trigger pattern
   - `should-not-trigger.yaml` — set prompt to an adjacent request that should NOT trigger the skill
4. Verify: `waza check skills/<skill-name>` (target: High compliance)
5. Run: `waza run evals/<skill>/eval.yaml`

## CI Pipeline

Defined in `.github/workflows/eval.yml`. Runs on every PR touching `skills/` or `evals/`:

1. **Skill Readiness Check:** `waza check --strict` on all skills
2. **Evaluation Suite:** `waza run --discover --strict` across all evals
3. **Token Budget:** `waza tokens compare main --skills --threshold 10 --strict`
4. **PR Comment:** Posts structured results using `--format github-comment`
5. **Coverage Report:** `waza coverage --format markdown`

## Known Gotchas

### 1. Waza Caches Results
Waza caches evaluation results to speed up repeated runs. After changing graders, task definitions, or fixture files, clear the cache:
```bash
waza cache clear
```
Caching is **automatically disabled** for non-deterministic graders (`prompt`, `behavior`).

### 2. LLM-as-Judge Graders Are Non-Deterministic
The `prompt` grader uses an LLM to evaluate style quality. Results may vary between runs. This is expected — treat style scores as trends, not absolutes. Waza auto-disables caching for these graders.

### 3. output_schema Not Supported in Waza v0.37.0
The `prompt` grader's `PromptGraderParameters` model does NOT accept an `output_schema` field. All 85 evals use a plain block scalar `prompt:` without `output_schema`. The rubric schema is stored for future use once Waza adds structured output support.

### 4. Prompt Strings with Embedded Quotes Break YAML
When descriptions contain unescaped double quotes (e.g., `"improve accessibility"`), they must NOT appear inside a YAML double-quoted string. Always use block scalars (`|`) for prompt grader text content. This was fixed for all 85 evals.

### 5. Negative Trigger Tests Catch False Positives First
When editing a skill's trigger description, the negative trigger test (`should-not-trigger.yaml`) is the first to catch regressions. Always run negative tests BEFORE positive tests when iterating on trigger phrasing.
**Rule:** Add negative trigger tests before positive tests during skill development.

### 6. Schema Validation Failures
Skills with missing or malformed YAML frontmatter (no `name` or `description`) will fail `waza check` schema validation. These skills are not discoverable by the skill scanner. Fix the frontmatter first, then run evals.

### 7. Mock Executor for CI
All eval suites default to `executor: mock` for CI compatibility (no API keys needed). For local testing with real models, override with:
```bash
waza run evals/<skill>/eval.yaml --executor copilot-sdk
```

### 8. Orphan Evals from waza init
`waza init` creates eval directories for all skill files it finds, including ones whose names don't match the actual `skills/` directory structure. After running `batch-eval-upgrade.mjs`, 4 orphan evals were left with only `code + text` graders:
- `aws-cloud-security` (no matching skill)
- `context-manager` (skill is `context`, not `context-manager`)
- `vercel-composition-patterns` (skill is `composition-patterns`)
- `vercel-react-best-practices` (skill is `react-best-practices`)
Delete these directories to clean up the coverage report.

## Health Criteria

A skill system is healthy when:

| Criterion | Target |
|-----------|--------|
| All skills pass `waza check` | High compliance |
| Coverage report | 100% — every skill has eval.yaml + 2+ grader types |
| CI run output | Structured JSON with `overall_pass`, `score`, per-check notes |
| Pre-merge gate | No skill edit can land without a passing `waza run` on its eval suite |
