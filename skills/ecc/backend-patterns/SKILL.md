# ECC Backend Patterns Skill

## Purpose
Enforces ECC's backend architecture patterns for Node.js/Express services.

## Pre-Execution Check
1. Load `.opencode/context/core/standards/code-quality.md` before backend tasks
2. If context file not loaded → STOP and report missing context
3. Only proceed after standards are verified as loaded

## Key Features
- Validates backend architecture against ECC patterns
- Enforces layered structure (routes → controllers → services → repositories)
- Checks for proper error handling middleware
- Validates database access patterns

## Integration
- Can be triggered via `task(subagent_type="CoderAgent", skill="backend-patterns")`
- Works with architect and code-reviewer agents

## Source
Adapted from https://github.com/affaan-m/ECC
