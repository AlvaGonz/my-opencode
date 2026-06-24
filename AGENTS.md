# AGENTS.md — Global Agent Constitution
# C:\Users\Admin\.opencode | Version: 1.0 | Status: Active

## 1. WHAT THIS REPO IS

This is the global OpenCode agent configuration for Adrian Alvarez. It lives at C:\Users\Admin\.opencode and acts as the single source of truth for all AI-assisted development sessions across all projects. Every tool (OpenCode, Cursor, Windsurf, Claude) that reads this repo inherits these rules, agents, skills, and workflows.

## 2. BUILD & VALIDATION COMMANDS

  # Validate credentials are set
  node scripts/validate-env.mjs

  # Rebuild skill registry
  node scripts/registry.mjs

  # Rebuild agent registry
  node scripts/registry.mjs --agents

  # Start session manually
  node hooks/session-start.mjs

  # Stop session manually
  node hooks/session-stop.mjs

  # Activate a project profile
  node scripts/activate-profile.mjs <profile-name>

  # Sync repo to ~/.opencode
  powershell -File scripts/sync.ps1

## 3. ARCHITECTURE MAP

  C:\Users\Admin\.opencode\
  │
  ├── AGENTS.md                    ← YOU ARE HERE — read first
  ├── SOUL.md                      ← Invariant agent identity
  ├── opencode.json                ← Main config (MCPs, subagents, skills declared)
  ├── mcp.json                     ← MCP server definitions ($env: references only)
  ├── .env                         ← GITIGNORED — real credentials here
  │
  ├── agents/
  │   ├── core/openagent.md        ← Main 6-step orchestrator — ALWAYS ACTIVE
  │   └── subagents/               ← 7 specialized agents (triggered by condition)
  │
  ├── hooks/                       ← Session lifecycle (auto-invoked)
  │   ├── session-start.mjs        ← validate-env → session-init → load profile
  │   └── session-stop.mjs         ← persist state → cleanup → WORKING-CONTEXT
  │
  ├── scripts/                     ← Utilities (manually invoked or by hooks)
  │   ├── validate-env.mjs         ← Pre-flight credential check
  │   ├── session-init.mjs         ← Session ID + directory creation
  │   ├── registry.mjs             ← Builds skills-lock + agents-lock (gitignored)
  │   ├── activate-profile.mjs     ← Project switch (Gap 4 — pending)
  │   ├── sync.ps1                 ← Repo → ~/.opencode sync (Gap 4 — pending)
  │   ├── approval-gate.mjs        ← Blocks execution until human approves
  │   ├── circuit-breaker.mjs      ← Stops agent on repeated failure
  │   └── post_task_loop.py        ← Post-execution verifier (Step 5 of workflow)
  │
  ├── skills/                      ← 86 reusable skill documents
  ├── rules/                       ← 5 non-negotiable operational rules
  ├── profiles/                    ← 5 project profiles (essential/developer/business/advanced/full)
  │
  └── .opencode/
      └── WORKING-CONTEXT.md       ← LIVING STATE — updated every session

## 4. SESSION LIFECYCLE

  1. hooks/session-start.mjs runs automatically
  2. scripts/validate-env.mjs checks credentials → logs warnings/errors
  3. scripts/session-init.mjs creates session directory under sessions/
  4. .opencode/WORKING-CONTEXT.md is read → Active Profile loaded
  5. scripts/registry.mjs scans skills/ and agents/subagents/ → builds in-memory registry
  6. ASCII startup summary printed to console
  7. agents/core/openagent.md takes control → 6-step workflow begins

  At session end:
  8. hooks/session-stop.mjs runs
  9. Session findings count written to .opencode/WORKING-CONTEXT.md
  10. ACTIVE_SESSION pointer file deleted (session history preserved)

## 5. SUBAGENT ROSTER

| Agent | File | Trigger Condition | Primary Capability |
|---|---|---|---|
| planner | agents/subagents/planner.md | plan, breakdown, feature planning, tasks | task decomposition, priority ordering, milestone definition |
| security-reviewer | agents/subagents/security-reviewer.md | security, owasp, vulnerability, audit, auth | OWASP Top 10 analysis, auth flow review, input validation |
| code-reviewer | agents/subagents/code-reviewer.md | review, quality, code review, best practices | code quality analysis, anti-pattern detection, readability |
| tdd-guide | agents/subagents/tdd-guide.md | test, tdd, spec, coverage, unit test | test case design, coverage analysis, TDD cycle |
| architect | agents/subagents/architect.md | architecture, ADR, design, system design, pattern | ADR writing, C4 diagrams, pattern selection |
| refactor-cleaner | agents/subagents/refactor-cleaner.md | refactor, clean, debt, simplify, rename | dead code removal, naming improvement, coupling reduction |
| build-error-resolver | agents/subagents/build-error-resolver.md | error, build fail, stack trace, exception, crash | stack trace analysis, root cause isolation, fix strategy |

## 6. MCP SERVER MAP

| Server | Status | Env Var Required | Purpose |
|---|---|---|---|
| mssql | enabled | MSSQL_PASSWORD | SQL Server queries |
| github-mcp-server | enabled | GITHUB_PERSONAL_ACCESS_TOKEN | GitHub operations |
| context7-mcp | enabled | CONTEXT7_API_KEY | Library docs lookup |
| StitchMCP | enabled | GCP_API_KEY | Google Stitch |
| mongodb-mcp-server | disabled | MONGODB_CONNECTION_STRING | MongoDB queries |
| awesome-copilot | disabled | None | Autocomplete / code suggestion |
| sequential-thinking | disabled | None | Sequential thinking tools |

## 7. PROJECT SWITCH PROTOCOL

  When switching to a new project:
  □ Run: node scripts/activate-profile.mjs <profile>  [Gap 4 — pending]
  □ Copy project's .env variables into local ~/.opencode/.env
  □ Verify: node scripts/validate-env.mjs
  □ Start session: node hooks/session-start.mjs
  □ Confirm WORKING-CONTEXT.md shows correct active project

  What NEVER changes between projects:
  - SOUL.md (invariant identity)
  - rules/ directory (non-negotiables)
  - agents/core/openagent.md (6-step workflow)
  - hooks/ (session lifecycle)

## 8. NON-NEGOTIABLE CONSTRAINTS

  1. APPROVAL GATE: Never execute destructive operations (delete, drop, overwrite prod) without scripts/approval-gate.mjs returning exit code 0.
  2. TDD FIRST: When writing code, test file is created before implementation file. No exceptions.
  3. NO AUTO-FIX: When a verification fails, STOP and report. Do not silently retry or patch without human confirmation.
  4. CREDENTIAL HYGIENE: No credential value ever touches a git-tracked file. $env: references only in mcp.json. Real values in .env only.
  5. STEP SEQUENCE: The 6-step workflow in openagent.md is mandatory. Steps cannot be skipped or reordered.
