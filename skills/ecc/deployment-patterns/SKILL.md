# ECC Deployment Patterns Skill

## Purpose
Enforces ECC's deployment and CI/CD best practices.

## Pre-Execution Check
1. Load `.opencode/context/core/workflows/task-delegation-basics.md` before deployment tasks
2. If context file not loaded → STOP and report missing context
3. Only proceed after standards are verified as loaded

## Key Features
- Validates CI/CD pipeline configuration
- Checks for proper environment separation (dev/staging/prod)
- Enforces deployment checklist completion
- Validates rollback procedures

## Integration
- Can be triggered via `task(subagent_type="CoderAgent", skill="deployment-patterns")`
- Works with build-error-resolver and orchestrator agents

## Source
Adapted from https://github.com/affaan-m/ECC
