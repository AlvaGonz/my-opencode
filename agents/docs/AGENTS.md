# AGENTS.md — Agent Constitution

## Agent Roster (Post-Task Loop)

The following agents are registered in the post-task validation pipeline, ordered by execution sequence:

| Agent | Type | Temperature | Purpose |
|---|---|---|---|
| Layer1:Tests | Deterministic (Python) | N/A | Run project tests before any LLM call. Fail-fast if floor breaks. |
| ECCResearch | LLM (Primary) | 0.0 | Research agent analyzing diff for vulnerability patterns, code smells, and architectural anti-patterns. Runs BEFORE Evaluator to ground fixes in real patterns. |
| Evaluator | LLM (Primary) | 0.0 | Score on 4 dimensions: OWASP compliance, architecture quality, test coverage, constitution adherence. |
| Critic | LLM (Routed) | 0.0 | Identify deviations from constitution, style guidelines, or codebase standards. |
| SecurityCritic | LLM (Primary) | 0.0 | Review against OWASP Top 10:2025, ASVS 5.0, and Agentic AI Security risks. |
| ArchitectureCritic | LLM (Routed) | 0.0 | Review against C4/Mermaid architecture and living documentation requirements. |
| AdversarialReview | LLM (Primary) | 0.0-0.5 | Three hostile personas (Saboteur, NewHire, SecurityAuditor) for anti-monoculture review. |
| MutationEngine | Hybrid (LLM + Code) | 0.4 | Proposes and applies evolutionary mutations when fitness is low. Writes novel skills. |
| Archivist | LLM (Primary) | 0.2 | Extract generalized lessons from issues to avoid them in the future. |

## EvoAgentX Fitness Vector

Replaces single score with multi-dimensional quality assessment:

| Dimension | Weight | Source | Description |
|---|---|---|---|
| Security | 0.4 (40%) | SecurityCritic | 0-100 based on high/medium security issues found |
| Coverage | 0.2 (20%) | TestCoverageReviewer | 0-100 based on test coverage ratio for new code |
| Convention | 0.2 (20%) | CommitMessageValidator | 0 or 100 based on conventional commit compliance |
| Architecture | 0.2 (20%) | ArchitectureCritic | 0-100 based on architecture issues found |
| **Composite** | **1.0** | **Weighted average** | **security*0.4 + coverage*0.2 + convention*0.2 + arch*0.2** |

## Evolution Trigger Conditions

The Mutation Engine activates when:
1. `fitness.composite < 80` — overall quality below threshold
2. `len(high_issues) > 0` — any HIGH or CRITICAL issues exist

## DenialOfWalletGuard Configuration

MAX_CALLS_PER_RUN = 26 (was 20, +2 per new agent: ECCResearch, MutationEngine)

| Agent | Max Retries | Model |
|---|---|---|
| ECCResearch | 3 | GROQ_MODEL_PRIMARY |
| Evaluator | 3 | GROQ_MODEL_PRIMARY |
| Critic | 3 | Routed |
| SecurityCritic | 3 | GROQ_MODEL_PRIMARY |
| ArchitectureCritic | 3 | Routed |
| Mutator | 3 | GROQ_MODEL_FAST |
| Validator | 3 | GROQ_MODEL_PRIMARY |
| Archivist | 3 | GROQ_MODEL_PRIMARY |
| Adversarial:Saboteur | 3 | Routed |
| Adversarial:NewHire | 3 | Routed |
| Adversarial:SecurityAuditor | 3 | GROQ_MODEL_PRIMARY |
| MutationEngine | 3 | GROQ_MODEL_FAST |

## Ledger Execution Order

The MagenticOrchestrator builds the agent ledger in this order:

```
["Layer1:Tests", "ECCResearch", "Evaluator", "SecurityCritic",
 "ArchitectureCritic", "AdversarialReview", "MutationEngine", "Archivist"]
```

## Security Constraints

1. **Anti-Injection**: All LLM outputs pass through SecurityGuardrails.sanitize_for_prompt() before storage
2. **CircuitBreaker**: All external calls wrapped with MAX_RETRIES=3
3. **Skill Writing Idempotency**: No skill is written if its name already exists in skills-lock.json
4. **Supply Chain Validation**: AGENTS.md hash is verified before each run
5. **Watchdog Agent**: Detects score inflation and verdict inconsistencies
