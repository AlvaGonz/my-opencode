# API Design Review Checklist

> 30-item checklist organised by category. Each item includes the check, pass condition, and failure example.

## URL Design (Items 1-4)

### 1. Plural resource nouns
- **Check**: Are all collection paths plural nouns?
- **Pass**: `GET /users`, `GET /orders/{id}`
- **Fail**: `GET /user`, `GET /getOrder`

### 2. No verbs in URL paths
- **Check**: Are actions expressed via HTTP methods, not verb URLs?
- **Pass**: `POST /payments/{id}:refund` (controller pattern) or `DELETE /orders/{id}`
- **Fail**: `GET /deleteOrder/{id}`, `POST /createUser`

### 3. Consistent URL casing
- **Check**: Are all path segments in kebab-case (or consistent camelCase)?
- **Pass**: `/api/v1/order-items`, `/api/v1/orderItems`
- **Fail**: `/api/v1/OrderItems`, `/api/v1/order_items`

### 4. No trailing slashes
- **Check**: Do collection URLs omit trailing slashes?
- **Pass**: `GET /users`
- **Fail**: `GET /users/`

## HTTP Methods (Items 5-8)

### 5. GET is read-only
- **Check**: Do GET endpoints have zero side effects?
- **Pass**: `GET /users` returns data, doesn't modify state
- **Fail**: `GET /users/123?action=activate` triggers a state change

### 6. POST creates (not replaces)
- **Check**: Does POST create a new resource with a server-generated ID?
- **Pass**: `POST /users` → `201 Created` + `Location: /users/abc-123`
- **Fail**: `POST /users/123` that replaces the resource (should be PUT)

### 7. PUT replaces the whole resource
- **Check**: Does PUT require the full resource representation and replace it entirely?
- **Pass**: `PUT /users/123` with all fields; absent fields reset to default
- **Fail**: `PUT /users/123` with only one field (should be PATCH)

### 8. PATCH for partial updates
- **Check**: Does PATCH accept a partial set of fields (JSON Merge Patch)?
- **Pass**: `PATCH /users/123` with `{ "name": "New" }`
- **Fail**: Requiring all fields in a PATCH request

## Request Bodies (Items 9-11)

### 9. Consistent JSON field naming
- **Check**: Are all JSON fields in camelCase?
- **Pass**: `{ "firstName": "John", "lastName": "Doe" }`
- **Fail**: `{ "first_name": "John", "last_name": "Doe" }`

### 10. Unknown fields rejected
- **Check**: Does the server reject JSON fields it doesn't understand?
- **Pass**: Request with unknown field `"foo": "bar"` → `400 Bad Request`
- **Fail**: Silently ignoring or storing unexpected fields

### 11. Idempotency support for POST
- **Check**: Is POST idempotent via `Idempotency-Key` header?
- **Pass**: Re-sending same `Idempotency-Key: uuid` returns `200 OK` with original result
- **Fail**: Re-sending creates duplicate resources

## Response Shapes (Items 12-14)

### 12. Envelope consistency
- **Check**: Is the same response envelope used across all endpoints?
- **Pass**: All GET responses wrap data in `{ "data": ... }` or use a shared shape
- **Fail**: Some endpoints return `{ "results": [] }`, others return `{ "items": [] }`

### 13. ETags for concurrency
- **Check**: Do mutable resources return `ETag` headers for optimistic concurrency?
- **Pass**: `GET /users/123` → `ETag: "abc123"`; `PUT` with `If-Match: "abc123"`
- **Fail**: No ETag, no concurrency control, last-write-wins

### 14. Resource IDs are opaque strings
- **Check**: Are IDs returned as strings (not integers)?
- **Pass**: `"id": "abc-123-def"`
- **Fail**: `"id": 42` (auto-increment integers leak ordering and count)

## Error Handling (Items 15-18)

### 15. RFC 7807 error envelope
- **Check**: Do all error responses use a consistent Problem Details shape?
- **Pass**: `{ "type": "...", "title": "...", "status": 400, "detail": "..." }`
- **Fail**: Each endpoint returns a different error format

### 16. Status code matches error semantics
- **Check**: Does the HTTP status code match the error category?
- **Pass**: Validation error → 422, Auth failure → 401, Forbidden → 403
- **Fail**: Validation error → 500, Not found → 400

### 17. No stack traces in production
- **Check**: Are 5xx responses free of stack traces and internal details?
- **Pass**: `{ "detail": "Internal server error. Reference: err-abc" }`
- **Fail**: `{ "detail": "at com.example.UserService.create(UserService.java:42)" }`

### 18. Rate limit headers
- **Check**: Do 429 responses include `Retry-After` and rate-limit headers?
- **Pass**: `Retry-After: 120`, `X-RateLimit-Reset: 1689123456`
- **Fail**: 429 with just `{ "error": "too many requests" }`

## Versioning (Items 19-21)

### 19. Version is required
- **Check**: Is the API version required on every request?
- **Pass**: Missing version → `400 Bad Request` with guidance
- **Fail**: Version is optional, defaults silently to latest

### 20. Backward-compatible additions only
- **Check**: Can new fields be added without breaking existing clients?
- **Pass**: Adding an optional field to a response, new query parameter
- **Fail**: Removing a field, making an optional field required, changing a field type

### 21. Deprecation policy is documented
- **Check**: Is there a published sunset/deprecation policy?
- **Pass**: Readme or spec includes "Version x supported until YYYY-MM-DD"
- **Fail**: No deprecation headers, no migration guide, versions disappear silently

## Security (Items 22-24)

### 22. Bearer token auth
- **Check**: Is the API protected by a standard auth mechanism (Bearer JWT, OAuth2)?
- **Pass**: `Authorization: Bearer eyJ...` verified on every request
- **Fail**: API key in query parameter (`?api_key=abc`), no auth on some endpoints

### 23. No secrets in GET responses
- **Check**: Are secrets (passwords, tokens, keys) excluded from GET responses?
- **Pass**: `POST /tokens/create` returns a token once; `GET /tokens/{id}` shows metadata only
- **Fail**: `GET /users/123` returns `passwordHash` or `creditCardNumber`

### 24. Input validation on all endpoints
- **Check**: Are all input fields validated (type, length, range, pattern)?
- **Pass**: `"name": ""` → `422` with `"field": "name", "reason": "REQUIRED"`
- **Fail**: Empty strings accepted, integer overflow possible, no max length

## Pagination (Items 25-27)

### 25. Consistent pagination params
- **Check**: Are pagination parameter names consistent across all list endpoints?
- **Pass**: `cursor`, `page_size` used everywhere
- **Fail**: `?page=1&limit=10` on one endpoint, `?offset=0&count=10` on another

### 26. `has_more` or `nextLink` for last page detection
- **Check**: Can clients determine whether there are more pages?
- **Pass**: `{ "pagination": { "cursor": null, "has_more": false } }`
- **Fail**: Clients must guess by checking if returned data is empty

### 27. No count on large collections
- **Check**: Is `total_count` avoided unless explicitly requested?
- **Pass**: Only return total count if `?include_total=true` is passed
- **Fail**: Always computing `SELECT COUNT(*)` on billion-row tables

## Documentation (Items 28-29)

### 28. OpenAPI 3.1 spec exists
- **Check**: Is the API documented with a valid OpenAPI 3.1 specification?
- **Pass**: `openapi.yaml` passes validation, has all endpoints, schemas, security
- **Fail**: No spec, outdated spec, spec missing request/response schemas

### 29. Example values for every schema
- **Check**: Do all schema objects include `example` values?
- **Pass**: Each property has `example: "..."` and each response has `example: {...}`
- **Fail**: No examples, examples that don't match the schema

## Backwards Compatibility (Item 30)

### 30. Breaking change audit
- **Check**: Does this API change pass the breaking change audit?
- **Pass** (not breaking): Adding optional fields, adding new endpoints, extending an enum, relaxing input constraints
- **Fail** (breaking): Removing a field, renaming a field, changing a field type, making an optional field required, adding a new required field, changing URL structure, removing an endpoint, changing status codes

## Scorecard

| Category | Items | Pass | Fail |
|---|---|---|---|
| URL Design | 1-4 | ___ / 4 | ___ |
| HTTP Methods | 5-8 | ___ / 4 | ___ |
| Request Bodies | 9-11 | ___ / 3 | ___ |
| Response Shapes | 12-14 | ___ / 3 | ___ |
| Error Handling | 15-18 | ___ / 4 | ___ |
| Versioning | 19-21 | ___ / 3 | ___ |
| Security | 22-24 | ___ / 3 | ___ |
| Pagination | 25-27 | ___ / 3 | ___ |
| Documentation | 28-29 | ___ / 2 | ___ |
| Backwards Compatibility | 30 | ___ / 1 | ___ |
| **Total** | **30** | **___ / 30** | |

*Score < 24: Revise before shipping. Score 24-27: Minor issues to fix. Score 28-30: Ready for review.*

## Sources

- [Microsoft Azure REST API Guidelines](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md)
- [PayPal API Standards — Design Principles](https://github.com/levid-gc/paypal-api-standards/blob/master/api-style-guide.md)
- [RFC 7807 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc7807)
- [RFC 7231 — HTTP Semantics and Content](https://tools.ietf.org/html/rfc7231)
