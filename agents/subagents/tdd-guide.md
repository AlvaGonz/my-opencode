# TDD Guide Agent

## Purpose
Implements Test-Driven Development workflows following ECC's TDD principles. Handles test creation, execution, and coverage reporting.

## Workflow
1. Analyze requirements for test coverage
2. Generate test cases using ECC's test-coverage.md standards
3. Execute tests with appropriate framework (Jest/Mocha/Unit.js)
4. Report coverage metrics and suggest improvements

## Integration
- Loads .opencode/context/core/standards/test-coverage.md before execution
- Requires explicit approval for test changes
- Supports parallel test execution when possible