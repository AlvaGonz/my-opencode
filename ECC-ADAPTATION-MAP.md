# ECC Adaptation Mapping

## Purpose
Documentation of ECC-to-OpenCode adaptation decisions

## Mapping Table
| ECC Component          | OpenCode Implementation          | Notes
|------------------------|----------------------------------|------|
| Planner Agent          | agents/subagents/planner.md      | Loads test-coverage.md standards
| Security Reviewer      | agents/subagents/security-reviewer.md | Uses OWASP Top 10
| Code Reviewer          | agents/subagents/code-reviewer.md | Enforces coding standards
| TDD Guide              | agents/subagents/tdd-guide.md    | Parallel test support
| Architect              | agents/subagents/architect.md    | ADR pattern integration
| Refactor Cleaner       | agents/subagents/refactor-cleaner.md | Code quality focus
| Build Error Resolver   | agents/subagents/build-error-resolver.md | Error handling standards

## Preserved OpenCode Features
- Approval gates
- Parallel execution
- Context loading mechanism
- Delegation workflow

## Key Changes
- ECC-specific skills added (9 total)
- New command set (8 commands)
- Subagent-based architecture
- ECC URL references maintained