# ECC Error Handling Skill

## Purpose
Enforces ECC's error handling patterns for production-grade applications.

## Pre-Execution Check
1. Load `.opencode/context/core/standards/error-handling.md` before error handling tasks
2. If context file not loaded → STOP and report: "Must load error-handling.md before error handling tasks"
3. Only proceed after standards are verified as loaded

## Key Features
- Validates error handling patterns against `.opencode/context/core/standards/error-handling.md`
- Checks for typed error hierarchy usage
- Enforces standard error response format
- Validates retry logic patterns

## Integration
- Can be triggered via `task(subagent_type="CoderAgent", skill="error-handling")`
- Works with build-error-resolver and code-reviewer agents

## Source
Adapted from https://github.com/affaan-m/ECC
