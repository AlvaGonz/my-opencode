---
name: opencode-skill-orchestrator
description: "A meta-skill that dynamically discovers available skills from local and global directories, evaluates task complexity, selects the optimal skill combination via structured Tool Calling, and tracks decisions using planning-with-files."
category: meta
risk: safe
source: community
tags: "[orchestration, meta-skill, dynamic-discovery, tool-calling, opencode]"
date_added: "2026-06-23"
---

# opencode-skill-orchestrator

## Overview

The opencode-skill-orchestrator is a meta-skill designed to enhance the AI agent's ability to tackle complex problems within the OpenCode runtime. It acts as an intelligent coordinator that:

1. **Dynamically discovers** all available skills from the local workspace (agents/skills/) and OpenCode skill directories by scanning SKILL.md frontmatter metadata — no manual index required.
2. **Evaluates task complexity** to prevent over-engineering simple requests.
3. **Selects the optimal skill** using a structured Tool Calling pattern with a constrained skill_name enum, preventing hallucinated skill references.
4. **Tracks successful combinations** using OpenCode session memory (agents/sessions/<session_id>/).
5. **Falls back to the remote catalog** when local discovery is insufficient.

## OpenCode Integration

This skill is designed for the OpenCode agent runtime (opencode.ai). It leverages:

- **/rules** — project-level instruction files stored in .opencode/rules/*.md
- **\** — global shared skill data across sessions
- **Session memory** — agents/sessions/<session_id>/ for per-session state tracking
- **MCP tools** — declared per skill combination under equires_mcps

## When to Use This Skill

- Use when tackling a complex, multi-step problem that likely requires multiple domains of expertise.
- Use when you are unsure which specific skills are best suited for a given user request.
- Use when the user explicitly asks to "orchestrate", "combine skills", or "use the best tools for the job" on a significant task.
- Use when you want to look up previously successful combinations of skills for a specific type of problem.

## Core Concepts

### Task Evaluation Guardrails

Not every task requires a specialized skill. For straightforward issues (e.g., small CSS fixes, simple script writing, renaming a variable), **DO NOT USE** specialized skills. Over-engineering simple tasks wastes tokens and time.

Additionally, the orchestrator is strictly forbidden from creating new skills. Its sole purpose is to combine and use existing skills provided by the community or present in the current environment.

Before invoking any skills, evaluate the task:
1. **Is the task simple/contained?** Solve it directly using the agent's ordinary file editing, search, and terminal capabilities.
2. **Is the task complex/multi-domain?** Only then should you proceed to orchestrate skills.

### Multi-Phase Delegation Rule

If the task meets ALL of these criteria:
1. Requires **3+ sequential phases** (e.g., Plan → Build → Test → Deploy)
2. Spans multiple domains or skill categories
3. Would require invoking 3+ individual skills in sequence

Then **DO NOT** attempt to orchestrate individual skills. Instead:
- Invoke @opencode-workflow-engine and pass the user's full objective to it.
- Let the workflow engine handle phase decomposition, skill selection per phase, validation gates, and session tracking.

The @opencode-workflow-engine skill is the **highest-level operational manager** in the OpenCode hierarchy:

`
┌──────────────────────────────────────────┐
│    @opencode-workflow-engine             │ ← Multi-phase pipelines
│    (Workflow Engine)                     │
├──────────────────────────────────────────┤
│   @opencode-skill-orchestrator           │ ← Single-phase skill combos
│   (Skill Combiner)                       │
├──────────────────────────────────────────┤
│   Individual Skills                      │ ← Atomic capabilities
│   (@opencode-session-init, etc.)         │
└──────────────────────────────────────────┘
`

### Strict Anti-Loop Guardrail (Mandatory)

To prevent infinite, non-terminating circular execution loops between meta-skills, you MUST enforce a strict Directed Acyclic Graph (DAG) for agent execution:

1. The **Orchestrator** is permitted to delegate complex, multi-phase tasks downwards to the **Workflows** engine.
2. **Workflows** executes and runs atomic, domain-specific **Skills**.
3. **CRITICAL (Anti-Loop Rule)**: A Workflow is strictly forbidden from delegating tasks back upwards to the Orchestrator, either directly or through recursive invocation. Once execution transfers to a Workflow, control flow MUST only move downwards to atomic skills. If a workflow phase fails, the executing agent must report it or trigger manual fallback, but under no circumstances should it call @opencode-skill-orchestrator to resolve a sub-step.

### Dynamic Skill Discovery (SkillScanner)

The orchestrator uses a runtime SkillScanner module (scripts/scanner.mjs) to discover skills at execution time. The scanner:

- Reads **two directories** in parallel:
  - **Local workspace:** agents/skills/
  - **OpenCode skills:** <opencode-dir>/skills/
- Extracts only YAML frontmatter metadata from each SKILL.md (name, description, category, tags)
- **Never reads the full skill body** — keeping token consumption near zero
- Deduplicates by name — **local skills override global skills** (workspace customization pattern)
- Gracefully skips directories with no SKILL.md or invalid frontmatter without crashing

### Structured Tool Calling for Skill Selection

Instead of free-text skill selection, the orchestrator uses a DynamicSkillRegistry (scripts/registry.mjs) that produces a formal Tool Calling schema:

`json
{
  "tool_schema": {
    "name": "invoke_skill",
    "parameters": {
      "properties": {
        "skill_name": { "type": "string", "enum": ["skill-a", "skill-b", "..."] },
        "reason": { "type": "string" }
      },
      "required": ["skill_name", "reason"]
    }
  },
  "skill_descriptions": {
    "skill-a": "Description of skill A...",
    "skill-b": "Description of skill B..."
  }
}
`

This ensures the LLM can only select from **actually discovered skills**, eliminating hallucinated skill references.

### OpenCode Session Memory Tracking

The orchestrator fuses with OpenCode's native session memory system:

- agents/sessions/<session_id>/task_plan.md — Phase tracking and decisions
- agents/sessions/<session_id>/findings.md — Research discoveries and skill evaluation notes
- agents/sessions/<session_id>/progress.md — Session log and execution results

### Remote Catalog Fallback

When local and global discovery is insufficient, the orchestrator can fetch the master skill catalog from a remote URL.

**Important:** The remote catalog is a **supplement**, not a replacement. Always prefer locally available skills first.

## Step-by-Step Guide

### Step 0: Discover Available Skills

[Triggered at the start of any orchestration request]

1. Run the SkillScanner to discover all available skills:
   `ash
   node <orchestrator-dir>/scripts/scanner.mjs --pretty
   `
2. If you need the full Tool Calling schema with enum constraints:
   `ash
   node <orchestrator-dir>/scripts/registry.mjs --inline
   `
3. The scanner outputs a JSON array of { name, description, source, path } objects.
4. Review the output to understand your available toolbox before making any selection.

### Step 0.5: Discover Active MCPs (Mandatory)

Before evaluating task complexity or selecting any skill, the orchestrator MUST explicitly query the current system environment for active Model Context Protocol (MCP) servers and tools.
1. Review all loaded server connections (e.g., github-mcp-server, context7-mcp, mssql).
2. Map the active MCP capability namespaces to the required capability domains of the task.
3. **Strict Warning Gate**: If a capability domain required for a task lacks an active, responsive MCP connection, the agent MUST immediately raise a warning block to the user detailing the missing server before selecting or executing any skill.

### Step 1: Task Evaluation & Guardrail Check

[Triggered when facing a new user request]

1. Read the user's request.
2. Ask yourself: "Can I solve this efficiently with just basic file editing and terminal commands?"
3. If **YES**: Proceed without invoking specialized skills. Stop the orchestration here.
4. If **NO**: Proceed to Step 2.

### Step 2: Retrieve Past Knowledge

[Triggered if the task is complex]

**From OpenCode session memory:**
1. Check agents/sessions/<session_id>/findings.md for prior skill evaluation notes relevant to this task domain.
2. Check agents/sessions/<session_id>/task_plan.md for any in-progress related work.

### Step 3: Select Skill via Structured Tool Calling

[Triggered if no past knowledge covers this task]

1. Analyze the core requirements.
2. Cross-reference against the discovered skill registry from Step 0.
3. **Select the skill(s)** using the structured invoke_skill tool with skill_name constrained to the discovered enum.
4. **If local skills are insufficient**, fetch the master catalog from a remote source.
5. Select the **minimal set** of skills needed. **Do not over-select.**

### Step 4: Execute the Selected Skill

[Triggered after skill selection]

1. Read the full SKILL.md of the selected skill using the path provided by the scanner output.
2. Follow the skill's instructions exactly as documented.
3. If multiple skills are needed, execute them in logical dependency order.

### Step 5: Track the Combination

[Triggered after executing the task using selected skills]

**Update OpenCode session memory:**
- Append to agents/sessions/<session_id>/findings.md with skill evaluation notes and outcomes.
- Update agents/sessions/<session_id>/progress.md with session execution log.

## Examples

### Example 1: Handling a Simple Task (The Guardrail in Action)

**User Request:** "Change the color of the submit button in index.css to blue."
**Action:** The skill orchestrator evaluates the task. It determines this is a "simple/contained" task. It **does not** invoke specialized skills. It directly edits index.css.

### Example 2: Dynamic Discovery & Selection

**User Request:** "Refactor our React dashboard to follow performance best practices and add proper testing."
**Action:**
1. Run scanner.mjs → discovers opencode-session-init, opencode-tdd, etc.
2. Evaluate: Complex multi-domain task → proceed.
3. Select via structured tool call.
4. Execute each skill's SKILL.md instructions in order.
5. Track the combination in OpenCode session memory.

### Example 3: Delegating to Workflow Engine

**User Request:** "Build me a complete feature with testing and deployment pipeline."
**Action:**
1. Run scanner.mjs → discovers available skills.
2. Evaluate: Requires 3+ sequential phases → delegate to @opencode-workflow-engine.
3. Pass the full objective to the workflow engine.
4. Workflow engine handles phase decomposition and validation gates.

## Best Practices

- ✅ **Do:** Always run the scanner first to know your available toolbox.
- ✅ **Do:** Always evaluate task complexity *before* looking for skills.
- ✅ **Do:** Use the structured invoke_skill pattern — never free-text skill references.
- ✅ **Do:** Keep the number of orchestrated skills as small as possible.
- ✅ **Do:** Update session memory files after significant discoveries or task completions.
- ❌ **Don't:** Use this skill for simple bug fixes or UI tweaks.
- ❌ **Don't:** Combine skills that have overlapping and conflicting instructions without a clear plan.
- ❌ **Don't:** Attempt to construct, generate, or create new skills. Only combine what is available.
- ❌ **Don't:** Read the full body of all SKILL.md files during discovery — only read the selected skill.

## Architecture

`
┌─────────────────────────────────────────────────┐
│         opencode-skill-orchestrator              │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌───────────────┐    ┌─────────────────────┐   │
│  │ scanner.mjs   │───▶│  registry.mjs       │   │
│  │ (FS Discovery)│    │  (Tool Schema Build) │   │
│  └───────┬───────┘    └──────────┬───────────┘   │
│          │                       │                │
│          ▼                       ▼                │
│  ┌─────────────┐     ┌──────────────────────┐    │
│  │ Local Skills │     │ Structured Tool      │    │
│  │ agents/     │     │ Calling Pattern      │    │
│  │ skills/      │     │ (invoke_skill enum)  │    │
│  ├─────────────┤     └──────────────────────┘    │
│  │ OpenCode     │                                 │
│  │ skills/      │     ┌──────────────────────┐    │
│  ├─────────────┤     │ Session Memory Layer │    │
│  │ Remote       │     │ agents/sessions/    │    │
│  │ Catalog      │     │ findings.md,         │    │
│  │ (fallback)   │     │ progress.md          │    │
│  └─────────────┘     └──────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
`

## Related Skills

- @opencode-workflow-engine — Highest-level meta-skill for orchestrating multi-phase workflows.
- @opencode-session-init — Session-level file-based working memory.
- @opencode-ecc-research — ECC research agent for code review patterns.
- @opencode-evo-fitness — EvoAgentX fitness evaluation.
