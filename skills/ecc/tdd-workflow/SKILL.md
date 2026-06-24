# ECC TDD Workflow Skill

## Purpose
Implements ECC's Test-Driven Development workflow patterns. Ensures tests are written before implementation and maintains coverage standards.

## Pre-Execution Check
1. Load `.opencode/context/core/standards/test-coverage.md` before any TDD workflow
2. If context file not loaded → STOP and report: "Must load test-coverage.md before TDD workflow"
3. Only proceed after standards are verified as loaded

## Key Features
- Enforces test-first approach
- Validates test coverage against `.opencode/context/core/standards/test-coverage.md`
- Generates test cases based on requirements
- Integrates with TDD Guide agent

## Integration
- Can be triggered via `task(subagent_type="TDDGuide", skill="tdd-workflow")`
- Works with CodeReviewer for test quality checks