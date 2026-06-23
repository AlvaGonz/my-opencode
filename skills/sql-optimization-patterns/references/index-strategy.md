# Index Strategy Reference

> Patterns based on https://use-the-index-luke.com

## B-Tree Index Internals

- **Structure**: Balanced tree with a root, internal branches, and leaf nodes.
  Leaf nodes form a **doubly linked list** for efficient range scans.
- **Height**: Typical B-tree height is 3–5 for millions of rows. Each level
  adds ~1 pointer dereference.
- **Leaf nodes**: Store index entries + heap tuple pointer (CTID in PG).
  Scanning the leaf level = index range scan.
- **Page size**: Typically 8 KB (PostgreSQL default). The number of entries per
  page depends on key size.

```
Root     [50]
        /    \
Branch [10,30] [70,90]
        |   |    |   \
Leaf   [1] [11] [51] [91] ...
```

## The Equality–Range–Order Rule

When designing a **composite index**, place columns in this priority:

1. **Equality** — columns compared with `=` or `IN`
2. **Range** — columns compared with `>`, `<`, `BETWEEN`, `LIKE` (prefix)
3. **Order** — columns in `ORDER BY`

**Example:**

```sql
CREATE INDEX idx_orders
ON orders (customer_id, order_date DESC, status);

-- Optimized for:
SELECT *
FROM orders
WHERE customer_id = 123           -- equality
  AND order_date > '2025-01-01'   -- range
ORDER BY status;                  -- order
```

> **Why?** The first equality column narrows the tree search to a subtree.
> Range columns are then constrained within that subtree. Finally, the
> remaining ORDER BY column can be read in sorted order without a Sort node.

## Index Selectivity

- **High selectivity** (few rows per index entry) → index is effective.
- **Low selectivity** (many rows per index entry, e.g., boolean column) →
  index may be ignored by the optimizer. The planner switches to a seq scan
  when it estimates retrieving >5–10% of the table.

**Rule of thumb:** An index on a column with < 20% distinct values (e.g.,
`gender`) is rarely used for lookup but may help for **index-only scans**
or **clustered access**.

## Composite Index Column Ordering

- **Most selective first** (for equality): `WHERE a = 1 AND b = 2` → index
  on `(a, b)` is usually better than `(b, a)` if `a` is more selective.
- **Column order matters for range**: once a range condition is used, columns
  after it in the index cannot be used for equality lookups.

```sql
-- Index: (last_name, first_name)
SELECT * FROM users
WHERE last_name = 'Smith'          -- index used (equality)
  AND first_name LIKE 'J%';        -- index used (range)

SELECT * FROM users
WHERE first_name = 'John'          -- index NOT used (leading column missing)
  AND last_name = 'Smith';
```

- **OR conditions** usually prevent index usage unless the DB can transform
  them into an `IN` list.

## Covering Indexes (INCLUDE columns)

A covering index contains **all columns** needed by a query so the DB never
touches the heap table. In PostgreSQL 11+ you can use `INCLUDE`:

```sql
CREATE INDEX idx_covering
ON orders (customer_id, order_date)
INCLUDE (total_amount, status);

-- This query can be served entirely from the index:
SELECT customer_id, order_date, total_amount, status
FROM orders
WHERE customer_id = 42;
```

The `INCLUDE` columns are stored only in the leaf level (not in the B-tree
structure), so they don't affect tree branching but add leaf-page space.

**Trade-off**: Wider indexes = more leaf pages = slower inserts/updates.

## Partial Indexes

Index only a subset of rows to save space and speed up targeted queries:

```sql
CREATE INDEX idx_active_orders
ON orders (order_date, total_amount)
WHERE status = 'ACTIVE';

-- This query uses the partial index:
SELECT order_date, total_amount
FROM orders
WHERE status = 'ACTIVE'
  AND order_date > '2025-01-01';

-- This query does NOT use the partial index (wrong status):
SELECT order_date, total_amount
FROM orders
WHERE status = 'PENDING';
```

**Use cases**: soft-delete filters (`WHERE deleted_at IS NULL`), status-based
workflows, multi-tenant boolean flags.

PostgreSQL automatically includes the `WHERE` condition as an **implicit
predicate** — the planner knows the index only contains matching rows.

## NULLs in Indexes

In PostgreSQL, **NULLs are stored in unique indexes** (unlike other DBs).
Every B-tree index is effectively a partial index because NULLs are excluded
from unique constraint enforcement:

```sql
CREATE UNIQUE INDEX idx_unique_email
ON users (email);

-- These both succeed because NULL != NULL:
INSERT INTO users (email) VALUES (NULL);
INSERT INTO users (email) VALUES (NULL);
```

For queries with `IS NULL`, the index **can** be used starting from PG 8.3+:

```sql
CREATE INDEX idx_deleted_at ON users (deleted_at);
SELECT * FROM users WHERE deleted_at IS NULL;  -- uses index
```

## Function-Based Indexes

When queries wrap columns in functions, a normal index is invisible:

```sql
-- Without index: full seq scan
SELECT * FROM users WHERE UPPER(email) = 'USER@EXAMPLE.COM';

-- Fix: create a function-based index
CREATE INDEX idx_users_upper_email ON users (UPPER(email));

-- PostgreSQL-specific: can also use an expression index
CREATE INDEX idx_users_lower_email ON users (LOWER(email));
```

## Indexing for ORDER BY

An index can satisfy `ORDER BY` without a separate sort if the index order
matches:

```sql
CREATE INDEX idx_orders_date
ON orders (order_date DESC);

SELECT * FROM orders ORDER BY order_date DESC LIMIT 20;
-- No Sort node → Index Scan Backward
```

**Direction matters**: `(a ASC, b DESC)` must match `ORDER BY a ASC, b DESC`.

## Indexing for JOINs

For every join column that is **not a primary key**, create an index:

```sql
CREATE INDEX idx_orders_customer_id ON orders (customer_id);

SELECT *
FROM customers c
JOIN orders o ON o.customer_id = c.id   -- index on o.customer_id used
WHERE c.id = 42;
```

This converts a Nested Loop with a full inner-table scan into a fast index
lookup per outer row.

## Indexing for LIKE

- **Prefix LIKE** (`LIKE 'abc%'`) can use a B-tree index.
- **Suffix LIKE** (`LIKE '%abc'`) cannot. Use trigram indexes instead.

```sql
-- Prefix: uses B-tree
CREATE INDEX idx_name ON users (name);
SELECT * FROM users WHERE name LIKE 'Smith%';

-- Suffix: needs pg_trgm
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_name_trgm ON users USING gin (name gin_trgm_ops);
SELECT * FROM users WHERE name LIKE '%Smith%';
```

## Sources

- [Use The Index, Luke — Anatomy of an Index](https://use-the-index-luke.com/sql/anatomy)
- [Use The Index, Luke — The Where Clause](https://use-the-index-luke.com/sql/where-clause)
- [Use The Index, Luke — Sorting and Grouping](https://use-the-index-luke.com/sql/sorting-grouping)
- [PostgreSQL Docs — Indexes](https://www.postgresql.org/docs/current/indexes.html)
