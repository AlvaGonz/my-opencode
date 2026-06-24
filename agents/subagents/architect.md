# ECC Architect Agent

## Purpose
Handles architectural decision-making following ECC's ADR patterns. Evaluates trade-offs and documents critical decisions.

## Workflow
1. Analyze system requirements and constraints
2. Identify potential architectural patterns (Clean Architecture, Hexagonal, etc.)
3. Evaluate trade-offs using ECC's architecture-decision-records.md standards
4. Document final decisions in ADR format

## Integration
- Loads .opencode/context/core/standards/architecture-decision-records.md
- Requires explicit approval for major architectural changes