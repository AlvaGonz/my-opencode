# Versioning Strategies

> Three common approaches to API versioning, with pros, cons, and real-world examples.

## 1. Path-based Versioning — `/v1/resource`

The version is embedded in the URL path. This is the **default strategy for this skill** and the most widely adopted.

| Aspect | Detail |
|---|---|
| Syntax | `https://api.example.com/v1/resources` |
| Version format | `v{integer}` (e.g., `v1`, `v2`) or date-based (`2024-06-01`) |
| Adoption | **Microsoft Azure** (recommended), **PayPal**, Stripe, Twilio |

### Pros

- ✅ **Explicit and visible** — version is immediately clear in every URL.
- ✅ **Easy to route** — load balancers, proxies, and CDNs can route by path prefix.
- ✅ **Easy to cache** — different versions are distinct URLs with separate cache keys.
- ✅ **Simple to implement** — no header parsing required on the server.
- ✅ **Browseable** — can be tested in a browser or `curl` without custom headers.

### Cons

- ❌ **URL pollution** — every URL carries the version; changing the version for a specific call requires URL rewriting.
- ❌ **Permanent URL breakage** — once a version is part of a URL, changing the strategy is impossible without breaking clients.
- ❌ **Encourages multiple deployments** — teams may run v1 and v2 endpoints on different code bases rather than evolving the same contract.
- ❌ **Can imply major version = breaking change**, discouraging incremental backward-compatible additions.

### Microsoft's Recommendation

> **✅ DO** use the `api-version` as a **query parameter** for Azure data-plane APIs, not the URL path. However, the path pattern `/v1/` is permitted for Azure management-plane APIs.

Microsoft's URL pattern: `https://<tenant>.<region>.<service>.<cloud>/<service-root>/<resource-collection>/<resource-id>?api-version=2024-06-01`

## 2. Header-based Versioning — `Accept: application/vnd.api+json;version=1`

The version is specified in an HTTP header, typically a custom `Accept` header or a dedicated `Api-Version` header.

| Aspect | Detail |
|---|---|
| Syntax | `Accept: application/vnd.example.v2+json` |
| Alternative | `Api-Version: 2024-06-01` (custom header) |
| Adoption | **GitHub API** (Accept header), Stripe (API-Version header) |

### Pros

- ✅ **Clean URLs** — the same URL works across all versions.
- ✅ **Content negotiation** — uses HTTP's native mechanism (`Accept` header) for version selection.
- ✅ **Backward compatible by default** — if no version header is sent, the server defaults to the latest stable version.
- ✅ **Supports fine-grained versioning** — can version individual media types independently.

### Cons

- ❌ **Hidden version** — not visible in logs, bookmarks, or browser address bars.
- ❌ **Harder to test** — requires custom headers in `curl`, Postman, or client tools.
- ❌ **Cache-busting complexity** — CDNs and proxies must inspect headers to differentiate cached responses.
- ❌ **Implementation overhead** — server must parse `Accept` parameters or custom headers.
- ❌ **Polyglot client complexity** — some HTTP client libraries make it hard to set custom Accept parameters.

### Examples

```
# GitHub API (v3 vs v4 with different Accept media types)
Accept: application/vnd.github.v3+json

# Media type with version parameter
Accept: application/vnd.myapi.v2+json; version=2

# Custom header approach
Api-Version: 2024-06-01
```

## 3. Query-based Versioning — `?api-version=2024-06-01`

The version is a query parameter on every request.

| Aspect | Detail |
|---|---|
| Syntax | `https://api.example.com/resources?api-version=2024-06-01` |
| Adoption | **Microsoft Azure data-plane APIs** (recommended), Google Cloud APIs, AWS (some services) |

### Pros

- ✅ **Explicit** — version is visible in the URL.
- ✅ **Browseable** — works in browser and `curl` without custom headers.
- ✅ **Easy to implement** — just parse a query parameter on the server.
- ✅ **Supports date-based versions** (`2024-06-01`), which communicate semantic meaning (cut-off date for breaking changes).
- ✅ **Supports preview versions** (`api-version=2025-01-01-preview`).

### Cons

- ❌ **URL pollution** — every URL carries the version parameter.
- ❌ **Proxy/cache concerns** — query parameters can interfere with caching unless the cache key includes the parameter.
- ❌ **Not part of the URL path** — not suitable for service mesh routing or API gateway path-based routing.
- ❌ **Can encourage "query parameter creep"** — teams may start adding more behaviour-modifying query parameters alongside the version.

### Microsoft Azure Recommendation (preferred for data-plane APIs)

> **✅ DO** use an `api-version` **query parameter** with date-based values:
>
> - Format: `YYYY-MM-DD` (e.g., `api-version=2024-06-01`)
> - Preview suffix: `-preview` (e.g., `api-version=2024-06-01-preview`)
> - The version MUST be required on every request
> - If missing or unsupported, return `400 Bad Request`

## Comparison Table

| Criterion | Path /v1 | Header Accept | Query ?api-version |
|---|---|---|---|
| Visibility | High | Low | High |
| Browseable | Yes | No | Yes |
| Cache key separation | Automatic | Requires header inspection | Requires param in key |
| Routing (LB/gateway) | Native path routing | Header-based routing | Query-based routing |
| Client complexity | Low | Medium | Low |
| Server complexity | Low | Medium | Low |
| Breaks existing bookmarks | Yes | No | Yes (if param changes) |
| Microsoft recommendation | Management-plane | — | Data-plane |
| PayPal usage | Yes | — | — |
| Common format | `v1`, `v2` | `application/vnd.*+json` | `YYYY-MM-DD` |

## Recommendation

| If you are... | Use... |
|---|---|
| Building a public API for broad consumption | Path-based `/v1/` — simplest for clients |
| Building an Azure-hosted data-plane API | Query-based `?api-version=2024-06-01` |
| Designing for long-lived mobile clients | Header-based — avoids broken deep links |
| Creating an internal microservice | Path-based `/v1/` — quick and transparent |
| Following this skill's defaults | Path-based `/v1/` (config.json flag) |

## Changelog / Sunset Policy

Regardless of strategy, always document:

- **Minimum support period** for each version (e.g., 12 months after a successor is released).
- **Migration guide** with before/after examples.
- **Sunset headers** like `Sunset: Sat, 31 Dec 2026 23:59:59 GMT` and `Deprecation: true` (per [RFC 8594](https://datatracker.ietf.org/doc/html/rfc8594)).

## Sources

- [Microsoft Azure REST API Guidelines — Versioning](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md) (see api-version section)
- [PayPal API Standards — API Versioning](https://github.com/levid-gc/paypal-api-standards/blob/master/api-style-guide.md#api-versioning)
- [RFC 8594 — The Sunset HTTP Header](https://datatracker.ietf.org/doc/html/rfc8594)
- [Microsoft API Guidelines — Versioning FAQ](https://github.com/microsoft/api-guidelines)
