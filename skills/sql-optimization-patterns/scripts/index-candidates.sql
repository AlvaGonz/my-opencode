-- ============================================================================
-- index-candidates.sql
-- PostgreSQL queries to surface index problems from pg_stat_user_indexes
-- and pg_stat_user_tables.
-- Source: https://github.com/dhamaniasad/awesome-postgres (Optimization section)
-- ============================================================================

-- ============================================================================
-- 1. Unused indexes (bloat / write-overhead candidates)
-- ============================================================================
-- Indexes with zero or near-zero scans cost write overhead on INSERT/UPDATE/
-- DELETE without benefiting reads. Consider dropping them.

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelid NOT IN (
      -- Exclude primary key and unique indexes (needed for constraints)
      SELECT indexrelid
      FROM pg_index
      WHERE indisprimary OR indisunique
  )
ORDER BY pg_relation_size(indexrelid) DESC;

-- WARNING: An index with idx_scan = 0 may be used by periodic maintenance or
--          foreign key lookups from other tables. Verify with:
-- SELECT schemaname, tablename, indexname, idx_scan
-- FROM pg_stat_user_indexes
-- WHERE indexname = 'candidate_index_name';

-- ============================================================================
-- 2. Tables with high sequential scans (missing index candidates)
-- ============================================================================
-- Tables that have been seq-scanned more than 1000 times may benefit from an
-- index. Cross-reference with query patterns.

SELECT
    schemaname,
    relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    n_live_tup AS estimated_rows,
    CASE
        WHEN seq_scan + idx_scan = 0 THEN 'NO ACCESS'
        ELSE ROUND(100.0 * idx_scan / NULLIF(seq_scan + idx_scan, 0), 2)::text
    END AS idx_scan_pct,
    pg_size_pretty(pg_relation_size(relid)) AS table_size
FROM pg_stat_user_tables
WHERE seq_scan > 1000
  AND n_live_tup > 10000   -- only tables large enough to matter
ORDER BY seq_scan DESC
LIMIT 30;

-- If idx_scan_pct < 10 % and the table has WHERE / JOIN columns → index needed.

-- ============================================================================
-- 3. Index hit rate < 99 % (cache efficiency problem)
-- ============================================================================
-- Low cache hit ratio on an index means the working set does not fit in
-- shared_buffers or the index is rarely used.

SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    CASE
        WHEN idx_scan = 0 THEN 'N/A (no scans)'
        ELSE ROUND(
            100.0 * (idx_blks_hit) / NULLIF(idx_blks_hit + idx_blks_read, 0),
            2
        )::text || ' %'
    END AS idx_hit_ratio
FROM pg_stat_user_indexes
WHERE
    -- hit ratio computed from pg_statio_user_indexes (block-level)
    (SELECT
         ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0), 2)
     FROM pg_statio_user_indexes s
     WHERE s.indexrelid = pg_stat_user_indexes.indexrelid
    ) < 99.0
    AND idx_scan > 0
ORDER BY idx_scan DESC;

-- Full view of all index hit ratios (unfiltered):
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    ROUND(100.0 * idx_blks_hit / NULLIF(idx_blks_hit + idx_blks_read, 0), 2) AS hit_ratio
FROM pg_statio_user_indexes
WHERE idx_blks_hit + idx_blks_read > 0
ORDER BY hit_ratio ASC
LIMIT 20;

-- ============================================================================
-- 4. Index size vs table size (bloat indicators)
-- ============================================================================
-- An index larger than its table is often bloated (dead tuples not reclaimed).

SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    (SELECT pg_size_pretty(pg_relation_size(relid))
     FROM pg_stat_user_tables t
     WHERE t.relid = pg_stat_user_indexes.indrelid) AS table_size
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > (
    SELECT pg_relation_size(relid)
    FROM pg_stat_user_tables t
    WHERE t.relid = pg_stat_user_indexes.indrelid
) * 1.5  -- index is 50%+ larger than table → bloat
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- 5. Redundant / duplicate indexes
-- ============================================================================
-- Indexes sharing the same leading columns are redundant.

SELECT
    a.indrelid::regclass AS table_name,
    pg_get_indexdef(a.indexrelid) AS index_a,
    pg_get_indexdef(b.indexrelid) AS index_b,
    pg_size_pretty(pg_relation_size(a.indexrelid)) AS size_a,
    pg_size_pretty(pg_relation_size(b.indexrelid)) AS size_b
FROM pg_index a
JOIN pg_index b
    ON a.indrelid = b.indrelid
    AND a.indexrelid < b.indexrelid
    AND a.indkey[0:2] = b.indkey[0:2]  -- first two columns match
WHERE a.indisprimary = false
  AND b.indisprimary = false
ORDER BY table_name;

-- ============================================================================
-- 6. Tables missing indexes entirely (excl. very small tables)
-- ============================================================================

SELECT
    schemaname,
    relname AS table_name,
    n_live_tup AS row_estimate,
    seq_scan,
    idx_scan
FROM pg_stat_user_tables
WHERE n_live_tup > 1000
  AND idx_scan = 0
ORDER BY n_live_tup DESC;

-- ============================================================================
-- Bonus: pg_stat_statements integration for index suggestions
-- ============================================================================
-- Requires pg_stat_statements extension:
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT
    query,
    calls,
    ROUND(total_exec_time::numeric / calls, 2) AS avg_ms,
    shared_blks_hit,
    shared_blks_read,
    ROUND(100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0), 2) AS hit_ratio
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
  AND upper(query) LIKE '%WHERE%'          -- queries with filter conditions
  AND shared_blks_read > 1000              -- substantial disk reads
ORDER BY total_exec_time DESC
LIMIT 20;

-- ============================================================================
-- Sources
-- ============================================================================
-- https://github.com/dhamaniasad/awesome-postgres — Optimization tools section
-- https://www.postgresql.org/docs/current/monitoring-stats.html
-- https://use-the-index-luke.com — Index design fundamentals
