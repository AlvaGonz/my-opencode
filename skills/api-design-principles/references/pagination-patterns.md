# Pagination Patterns

> Three pagination strategies compared: offset, cursor (default for this skill), and keyset.

## 1. Offset Pagination

The classic approach: `?page=2&per_page=50`. Simple but fragile.

| Aspect | Detail |
|---|---|
| Query params | `page` (1-indexed), `per_page` or `page_size` (default 20-50) |
| Response shape | `{ "data": [...], "page": 2, "per_page": 50, "total": 342, "total_pages": 7 }` |
| Adoption | GitHub (v3), most early REST APIs |

### Response Envelope

```json
{
  "data": [
    { "id": "51", "name": "Item 51" },
    { "id": "52", "name": "Item 52" }
  ],
  "page": 2,
  "per_page": 50,
  "total": 342,
  "total_pages": 7
}
```

### Pros

- ✅ **Simple to implement** — just `LIMIT ? OFFSET ?` in SQL.
- ✅ **Simple for clients** — jump to any page directly.
- ✅ **Easy to document** — everyone understands "page 2 of 7".
- ✅ **Works with any sort order**.

### Cons

- ❌ **Unstable** — if items are inserted/deleted, the same offset returns different data across requests.
- ❌ **Inefficient at high offsets** — `OFFSET 10000` forces the database to scan and discard 10000 rows.
- ❌ **Not suitable for real-time data** — new items shift all subsequent pages.
- ❌ **No cursor for resumability** — if a client loses its place, it can't resume from where it left off.

### When to Use

- Admin interfaces with < 10,000 total items.
- Static datasets that don't change frequently.
- Simple internal tools where UX for "jump to page N" matters more than consistency.

## 2. Cursor-based Pagination

Uses an opaque cursor token. The client passes the cursor from the previous response to get the next page. **Default for this skill.**

| Aspect | Detail |
|---|---|
| Query params | `cursor` (opaque, from previous response), `page_size` (optional) |
| Response shape | `{ "data": [...], "pagination": { "cursor": "...", "has_more": true } }` |
| Adoption | **Stripe**, **Microsoft Graph**, **PayPal**, Twitter API v2 |

### Response Envelope

```json
{
  "data": [
    { "id": "51", "name": "Item 51", "created_at": "2026-06-01T12:00:00Z" },
    { "id": "52", "name": "Item 52", "created_at": "2026-06-01T12:05:00Z" }
  ],
  "pagination": {
    "cursor": "eyJpZCI6IjUyIiwic2NvcmUiOiIyMDI2LTA2LTAxVDEyOjA1OjAwWiJ9",
    "has_more": true
  }
}
```

### Request Example

```http
GET /v1/resources?cursor=eyJpZCI6IjUyIiwic2NvcmUiOiIyMDI2LTA2LTAxVDEyOjA1OjAwWiJ9&page_size=50
```

### How it Works

1. The server encodes the position of the last item in the page into an opaque cursor (typically base64-encoded JSON or a signed token).
2. The client sends that cursor as a query parameter for the next request.
3. The server uses the cursor to fetch the next N items with `WHERE created_at < :cursor_time ORDER BY created_at DESC LIMIT :page_size`.
4. When no more items exist, `cursor` is `null` and `has_more` is `false`.

### Pros

- ✅ **Stable** — inserting new items doesn't shift existing pages.
- ✅ **Efficient** — uses indexed `WHERE` clauses, no `OFFSET`.
- ✅ **Resumable** — clients can resume from the exact position.
- ✅ **Consistent** — the cursor encodes a snapshot position.
- ✅ **Performant** — O(log N) regardless of page depth.

### Cons

- ❌ **No random access** — clients cannot "jump to page 5".
- ❌ **Opaque cursor** — adding server-side logic for cursor creation/decoding.
- ❌ **Cursor expiry** — if cursors encode point-in-time data, they may become invalid.
- ❌ **Harder for human debugging** — the cursor is an opaque string.

### When to Use

- Real-time feeds (social media, events, logs).
- Large datasets (> 10,000 items).
- APIs where consistency is critical (payment transactions, orders).
- **Default for this skill** (config.json flag).

## 3. Keyset Pagination

Pagination based on a visible, sortable column (e.g., `?after_id=123&limit=50`). Also called "seek pagination."

| Aspect | Detail |
|---|---|
| Query params | `after_id` or `since_id`, `limit`; optionally `before_id` for previous page |
| Response shape | `{ "data": [...], "next_id": "200", "has_more": true }` |
| Adoption | Twitter API v1.1, some internal APIs |

### Response Envelope

```json
{
  "data": [
    { "id": "101", "name": "Item 101" },
    { "id": "102", "name": "Item 102" }
  ],
  "next_id": "200",
  "has_more": true
}
```

### Pros

- ✅ **Simple to implement** — `WHERE id > :after_id ORDER BY id ASC LIMIT :limit`.
- ✅ **Efficient** — index seek, no offset.
- ✅ **Stable** — new items don't shift pages.
- ✅ **Transparent** — the "cursor" is a visible ID the client already has.
- ✅ **No cursor expiry** — an ID is always valid.

### Cons

- ❌ **Tied to sort order** — only works for monotonic columns (auto-increment ID, created_at).
- ❌ **Leaky abstraction** — clients know the sort key, making it harder to change later.
- ❌ **No backward pagination** — easy to go forward, hard to go back.
- ❌ **Not suitable for non-monotonic sorts** — cannot keyset-paginate by `name` or `price`.

### When to Use

- Append-only logs where ordering is by creation time.
- Simple internal services with auto-increment primary keys.
- Migration path from offset pagination to cursor pagination.

## Decision Matrix

| Concern | Offset | Cursor | Keyset |
|---|---|---|---|
| Stable across inserts | ❌ | ✅ | ✅ |
| Jump to arbitrary page | ✅ | ❌ | ❌ |
| Efficient at depth | ❌ | ✅ | ✅ |
| Simple implementation | ✅ | ❌ | ✅ |
| Opaque to clients | N/A | ✅ | ❌ |
| Works with any sort | ✅ | ✅ | ❌ |
| No cursor expiry | N/A | ❌ | ✅ |
| Resumable | ❌ | ✅ | ✅ |

## Common Pitfalls

| Pitfall | Why | Fix |
|---|---|---|
| Using offset for real-time data | Items shift pages | Use cursor or keyset |
| Making cursor human-readable | Base64 is not opaque | Add HMAC signature to prevent tampering |
| Returning `total_count` with cursor | Expensive to compute on large tables | Omit it, or allow via `?include_total=true` flag (cached) |
| Keyset pagination by `name` | Names can repeat | Always include a unique tiebreaker (ID) |
| Mixing pagination strategies | Confuses clients | Pick one and document it clearly |

## Sources

- [Microsoft Azure REST API Guidelines — Collections](https://github.com/microsoft/api-guidelines/blob/vNext/azure/Guidelines.md#collections)
- [PayPal API Standards — Query Parameters](https://github.com/levid-gc/paypal-api-standards/blob/master/api-style-guide.md#query-parameters)
- [PayPal Developer Docs — Pagination](https://developer.paypal.com/api/rest/requests/#query-parameters)
- [Stripe API — Pagination (cursor-based)](https://stripe.com/docs/api/pagination)
