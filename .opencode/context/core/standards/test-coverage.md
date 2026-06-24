# ECC-Aligned Test Coverage Standards

## Minimum Coverage
- **Total**: 80% minimum across unit, integration, and E2E
- **Unit tests**: Cover all pure functions and utility modules
- **Integration tests**: Cover all API endpoints and database operations
- **E2E tests**: Cover critical user journeys

## TDD Workflow
1. **RED** — Write a failing test that describes the desired behavior
2. **GREEN** — Write minimal implementation to make the test pass
3. **REFACTOR** — Improve code quality while keeping tests green
4. **VERIFY** — Check coverage meets threshold before committing

## Test Structure (AAA Pattern)
```
Describe('ModuleName', () => {
  it('returns empty array when no markets match query', () => {
    // Arrange - set up test data
    const query = 'nonexistent'
    
    // Act - execute the function
    const result = searchMarkets(query)
    
    // Assert - verify expected output
    expect(result).toEqual([])
  })
})
```

## Naming Conventions
- Descriptive names: `'returns empty array when no markets match query'`
- NOT: `'works'`, `'test1'`, `'should work'`
- Pattern: `'returns [expected] when [condition]'` or `'throws [error] when [condition]'`

## Required Test Types
| Scenario | Must Test |
|----------|-----------|
| Happy path | Primary success case |
| Error cases | Invalid input, missing data, auth failures |
| Edge cases | Empty arrays, null values, boundary limits |
| Security | Unauthorized access, injection attempts |
| Performance | Response time under load (if applicable) |

## Agent Integration
- Use `tdd-guide` subagent for new features (enforces write-tests-first)
- Use `code-reviewer` subagent for test quality review
- Coverage gate enforced before merge

## Source
Adapted from https://github.com/affaan-m/ECC
