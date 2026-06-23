---
name: api-design-principles
description: Design and review REST APIs with best practices for versioning, error handling, pagination, OpenAPI specifications, and API contract reviews.
trigger: "when the user asks to design a REST API, define response shapes, choose a versioning strategy, write an OpenAPI spec, handle errors, paginate results, or review an API contract"
scope: api-design
version: "1.0"
sources:
  - https://github.com/microsoft/api-guidelines
  - https://github.com/paypal/api-standards
  - https://github.com/Kristories/awesome-guidelines
---

# API Design Principles Skill

## Purpose

This skill provides a structured reference for designing consistent, production-grade REST APIs. It synthesizes patterns from the **Microsoft REST API Guidelines**, **PayPal API Standards**, **RFC 7807 (Problem Details)**, and the broader API community. Use this skill when designing new APIs, reviewing existing contracts, writing OpenAPI specs, or choosing between design trade-offs.

## How to Use

1. **Identify the design phase** — Are you naming resources, choosing a versioning strategy, or writing error responses?
2. **Consult the relevant reference file** — Each file under `references/` covers a specific concern (naming, versioning, pagination, status codes).
3. **Use the templates** — `assets/openapi-template.yaml` and `assets/error-envelope.json` are ready-to-use scaffolds.
4. **Run the checklist** — Before finalising, run through `resources/design-review-checklist.md`.
5. **Check the config** — `config.json` captures the default choices (REST, path versioning, cursor pagination, RFC 7807 errors, OpenAPI 3.1).

## Reference Files

| File | What it covers |
|---|---|
| `references/naming-conventions.md` | Resource nouns, URL casing, query params, headers, operation IDs, anti-patterns |
| `references/versioning-strategies.md` | Path /v1, header-based, query-based versioning with pros/cons |
| `references/pagination-patterns.md` | Offset, cursor, keyset pagination — response shapes and when to use each |
| `references/status-codes.md` | Complete HTTP status code reference grouped by category, with common misuse warnings |
| `resources/design-review-checklist.md` | 30-item checklist covering URL design, methods, bodies, responses, errors, versioning, security, pagination, docs, and backwards compatibility |
| `assets/openapi-template.yaml` | OpenAPI 3.1 scaffold with Bearer JWT auth, 3 endpoints, reusable components |
| `assets/error-envelope.json` | RFC 7807 error envelope as JSON Schema with 5 example objects |
| `config.json` | Default configuration flags |

## Gotchas

- **PayPal API Standards repo (github.com/paypal/api-standards) returned 404** — content derived from a community fork and PayPal developer docs.
- **Microsoft deprecated `Guidelines.md`** — the main guidelines file now points to Azure-specific and Graph-specific documents. This skill uses the Azure REST API Guidelines (`azure/Guidelines.md`) which is the most current.
- **RFC 7807 is obsoleted by RFC 9457** — but the envelope structure is identical. This skill references RFC 7807 as the original.
- **OpenAPI template uses 3.1** — OpenAPI 3.1 aligned with JSON Schema 2020-12; ensure your tooling supports it.
- **Cursor pagination is the default** — but offset pagination may be simpler for low-volume internal APIs. Choose deliberately.

## Sources

- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [PayPal API Standards (community fork)](https://github.com/levid-gc/paypal-api-standards/blob/master/api-style-guide.md)
- [PayPal Developer Docs — API Requests](https://developer.paypal.com/api/rest/requests/)
- [RFC 7807 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc7807)
- [Kristories/awesome-guidelines](https://github.com/Kristories/awesome-guidelines)
