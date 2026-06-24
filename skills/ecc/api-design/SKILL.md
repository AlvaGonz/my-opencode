# ECC API Design Skill

## Purpose
Enforces ECC's API design principles for RESTful services.

## Pre-Execution Check
1. Load `.opencode/context/core/standards/code-quality.md` before API tasks
2. If context file not loaded → STOP and report missing context
3. Only proceed after standards are verified as loaded

## Key Features
- Validates REST endpoint naming conventions
- Enforces proper HTTP method usage (GET, POST, PUT, DELETE, PATCH)
- Checks for consistent error response format
- Validates input/output schema patterns

## Integration
- Can be triggered via `task(subagent_type="CoderAgent", skill="api-design")`
- Works with architect and code-reviewer agents

## Source
Adapted from https://github.com/affaan-m/ECC
