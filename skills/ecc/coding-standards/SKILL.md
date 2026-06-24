# ECC Coding Standards Skill

## Purpose
Enforces ECC's coding standards across projects. Ensures consistency in code quality, naming conventions, and architectural patterns.

## Key Features
- Validates code against .opencode/context/core/standards/code-quality.md
- Detects anti-patterns and suggests refactorings
- Enforces naming conventions (e.g., PascalCase for classes)
- Checks for proper documentation

## Integration
- Can be triggered via `task(subagent_type="CoderAgent", skill="coding-standards")`
- Works with CodeReviewer and RefactorCleaner agents