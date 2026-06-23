-- ============================================================================
-- explain-analyzer.sql
-- Parameterized EXPLAIN ANALYZE templates for PostgreSQL, MySQL, SQL Server.
-- Source: https://use-the-index-luke.com
-- ============================================================================
-- Instructions: replace placeholders (SCHEMA, TABLE, etc.) before running.

-- ============================================================================
-- PostgreSQL — Full diagnostics
-- ============================================================================
-- Focus on: cost, actual rows vs estimated rows, loops, buffer hit ratio.

EXPLAIN (ANALYZE, BUFFERS, TIMING, VERBOSE)
SELECT *
FROM SCHEMA.TABLE
WHERE COLUMN = 'VALUE'
  AND other_column BETWEEN 'A' AND 'B'
ORDER BY sort_column
LIMIT 100;

-- Reading the output:
--   cost=0.00..42.78  — first number = startup cost, second = total cost
--   actual time=0.035..0.042 — real wall-clock time (ms)
--   rows=10 — actual rows returned (compare to "rows=999" estimate)
--   loops=1 — how many times this node ran (watch for >1 ⇒ nested-loop issue)
--   Buffers: shared hit=42 — buffer hit ratio = hit / (hit+read)
--      100 % hit  ⇒ everything cached;  < 99 %  ⇒ disk I/O problem
--   Filter: (COLUMN = 'VALUE') — rows removed by filter = inefficiency
--   Planning Time vs Execution Time — if planning dominates, cache plans

-- ============================================================================
-- PostgreSQL — Specific scan-type templates
-- ============================================================================

-- Check if index is being used
EXPLAIN (ANALYZE, BUFFERS)
SELECT /* your query here */;

-- Compare sequential scan vs index scan
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM large_table WHERE non_indexed_column = 'X';

-- Index-only scan check (should show "Index Only Scan")
EXPLAIN (ANALYZE, BUFFERS)
SELECT indexed_column FROM large_table WHERE indexed_column = 'X';

-- ============================================================================
-- PostgreSQL — Join analysis
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS)
SELECT a.*, b.*
FROM table_a a
JOIN table_b b ON a.id = b.a_id
WHERE a.status = 'ACTIVE';

-- Watch for:
--   Nested Loop — good for small first table, bad if inner table is large
--   Hash Join — builds hash on one side; good for medium tables
--   Merge Join — requires sorted input; good for large tables pre-sorted
--   "rows=1 actual rows=100000" — huge misestimate ⇒ bad join stats

-- ============================================================================
-- PostgreSQL — Buffer analysis
-- ============================================================================

EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*) FROM large_table WHERE created_at > NOW() - INTERVAL '1 day';

-- Buffer hit ratio:  shared hit / (shared hit + shared read) * 100
--   > 99 %  ⇒ good (working set fits in shared_buffers)
--   < 95 %  ⇒ increase shared_buffers or review query
--   < 90 %  ⇒ serious I/O bottleneck

-- ============================================================================
-- PostgreSQL — Slow query diagnostics (threshold-based)
-- ============================================================================

-- Run this after enabling pg_stat_statements:
SELECT
    query,
    calls,
    total_exec_time / calls AS avg_ms,
    rows,
    shared_blks_hit,
    shared_blks_read,
    shared_blks_hit::numeric /
        NULLIF(shared_blks_hit + shared_blks_read, 0) * 100 AS hit_ratio
FROM pg_stat_statements
WHERE total_exec_time / calls > 100  -- queries slower than 100 ms avg
ORDER BY total_exec_time DESC
LIMIT 20;

-- ============================================================================
-- MySQL — EXPLAIN ANALYZE (MySQL 8.0.18+)
-- ============================================================================

EXPLAIN ANALYZE
SELECT *
FROM SCHEMA.TABLE
WHERE COLUMN = 'VALUE'
\G

-- Reading MySQL EXPLAIN ANALYZE output:
--   -> Filter: (COLUMN = 'VALUE')  (cost=xx rows=yy actual rows=zz)
--   -> Table scan on TABLE  (cost=xx rows=yy actual rows=zz)
--   actual time=0.000..0.001 — start..end time per iteration
--   rows=10 actual rows=10 — estimates vs reality
--   loops=1 — iteration count

-- Traditional MySQL EXPLAIN (for older versions):
EXPLAIN
SELECT *
FROM SCHEMA.TABLE
WHERE COLUMN = 'VALUE'
\G
-- Focus on: type (ALL = full scan, ref = index lookup, const = unique lookup),
--           key (index used), rows (estimated), Extra (Using where; Using index)

-- ============================================================================
-- SQL Server — SET STATISTICS TIME / IO
-- ============================================================================

SET STATISTICS TIME ON;
SET STATISTICS IO ON;

SELECT *
FROM SCHEMA.TABLE
WHERE COLUMN = 'VALUE';

SET STATISTICS TIME OFF;
SET STATISTICS IO OFF;

-- Reading STATISTICS IO output:
--   Table 'TABLE'. Scan count 1, logical reads 42, physical reads 0
--   logical reads  = pages read from buffer pool
--   physical reads = pages read from disk (target: 0 for cached data)

-- SQL Server — Actual Execution Plan (estimated vs actual):
SET SHOWPLAN_XML ON;
GO
SELECT * FROM SCHEMA.TABLE WHERE COLUMN = 'VALUE';
GO
SET SHOWPLAN_XML OFF;
GO

-- Or use:
--   SET STATISTICS PROFILE ON
-- to get row-by-row actual vs estimated comparison.

-- ============================================================================
-- Common patterns to look for (all engines)
-- ============================================================================
-- 1.  Seq Scan on large table + Filter with WHERE clause
--       ⇒ Missing index. Add index on filtered column.
-- 2.  "actual rows=1" but "rows=100000" in estimate
--       ⇒ Stale stats. Run ANALYZE / UPDATE STATISTICS.
-- 3.  Nested Loop with loops > 1 on the inner side and high total cost
--       ⇒ Consider Hash Join or pre-joining in CTE.
-- 4.  Sort node after an Index Scan
--       ⇒ ORDER BY column not covered by index or wrong direction.
-- 5.  Bitmap Heap Scan with many recheck conditions
--       ⇒ Correlation between indexed column and physical order is low;
--          consider CLUSTER or BRIN index.

-- ============================================================================
-- Sources
-- ============================================================================
-- https://use-the-index-luke.com — SQL indexing and execution plans
-- https://www.postgresql.org/docs/current/using-explain.html
-- https://dev.mysql.com/doc/refman/8.0/en/explain.html
-- https://learn.microsoft.com/en-us/sql/relational-databases/performance/display-an-actual-execution-plan
