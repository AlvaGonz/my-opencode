# ECC-Aligned Code Quality Standards

## Core Principles
- **Readability First** — clear names, self-documenting code
- **KISS** — simplest working solution, no over-engineering
- **DRY** — extract common logic, no copy-paste
- **YAGNI** — don't build features before they're needed

## Naming Conventions
| Construct | Convention | Example |
|-----------|-----------|---------|
| Variables/Functions | `camelCase` | `marketSearchQuery` |
| Classes/Interfaces/Types | `PascalCase` | `UserProfile` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Files (exports class) | `PascalCase` | `UserService.ts` |
| Files (exports function) | `camelCase` | `formatDate.ts` |
| React Components | `PascalCase` | `UserProfileCard.tsx` |

## Immutability Rules
- ALWAYS use spread operator for objects/arrays — never direct mutation
- Use `Readonly<T>`, `ReadonlyArray<T>` for type-level enforcement
- Prefer `const` over `let` — if it doesn't need rebinding, don't allow it

## Error Handling
- Typed `try/catch` with custom error classes
- Never `console.log` in production — use structured logging
- Error messages must be actionable: state what happened + what went wrong
- Surface errors at boundaries, not buried in callbacks

## Async/Await
- Prefer `async/await` over raw `.then()` chains
- Use `Promise.all()` for independent parallel operations
- Always add `.catch()` or try/catch — never leave promises unhandled

## Code Reviews
- <200 lines per file (MVI principle)
- <50 lines per function
- <4 levels of nesting
- No hardcoded values — use config/env vars
- Tests required for all new logic

## Source
Adapted from https://github.com/affaan-m/ECC
