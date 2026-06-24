# ECC Security Review Skill

## Purpose
Enforces ECC's security standards across projects. Identifies vulnerabilities and ensures compliance with security best practices.

## Pre-Execution Check
1. Load `.opencode/context/core/standards/owasp-security.md` before any security review
2. If context file not loaded → STOP and report: "Must load owasp-security.md before security review"
3. Only proceed after standards are verified as loaded

## Key Features
- Validates code against `.opencode/context/core/standards/owasp-security.md`
- Detects common vulnerabilities (OWASP Top 10)
- Checks for proper authentication/authorization patterns
- Verifies secret management practices

## Integration
- Can be triggered via `task(subagent_type="CodeReviewer", skill="security-review")`
- Works with SecurityAgent and RefactorCleaner