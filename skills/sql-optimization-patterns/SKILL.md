---
name: sql-optimization-patterns
description: Optimize SQL queries, design database indexes, debug slow queries, fix N+1 problems, read execution plans, and improve overall database performance.
trigger: "when the user asks to optimize a SQL query, design indexes, debug slow queries, fix N+1 problems, read an execution plan, or improve database performance"
scope: database-performance
version: "1.0"
sources:
  - https://use-the-index-luke.com
  - https://github.com/dhamaniasad/awesome-postgres
  - https://github.com/jarulraj/sqlcheck
---

# SQL Optimization Patterns Skill

## Purpose

Diagnose and fix SQL performance problems by applying index design rules, query
anti-pattern detection, execution plan analysis, and schema-level improvements.
This skill focuses on **PostgreSQL** but includes cross-database patterns for
MySQL, SQL Server, and Oracle.

## How to Use

1.  **Identify the symptom**: slow query, high CPU, N+1 in logs, seq scan on a
    large table, or timeout.
2.  **Read** `references/index-strategy.md` to verify index coverage.
3.  **Run** one of the diagnostics:
    - `scripts/explain-analyzer.sql` — parameterized EXPLAIN ANALYZE templates
    - `scripts/index-candidates.sql` — find unused / missing indexes from
      `pg_stat_*` views
4.  **Check** `references/query-anti-patterns.md` for common mistakes.
5.  **Read** `references/execution-plan-reading.md` to interpret the plan.
6.  **Apply fixes** and verify with `assets/optimization-checklist.md`.

## Reference Files

| File | Content |
|------|---------|
| `scripts/explain-analyzer.sql` | EXPLAIN ANALYZE templates for PG / MySQL / SQL Server |
| `scripts/index-candidates.sql` | Locate unused indexes, seq-scan-heavy tables, low hit rate |
| `references/index-strategy.md` | B-tree internals, composite index design, covering/partial indexes |
| `references/query-anti-patterns.md` | Top 20 SQL anti-patterns from sqlcheck |
| `references/execution-plan-reading.md` | Seq Scan vs Index Scan, join strategies, cost vs actual rows |
| `assets/optimization-checklist.md` | 20-item query review checklist |

## Gotchas

- **Index != silver bullet.** Over-indexing hurts write throughput. Always
  measure write workload before adding indexes.
- **EXPLAIN without ANALYZE shows estimates only.** Always use `EXPLAIN
  (ANALYZE, BUFFERS)` for real costs.
- **N+1 is not always visible in a single query.** Look at application-level
  loop patterns (ORM logs, network round-trips).
- **pg_stat_user_indexes resets on restart.** Sample periodically and store
  history.
- **sqlcheck detects patterns, not context.** A `SELECT *` in an export script
  is fine; a `SELECT *` in an API hot-path is not.

## Sources

- [Use The Index, Luke](https://use-the-index-luke.com) — Markus Winand's
  comprehensive SQL indexing e-book
- [Awesome Postgres](https://github.com/dhamaniasad/awesome-postgres) — curated
  list of PostgreSQL tools and resources
- [sqlcheck](https://github.com/jarulraj/sqlcheck) — automated SQL anti-pattern
  detection tool
