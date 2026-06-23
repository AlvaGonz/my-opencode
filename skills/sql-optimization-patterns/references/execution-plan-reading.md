# Execution Plan Reading

> Guide focused on PostgreSQL EXPLAIN output interpretation.
> Source: https://use-the-index-luke.com

## Output Structure

PostgreSQL plans are a node tree. Each node shows:

```
->  Node Type  (cost=startup..total rows=width)
    Actual Time: start..end  Rows: actual  Loops: N
    Buffers: shared hit=X read=Y
```

Read **inside-out** or **bottom-up**: the innermost/leaf nodes feed rows to
their parent.

## Scan Types

### Sequential Scan (Seq Scan)
```
Seq Scan on large_table  (cost=0.00..1000.00 rows=50000 width=100)
  Filter: (status = 'ACTIVE')
  Rows Removed by Filter: 95000
```

- Reads every page of the table.
- **Good when**: table is small (< shared_buffers), or query returns > 10%
  of rows.
- **Bad when**: table is large and Filter removes most rows.
- **Fix**: add an index on the filter column.

### Index Scan
```
Index Scan using idx_status on large_table  (cost=0.29..50.11 rows=500 width=100)
  Index Cond: (status = 'ACTIVE')
```

- Navigates the B-tree to find matching entries, then fetches heap tuples.
- **Good when**: query is selective (few rows).
- **Look for**: `Index Cond` vs `Filter` — conditions in Index Cond are
  evaluated at the index level (faster). Filter means the row was fetched from
  the heap and then checked (slower).

### Index Only Scan
```
Index Only Scan using idx_covering on orders  (cost=0.29..10.11 rows=50 width=30)
  Index Cond: (customer_id = 42)
```

- Returns data directly from the index without touching the heap.
- **Ideal** — lowest I/O for selective queries.
- **Visibility map**: requires a visibility check; if many pages are
  "all-visible", no heap fetch needed.
- **Heap Fetches > 0** → autovacuum may be falling behind.

### Bitmap Scan (combines multiple indexes)
```
Bitmap Heap Scan on large_table  (cost=100.50..500.00 rows=5000 width=100)
  Recheck Cond: ((status = 'ACTIVE') OR (priority = 1))
  -> BitmapOr
       -> Bitmap Index Scan on idx_status  (cost=0.00..50.25 rows=3000)
       -> Bitmap Index Scan on idx_priority (cost=0.00..50.25 rows=2500)
```

- Builds a bitmap of matching page addresses, then fetches pages.
- **Good when**: multiple indexes exist and the query combines them.
- **Watch for**: `Recheck Cond` — the bitmap is approximate, so each fetched
  row is re-checked. High false-positive rate hurts performance.

## Join Strategies

### Nested Loop
```
Nested Loop  (cost=0.50..1500.00 rows=100 width=50)
  ->  Seq Scan on small_table  (cost=0.00..100.00 rows=1000 width=20)
  ->  Index Scan using idx_fk on large_table  (cost=0.50..1.00 rows=1 width=30)
        Index Cond: (fk_id = small_table.id)
```

- For each row in the outer (top) table, scan the inner table.
- **Good when**: outer table is small and inner lookup is indexed.
- **Bad when**: outer table is large or inner table lacks an index (triggers
  a full scan per outer row → O(n*m) cost).
- **Loops > 1** on the inner scan is expected; loops > 1000 on a large inner
  table is a problem.

### Hash Join
```
Hash Join  (cost=500.00..2000.00 rows=10000 width=60)
  Hash Cond: (a.id = b.a_id)
  ->  Seq Scan on table_a  (cost=0.00..300.00 rows=10000 width=30)
  ->  Hash  (cost=100.00..100.00 rows=5000 width=30)
        ->  Seq Scan on table_b  (cost=0.00..100.00 rows=5000 width=30)
```

- Builds a hash table from one side, probes with the other.
- **Good when**: one table fits in `work_mem` and no index exists on the join
  column.
- **Bad when**: hash table spills to disk (shown as "temp written=..." in
  EXPLAIN ANALYZE output) → increase `work_mem`.

### Merge Join
```
Merge Join  (cost=800.00..2500.00 rows=20000 width=60)
  Merge Cond: (a.id = b.a_id)
  ->  Sort  (cost=400.00..450.00 rows=10000 width=30)
        Sort Key: a.id
        ->  Seq Scan on table_a ...
  ->  Index Scan using idx_b_aid on table_b ...
```

- Both inputs must be sorted on the join key.
- **Good when**: one or both inputs are already sorted (e.g., from an index or
  ORDER BY).
- **Bad when**: explicit `Sort` nodes are expensive for large datasets.

## Cost Estimates vs Actual Rows

The single most important check in a plan:

```
Rows Removed by Index Recheck: 0
Rows Removed by Filter: 95000
```

- If **estimated rows** matches **actual rows** → statistics are accurate.
- If **estimated rows** >> **actual rows** → overestimate → planner may pick
  an index scan when a seq scan would be better.
- If **estimated rows** << **actual rows** → underestimate → planner may pick
  a nested loop when a hash join is needed.

**Fix stale estimates:**
```sql
ANALYZE table_name;           -- refresh statistics
SET default_statistics_target = 1000;  -- increase sample size
ALTER TABLE table_name ALTER COLUMN column_name SET STATISTICS 1000;
```

## How to Spot Filter Inefficiencies

### Filter on an index scan (expensive)
```
Index Scan on orders  (cost=0.29..50.11 rows=500 width=100)
  Index Cond: (customer_id = 42)
  Filter: (status = 'ACTIVE')     ← Filter applied AFTER fetching heap row
```

- The index locates rows by `customer_id`, but `status` is not in the index.
- **Fix**: include `status` in the index as a second column or as INCLUDE.

### Rows Removed by Filter (high percentage)
```
Seq Scan on products  (cost=0.00..2000.00 rows=100 width=50)
  Filter: (category = 'electronics')
  Rows Removed by Filter: 99000     ← 99 % of rows discarded
```

- Clear sign of a missing index on `category`.

### Implicit type conversion filter
```
Filter: (price = '100')             ← price is NUMERIC but '100' is text
```
- Causes a cast on every row. Fix: use a correctly typed literal (`price = 100`).

## Key Metrics Reference

| Metric | What it means | Target |
|--------|---------------|--------|
| `actual time` | Real elapsed wall-clock time (ms) | Lower is better |
| `rows` (actual) | Real row count | Match estimate |
| `loops` | How many times node executed | 1 for seq/node scans |
| `shared hit` | Pages read from buffer cache | High = fast |
| `shared read` | Pages read from disk | Low = good |
| `temp written` | Spilled to disk (work_mem exceeded) | 0 |
| `Planning Time` | Time to generate plan | < 100 ms |
| `Execution Time` | Total runtime | < threshold |

## Plan Reading Checklist

1. Is the scan type appropriate for the table size and selectivity?
2. Do estimated rows match actual rows (within 10x)?
3. Are there Filter nodes that should be Index Cond?
4. Are Nested Loop inner scans indexed?
5. Is there a Sort node that could be avoided by an index?
6. Are `temp written` blocks > 0 (work_mem too small)?
7. Is `shared_read` high (buffers not warm)?
8. Are there `Rows Removed by Filter` that exceed returned rows?

## Sources

- [Use The Index, Luke — Execution Plans](https://use-the-index-luke.com/sql/execution-plans)
- [PostgreSQL Docs — Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- [PostgreSQL Docs — Planner Statistics](https://www.postgresql.org/docs/current/planner-stats.html)
- [PEV2 — Postgres Explain Visualizer](https://github.com/dalibo/pev2)
