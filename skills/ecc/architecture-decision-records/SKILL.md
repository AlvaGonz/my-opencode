# ECC Architecture Decision Records Skill

## Purpose
Enforces ECC's ADR practices for documenting architectural decisions.

## Pre-Execution Check
1. Load `.opencode/context/core/standards/architecture-decision-records.md` before ADR tasks
2. If context file not loaded → STOP and report: "Must load architecture-decision-records.md before ADR tasks"
3. Only proceed after standards are verified as loaded

## Key Features
- Validates ADR format against `.opencode/context/core/standards/architecture-decision-records.md`
- Enforces Nygard-style ADR structure
- Checks for proper status lifecycle (proposed → accepted → deprecated/superseded)
- Validates decision context documentation

## Integration
- Can be triggered via `task(subagent_type="ArchitectAgent", skill="architecture-decision-records")`
- Works with architect and code-reviewer agents

## Source
Adapted from https://github.com/affaan-m/ECC
