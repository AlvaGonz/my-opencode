# ECC-Aligned Security Standards

## 10 Security Categories

### 1. Secrets Management
- NEVER hardcode secrets — use `process.env` with startup verification
- Use `git secrets` scanning or equivalent pre-commit hooks
- Rotate keys regularly, never commit `.env` files

### 2. Input Validation
- Always validate with schema library (Zod, class-validator, Pydantic)
- Strip unknown properties — reject unexpected fields
- Sanitize all user-supplied data before processing

### 3. SQL Injection Prevention
- NEVER concatenate SQL strings — use parameterized queries or ORM
- Prefer Prisma/Drizzle/SQLAlchemy over raw SQL
- For raw queries: always use `$1`, `?` or named parameters

### 4. Authentication & Authorization
- Use `httpOnly`, `Secure`, `SameSite=Strict` cookies (never localStorage for tokens)
- Row-Level Security (RLS) on all database tables
- JWT with short expiry (<15min) + refresh token rotation
- Rate-limit auth endpoints (login, register, password reset)

### 5. XSS Prevention
- Sanitize HTML with DOMPurify on the client
- Configure Content-Security-Policy headers
- Never use `dangerouslySetInnerHTML` (React) or `innerHTML` (vanilla JS)

### 6. CSRF Protection
- CSRF tokens for all state-changing requests
- `SameSite=Strict` cookie attribute
- Double-submit cookie pattern for APIs

### 7. Rate Limiting
- All endpoints rate-limited (stricter for expensive/auth operations)
- Use in-memory (bottleneck) or Redis-based (upstash-rate-limiter) limiting
- Return `429 Too Many Requests` with `Retry-After` header

### 8. Sensitive Data Protection
- Redact PII, tokens, and credentials in logs
- Generic error messages to users ("Invalid credentials" not "User not found")
- Encrypt sensitive fields at rest (AES-256)

### 9. Blockchain Security (if applicable)
- Verify wallet signatures server-side
- Validate all transaction parameters
- Use audited smart contract libraries

### 10. Dependency Security
- Run `npm audit` / `pip audit` regularly
- Commit lockfiles (`package-lock.json`, `poetry.lock`)
- Enable Dependabot or Renovate for automated updates

## Pre-Deployment Checklist (17 items)
- [ ] All secrets externalized to env vars
- [ ] Input validation on all endpoints
- [ ] No raw SQL concatenation
- [ ] AuthN/AuthZ on all protected routes
- [ ] CSP headers configured
- [ ] CSRF protection enabled
- [ ] Rate limiting on all endpoints
- [ ] Logs sanitized (no PII/tokens)
- [ ] Dependencies audited (no known vulnerabilities)
- [ ] HTTPS enforced (HSTS headers)
- [ ] CORS restricted to known origins
- [ ] File upload validation (type, size, scanning)
- [ ] Session timeout configured
- [ ] API versions deprecated/removed
- [ ] Error responses don't leak stack traces
- [ ] Database backups configured
- [ ] Monitoring & alerting set up

## Source
Adapted from https://github.com/affaan-m/ECC
