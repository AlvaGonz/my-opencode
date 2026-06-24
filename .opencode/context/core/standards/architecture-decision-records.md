# ECC-Aligned Architecture Decision Records (ADR)

## Purpose
Capture architectural decisions with context, rationale, and consequences.

## ADR Lifecycle
```
proposed → accepted → [deprecated | superseded by ADR-NNNN]
```

## ADR Template (Nygard Style)
```markdown
# ADR-NNNN: [Title]
**Date**: YYYY-MM-DD   **Status**: proposed|accepted|deprecated|superseded
**Deciders**: [who was involved]

## Context
What motivated this decision? What forces are at play?

## Decision
What we're doing — full description of the chosen approach.

## Alternatives Considered
| Alternative | Pros | Cons | Why Rejected |
|-------------|------|------|--------------|
| [Option A] | ... | ... | ... |
| [Option B] | ... | ... | ... |

## Consequences
- Positive: [benefits gained]
- Negative: [trade-offs accepted]
- Risks: [what could go wrong and how to mitigate]
```

## Decision Detection Signals
- **Explicit**: "Let's go with X", "Record this as an ADR"
- **Implicit**: Framework/library comparisons, schema design choices, architectural pattern selections

## Directory Structure
```
docs/adr/
├── README.md              ← index table with all ADRs
├── 0001-use-nextjs.md     ← ADR files
├── 0002-postgres-over-mongo.md
└── template.md            ← reusable template
```

## Categories Worth Recording (8)
1. **Technology choices** — framework, database, libraries
2. **Architecture patterns** — monorepo, microservices, event-driven
3. **API design** — REST vs GraphQL, versioning strategy
4. **Data modeling** — schema design, indexing strategy
5. **Infrastructure** — hosting, CI/CD, deployment
6. **Security** — auth strategy, encryption, secret management
7. **Testing** — testing strategy, coverage thresholds
8. **Process** — code review, release workflow, branching model

## Source
Adapted from https://github.com/affaan-m/ECC
