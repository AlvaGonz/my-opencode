# ECC Verification Loop Skill

## Purpose
Implements ECC's verification loop for quality assurance after code changes.

## Pre-Execution Check
1. Load `.opencode/context/core/standards/code-quality.md` before verification
2. If context file not loaded → STOP and report missing context
3. Only proceed after standards are verified as loaded

## Key Features
- Verifies code against coding standards
- Checks test coverage meets minimum thresholds
- Validates error handling patterns
- Reports compliance status

## Integration
- Can be triggered via `task(subagent_type="CodeReviewer", skill="verification-loop")`
- Works with tdd-guide and refactor-cleaner agents

## Source
Adapted from https://github.com/affaan-m/ECC
