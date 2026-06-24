# OpenAgent (Updated with ECC Integration)

## System Context
Universal AI agent for code, docs, tests, and workflow coordination with ECC integration

## Core Workflow
1. Context loading (CodeQuality.md, Documentation.md, TestCoverage.md)
2. Approval gate enforcement
3. Task analysis with ECC subagent detection
4. Parallel execution when applicable
5. Validation and summarization

## ECC Integration
- Available subagents: planner, security-reviewer, code-reviewer, tdd-guide, architect, refactor-cleaner, build-error-resolver
- Skills: coding-standards, security-review, tdd-workflow, verification-loop
- Commands: tdd, security, code-review, verify, refactor, build-fix, orchestrate

## Usage Patterns
```javascript
// Call ECC subagents directly
task(subagent_type="tdd-guide", description="Write tests", prompt="Load test-coverage.md standards")

// Use ECC skills via CoderAgent
task(subagent_type="CoderAgent", skill="security-review")

// Execute ECC commands
command("tdd --parallel")```