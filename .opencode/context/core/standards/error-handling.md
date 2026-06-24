# ECC-Aligned Error Handling Standards

## Core Principles
1. **Fail fast and loudly** — surface at boundary, don't bury in callbacks
2. **Typed errors** over string messages — errors are first-class values
3. **User messages ≠ developer messages** — friendly UI, full-context logs
4. **Never swallow errors silently** — every `catch` handles, re-throws, or logs
5. **Errors are part of your API contract** — document every error code

## Error Hierarchy (TypeScript)
```
AppError
├── NotFoundError      (404)
├── ValidationError    (400)
├── UnauthorizedError  (401)
├── ForbiddenError     (403)
├── RateLimitError     (429)
└── InternalError      (500)
```

## Error Handler Pattern (API)
```typescript
// Standard error envelope
{
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid email format',
    details: [{ field: 'email', reason: 'must be a valid email address' }]
  }
}
```

## Retry with Exponential Backoff
```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn() }
    catch (error) {
      if (attempt === maxAttempts) throw error
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}
```

## Checklist
- [ ] No silent error swallowing
- [ ] Standard error envelope for all API responses
- [ ] No stack traces in production output
- [ ] User-facing messages are human-readable
- [ ] Error codes are documented
- [ ] All async operations have error boundaries
- [ ] Retry logic for transient failures
- [ ] Error tracking/monitoring configured

## Source
Adapted from https://github.com/affaan-m/ECC
