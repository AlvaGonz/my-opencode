# ECC TDD Workflow Skill

## Purpose
Implements ECC's Test-Driven Development workflow patterns. Ensures tests are written before implementation and maintains coverage standards.

## Key Features
- Enforces test-first approach
- Validates test coverage against .opencode/context/core/standards/test-coverage.md
- Generates test cases based on requirements
- Integrates with TDD Guide agent

## Integration
- Can be triggered via `task(subagent_type="TDDGuide", skill="tdd-workflow")`
- Works with CodeReviewer for test quality checks