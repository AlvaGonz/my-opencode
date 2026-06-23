# Naming Conventions

> Synthesised from Microsoft REST API Guidelines and PayPal API Standards.

## 1. Resource Nouns

- **MUST** use plural nouns for collection names (`/users`, `/invoices`, `/orders`).
- **MUST NOT** use verbs in resource paths (`/getUsers`, `/createOrder`). Use HTTP methods for actions.
- **MUST** use concrete nouns that reflect the business domain (`/accounts`, `/transactions`, `/subscriptions`).
- **SHOULD** model resources as nouns, not actions. Use the [controller pattern](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#performing-an-action) (`POST /resources/{id}:action`) only when CRUD is insufficient.

| ✅ Pass | ❌ Fail |
|---|---|
| `GET /users` | `GET /getUsers` |
| `POST /invoices` | `POST /createInvoice` |
| `DELETE /orders/{id}` | `DELETE /removeOrder?id={id}` |
| `POST /payments/{id}:refund` | `GET /refundPayment/{id}` |

## 2. URL Casing

- **Azure recommendation**: kebab-case (preferred) or camelCase for URL path segments. If the segment refers to a JSON field, use camelCase.
- **PayPal recommendation**: snake_case for URI component names.
- **This skill default**: kebab-case for path segments.

| ✅ Pass | ❌ Fail |
|---|---|
| `/api/v1/order-items` | `/api/v1/OrderItems` |
| `/api/v1/customer-addresses` | `/api/v1/customer_addresses` (snake_case in URL) |
| `/api/v1/user-profiles/{id}` | `/api/v1/UserProfiles/{ID}` |

## 3. Query Parameter Naming

- **MUST** use camelCase for query parameter names (Microsoft guidance).
- **SHOULD** avoid abbreviations unless universally understood (`page_size` over `ps`).
- **MUST** use consistent naming across all endpoints.

| ✅ Pass | ❌ Fail |
|---|---|
| `?pageSize=50` | `?page_size=50` (snake_case) |
| `?sortBy=createdAt` | `?sort_by=createdAt` |
| `?filter=status+eq+'active'` | `?f=status+eq+'active'` |
| `?include=metadata` | `?inc=metadata` |

## 4. Header Naming

- **MUST** use kebab-case (hyphenated) for HTTP headers (per RFC 7231).
- **SHOULD** avoid the `X-` prefix for custom headers per [RFC 6648](https://datatracker.ietf.org/doc/html/rfc6648) (except for headers already in production).
- **MUST** use standard headers when available (`Content-Type`, `Accept`, `ETag`, `If-Match`) instead of inventing custom equivalents.

| ✅ Pass | ❌ Fail |
|---|---|
| `Idempotency-Key` | `X-Idempotency-Key` |
| `Content-Type` | `content-type` (wrong case, but headers are case-insensitive) |
| `x-ms-request-id` | Acceptable for Azure legacy, but prefer `Request-Id` for new APIs |
| `If-Match` | `IfMatch` (camelCase, non-standard) |

## 5. Operation ID Conventions

- **MUST** follow the pattern: `<action><Resource>` in PascalCase (e.g., `getUser`, `createOrder`, `listOrders`).
- **MUST** be unique across the entire API spec.
- **SHOULD** use consistent verb prefixes: `list` for collections, `get` for single items, `create` for POST, `update` for PATCH/PUT, `delete` for DELETE.

| Verb | Resource | Operation ID |
|---|---|---|
| GET | /orders | `listOrders` |
| GET | /orders/{id} | `getOrder` |
| POST | /orders | `createOrder` |
| PATCH | /orders/{id} | `updateOrder` |
| DELETE | /orders/{id} | `deleteOrder` |
| POST | /orders/{id}:cancel | `cancelOrder` |

## 6. JSON Field Naming

- **MUST** use camelCase for JSON field names (both Microsoft and PayPal agree).
- **MUST NOT** upper-case acronyms — `userId` not `userID`.
- **MUST** be consistent across request and response bodies.
- **SHOULD** use singular names for single values, plural for arrays (`order` vs `orders`).

| ✅ Pass | ❌ Fail |
|---|---|
| `"firstName": "John"` | `"first_name": "John"` |
| `"userUrl": "..."` | `"userURL": "..."` |
| `"items": [...]` | `"item_list": [...]` |

## 7. Common Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| `/api/v1/getAllUsers` | Verb in URL | `GET /api/v1/users` |
| `/api/v1/Users` | Capitalised collection | `GET /api/v1/users` |
| `?page=1&limit=10` | `page` and `limit` not descriptive | Use standard pagination params |
| Custom header `X-Session-Id` | `X-` prefix deprecated | Use `Session-Id` |
| Inconsistent error format | Some errors return `{error: "msg"}`, others `{errors: []}` | Always use RFC 7807 envelope |
| Mixing camelCase and snake_case | Hard for SDK generation | Pick one and stick with it |
| `/users/{userId}/getOrders` | Nested verb | `GET /users/{userId}/orders` |
| Returning `id` as integer | IDs can change format | Use opaque string IDs |

## 8. PayPal-specific Naming Rules

From the PayPal API Standards:

- URI variable blocks follow [RFC 6570 URI Template](https://tools.ietf.org/html/rfc6570): `/v1/accounts/{account_id}`
- HTTP headers use camelCase + hyphenated syntax: `Foo-Request-Id`
- JSON field names use snake_case in PayPal legacy, but camelCase in newer PayPal APIs
- Link relation names use lower-case with hyphens: `https://api.foo.com/docs/#self`

## Sources

- [Microsoft Azure REST API Guidelines — URLs](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#uniform-resource-locators-urls)
- [PayPal API Standards — Naming Conventions](https://github.com/levid-gc/paypal-api-standards/blob/master/api-style-guide.md#naming-conventions)
- [Microsoft Azure REST API Guidelines — JSON](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#json)
- [RFC 6648 — Deprecating the "X-" Prefix](https://datatracker.ietf.org/doc/html/rfc6648)
- [RFC 6570 — URI Template](https://tools.ietf.org/html/rfc6570)
