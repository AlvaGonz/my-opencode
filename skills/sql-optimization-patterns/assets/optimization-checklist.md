# Query Optimization Checklist

> 20-item review checklist for SQL query and schema performance.
> Use this when reviewing a query, designing a new schema, or debugging a slow
> endpoint.

---

## Index Coverage (Items 1–5)

### 1. WHERE clause columns are indexed
- [ ] Every column in `WHERE` has an index (single or composite).
- [ ] The leading column of the index matches the most selective equality
      predicate.
- [ ] OR conditions are minimized or rewritten as UNION/IN.

### 2. JOIN columns are indexed
- [ ] Foreign key columns in the child table have an index.
- [ ] The join column index is used (check `EXPLAIN` for Index Scan).
- [ ] The inner table of a Nested Loop has an index on the join key.

### 3. ORDER BY is index-backed
- [ ] The ORDER BY clause matches an index column order and direction.
- [ ] The plan shows no explicit `Sort` node (or Sort is cheap).
- [ ] Mix of ASC/DESC in ORDER BY matches index definition.

### 4. Covering index potential
- [ ] All selected columns are in the index (Index Only Scan possible).
- [ ] If not, consider `INCLUDE` for frequently queried extra columns.
- [ ] No `SELECT *` in hot paths (breaks covering index).

### 5. Partial indexes for filters
- [ ] Queries with constant filter conditions (e.g., `WHERE status = 'ACTIVE'`)
      have a partial index on that subset.
- [ ] Soft-delete / archived rows are excluded from the active index.

---

## Join Strategy (Items 6–8)

### 6. Join order is optimal
- [ ] The smallest result set drives the join (outermost).
- [ ] `EXPLAIN (ANALYZE)` shows no unexpectedly high row counts in early joins.

### 7. Nested Loop is appropriate
- [ ] The outer table is small (< 1000 rows).
- [ ] The inner table lookup uses an index (not a seq scan).
- [ ] Loop count is not excessive (watch for thousands of loops).

### 8. Hash/Merge Join when appropriate
- [ ] For large, unindexed joins: Hash Join fits in `work_mem` (no temp spill).
- [ ] For large, pre-sorted datasets: Merge Join preferred.
- [ ] Work memory is sized correctly (check `temp written` in EXPLAIN).

---

## Subquery vs CTE vs Lateral Join (Items 9–11)

### 9. Subqueries are correlated correctly
- [ ] Correlated subqueries are converted to JOIN/LATERAL when returning
      multiple rows.
- [ ] EXISTS is preferred over `IN (SELECT ...)` for large subquery results.
- [ ] Subqueries in WHERE are not re-executed per row (check loops).

### 10. CTEs are materialized appropriately
- [ ] PostgreSQL 12+: CTE materialization is explicit (use
      `MATERIALIZED`/`NOT MATERIALIZED`).
- [ ] CTEs used multiple times are materialized; CTEs used once are not.
- [ ] CTEs don't act as optimization fences (PG < 12).

### 11. LATERAL is considered
- [ ] For top-N-per-group, `LATERAL` + `LIMIT` is used instead of window
      functions or subqueries.
- [ ] LATERAL join is used when the right-side query references left-side
      columns.

---

## Pagination (Items 12–13)

### 12. Keyset pagination used (not OFFSET)
- [ ] Large OFFSET values are avoided (OFFSET 100000 is slow).
- [ ] Keyset pagination (`WHERE id > last_seen ORDER BY id LIMIT 20`) is used
      for deep pages.
- [ ] The keyset column(s) are indexed.

### 13. LIMIT/OFFSET has an index
- [ ] ORDER BY columns for pagination have a matching index.
- [ ] No extra Sort node for pagination queries.

---

## N+1 Detection (Items 14–16)

### 14. Application-level N+1
- [ ] ORM logs show `N+1` queries in a loop (e.g., Hibernate, Entity Framework).
- [ ] Batch loading / eager loading is used where applicable.
- [ ] Use `pg_stat_statements` to identify repetitive identical queries.

### 15. Database-level N+1 (Nested Loop)
- [ ] EXPLAIN shows a Nested Loop with a large number of loops on the inner
      side.
- [ ] The inner scan is Index Scan, not Seq Scan.
- [ ] If unavoidable, increase `work_mem` or consider a Hash Join hint.

### 16. Batch-fetching patterns
- [ ] Queries use `IN` lists or join with a VALUES table for batch lookups.
- [ ] Single-row lookups in loops are replaced with bulk queries.

---

## Schema-Level Improvements (Items 17–20)

### 17. Data types are optimal
- [ ] Columns use the smallest appropriate type (e.g., `INT` not `BIGINT` for
      small ranges).
- [ ] No `VARCHAR` for numeric/boolean values.
- [ ] Timestamps use `TIMESTAMPTZ` (PG) or appropriate type.
- [ ] TEXT is used for unbounded strings, not `VARCHAR(255)`.

### 18. Statistics are up to date
- [ ] `ANALYZE` is run after bulk loads.
- [ ] `default_statistics_target` is high enough (100–1000) for skewed data.
- [ ] Extended statistics (`CREATE STATISTICS`) exist for correlated columns.

### 19. Write-path impact is measured
- [ ] New indexes are evaluated for INSERT/UPDATE/DELETE overhead.
- [ ] Index maintenance (autovacuum) is tuned for high-write tables.
- [ ] Fillfactor is reduced (< 100) for tables with frequent updates.

### 20. Vacuum and bloat are managed
- [ ] `pg_stat_user_tables.n_dead_tup` does not exceed `n_live_tup`.
- [ ] Table bloat is monitored (`pgstattuple` extension).
- [ ] Autovacuum settings are tuned (scale_factor, threshold) for large tables.
- [ ] `VACUUM` is scheduled for known high-churn tables.

---

## Quick Scoring

| Section | Pass | Fail | N/A |
|---------|------|------|-----|
| 1–5  Index Coverage | ☐ | ☐ | ☐ |
| 6–8  Join Strategy | ☐ | ☐ | ☐ |
| 9–11 Subquery/CTE/LATERAL | ☐ | ☐ | ☐ |
| 12–13 Pagination | ☐ | ☐ | ☐ |
| 14–16 N+1 Detection | ☐ | ☐ | ☐ |
| 17–20 Schema | ☐ | ☐ | ☐ |

**Action required**: Any "Fail" should be addressed before going to production.

---

## Sources

- [Use The Index, Luke — Indexing for Performance](https://use-the-index-luke.com)
- [Awesome Postgres — Optimization](https://github.com/dhamaniasad/awesome-postgres#optimization)
- [PostgreSQL Docs — Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)
- [pgMustard — EXPLAIN guide](https://www.pgmustard.com/)
