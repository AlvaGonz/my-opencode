# SQL Query Anti-Patterns

> Top 20 anti-patterns detected by sqlcheck.
> Source: https://github.com/jarulraj/sqlcheck

---

## Logical Database Design Anti-Patterns

### 1. Multi-Valued Attribute
**Pattern**: Storing multiple values in a single column (comma-separated).
```sql
CREATE TABLE employees (
    id INT PRIMARY KEY,
    phone_numbers VARCHAR(500)  -- stores "555-0100,555-0101,555-0102"
);
```
**Why slow**: Violates 1NF. Any query filtering on a single value requires a
full table scan with `LIKE '%value%'`.
**Fix**: Create a child table with one row per value.
```sql
CREATE TABLE employee_phones (
    employee_id INT REFERENCES employees(id),
    phone_number VARCHAR(20),
    PRIMARY KEY (employee_id, phone_number)
);
```

### 2. Recursive Dependency
**Pattern**: Table references itself in a way that creates deep dependency chains.
```sql
CREATE TABLE org_chart (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    parent_id INT REFERENCES org_chart(id)
);
```
**Why slow**: Recursive CTEs are expensive for deep hierarchies. Without
indexing `parent_id`, each level triggers a full scan.
**Fix**: Index the foreign key and consider `ltree` or nested sets for deep
hierarchies. Avoid recursion in hot paths.

### 3. Primary Key Does Not Exist
**Pattern**: Table without a PRIMARY KEY.
```sql
CREATE TABLE orders (
    order_id INT,    -- no primary key
    customer_id INT
);
```
**Why slow**: The DB cannot efficiently locate rows. Replication and
point-in-time recovery are impaired. No uniqueness enforcement.
**Fix**: Add a primary key.
```sql
ALTER TABLE orders ADD PRIMARY KEY (order_id);
```

### 4. Generic Primary Key
**Pattern**: Using a single auto-increment column as the only key, ignoring
natural keys.
```sql
CREATE TABLE order_items (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    UNIQUE (order_id, product_id)  -- natural key exists but is secondary
);
```
**Why slow**: Joins on `order_id` + `product_id` don't use the PK; the
surrogate PK adds index write overhead.
**Fix**: Use the natural key as PK when it is stable and unique.

### 5. Foreign Key Does Not Exist
**Pattern**: Referential integrity enforced only at application level.
```sql
CREATE TABLE orders (
    id INT PRIMARY KEY,
    customer_id INT   -- no FK constraint referencing customers
);
```
**Why slow**: Orphan rows accumulate. JOINs may scan large portions of the
referenced table.
**Fix**: Add the foreign key constraint (and index it).
```sql
ALTER TABLE orders ADD FOREIGN KEY (customer_id) REFERENCES customers(id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
```

### 6. Entity-Attribute-Value (EAV) Pattern
**Pattern**: Using a generic key-value table instead of typed columns.
```sql
CREATE TABLE product_attributes (
    product_id INT,
    attribute_name VARCHAR(50),
    attribute_value VARCHAR(500)  -- all values stored as text
);
```
**Why slow**: Every query requires pivoting (multiple JOINs or aggregation).
No type validation. Indexes on `attribute_value` are useless for range scans.
**Fix**: Use typed columns or JSONB (PG) with GIN indexes.

### 7. Metadata Tribbles
**Pattern**: Columns that multiply over time (e.g., `phone1`, `phone2`, `phone3`).
```sql
CREATE TABLE contacts (
    id INT PRIMARY KEY,
    phone1 VARCHAR(20),
    phone2 VARCHAR(20),
    phone3 VARCHAR(20)
);
```
**Why slow**: Schema changes require DDL. Finding all rows with a specific
phone value requires multiple OR conditions.
**Fix**: Normalize into a child table (see anti-pattern #1).

---

## Physical Database Design Anti-Patterns

### 8. Imprecise Data Type
**Pattern**: Using `VARCHAR(255)` for everything.
```sql
CREATE TABLE users (
    age VARCHAR(10),       -- should be INT
    is_active VARCHAR(5),  -- should be BOOLEAN
    salary VARCHAR(20)     -- should be NUMERIC
);
```
**Why slow**: Larger data types consume more memory and I/O. Incorrect types
prevent the optimizer from using statistics.
**Fix**: Use exact types — `INT`, `BOOLEAN`, `NUMERIC(10,2)`, `TIMESTAMP`.

### 9. Values in Definition
**Pattern**: Hard-coding allowed values in a CHECK constraint.
```sql
CREATE TABLE orders (
    status VARCHAR(20) CHECK (status IN ('NEW','PAID','SHIPPED','CANCELLED'))
);
```
**Why slow**: Adding/removing values requires a table rewrite (DDL).
**Fix**: Use a reference table.
```sql
CREATE TABLE order_status (code VARCHAR(20) PRIMARY KEY);
ALTER TABLE orders ADD FOREIGN KEY (status) REFERENCES order_status(code);
```

### 10. Too Many Indexes
**Pattern**: Indexing every column individually.
```sql
CREATE INDEX idx_cust ON orders(customer_id);
CREATE INDEX idx_date ON orders(order_date);
CREATE INDEX idx_stat ON orders(status);
CREATE INDEX idx_amt  ON orders(total_amount);
```
**Why slow**: Each index adds write overhead on INSERT/UPDATE/DELETE.
PostgreSQL's query planner may still choose seq scans over many separate
indexes.
**Fix**: Use composite indexes aligned with query patterns.

### 11. Index Attribute Order Mismatch
**Pattern**: Index column order does not match query column order.
```sql
CREATE INDEX idx_phonebook ON accounts(last_name, first_name);
SELECT * FROM accounts ORDER BY first_name, last_name;
-- Index cannot be used for ORDER BY because column order is reversed
```
**Fix**: Align index column order with query predicates and ORDER BY.

---

## Query Anti-Patterns

### 12. SELECT *
```sql
SELECT * FROM orders WHERE customer_id = 42;
```
**Why slow**: Transfers unnecessary columns over network. Prevents index-only
scans. Breaks covering indexes when new columns are added.
**Fix**: List only the columns you need.
```sql
SELECT id, order_date, total_amount FROM orders WHERE customer_id = 42;
```

### 13. NULL Usage Confusion
```sql
SELECT * FROM items WHERE price = NULL;   -- wrong: always empty
SELECT * FROM items WHERE price IS NULL;  -- correct
```
**Why slow (misuse)**: `NULL = NULL` evaluates to `NULL`, not `TRUE`.
COALESCE on nullable columns in WHERE clauses can prevent index usage.
**Fix**: Use `IS NULL` / `IS NOT NULL`. Use `COALESCE` carefully — it wraps
the column in a function call.

### 14. String Concatenation with NULLs
```sql
SELECT first_name || ' ' || middle_name || ' ' || last_name AS full_name
FROM users;
-- Returns NULL if any part is NULL because NULL || anything = NULL
```
**Why slow**: Incorrect results cause debugging churn. If this is in a WHERE
clause, the optimizer can't use index.
**Fix**:
```sql
SELECT first_name || COALESCE(' ' || middle_name || ' ', ' ') || last_name
FROM users;
```

### 15. GROUP BY with Non-Aggregated Columns
```sql
SELECT id, name, COUNT(*)          -- id and name should be in GROUP BY
FROM orders
JOIN customers ON customers.id = orders.customer_id
GROUP BY customers.id;
```
**Why slow**: MySQL may silently return arbitrary values; PG/SQL Server reject
it. Debugging is slow.
**Fix**: Include all non-aggregated columns in GROUP BY, or use
`DISTINCT ON` (PG) / window functions.

### 16. ORDER BY RAND()
```sql
SELECT * FROM users ORDER BY RANDOM() LIMIT 1;
```
**Why slow**: Requires sorting the entire table. No index can help because
RANDOM() is non-deterministic.
**Fix** (PostgreSQL):
```sql
SELECT * FROM users OFFSET floor(random() * (SELECT COUNT(*) FROM users))
LIMIT 1;
```

### 17. LIKE with Leading Wildcard
```sql
SELECT * FROM products WHERE description LIKE '%leather%';
```
**Why slow**: Cannot use B-tree index — forces full table scan.
**Fix**: Use a trigram index (PostgreSQL) or full-text search.
```sql
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_desc_trgm ON products USING gin (description gin_trgm_ops);
```

### 18. Spaghetti Query
```sql
SELECT ...
FROM a, b, c, d, e, f
WHERE ... AND ... AND ...
GROUP BY ... HAVING ...
ORDER BY ...;
```
**Why slow**: Hard for the optimizer to find a good plan. Likely contains
Cartesian products. Hard to debug.
**Fix**: Split into CTEs or temp tables. Use `EXPLAIN (ANALYZE)` on each step.

### 19. Unnecessary JOINs + DISTINCT
```sql
SELECT DISTINCT c.id, c.name
FROM customers c
JOIN orders o ON o.customer_id = c.id;
```
**Why slow**: DISTINCT forces a sort of all result rows. The JOIN is creating
duplicates that are then removed.
**Fix**: Use EXISTS instead.
```sql
SELECT c.id, c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
```

### 20. OR on Indexed Columns
```sql
SELECT * FROM products WHERE category_id = 5 OR status = 'ACTIVE';
```
**Why slow**: OR can prevent index union. The optimizer may fall back to a
seq scan.
**Fix**: Use UNION or IN.
```sql
SELECT * FROM products WHERE category_id = 5
UNION
SELECT * FROM products WHERE status = 'ACTIVE';
```

### 21. DISTINCT + JOIN (Duplicate Producer)
```sql
SELECT DISTINCT p.*
FROM products p
JOIN inventory i ON i.product_id = p.id;
```
**Why slow**: The JOIN produces duplicates that DISTINCT removes with a sort.
**Fix**: Use EXISTS or refine the JOIN.

### 22. Implicit Columns in INSERT
```sql
INSERT INTO users VALUES ('John', 30);
-- Depends on column order; breaks when schema changes
```
**Why slow**: Brittle. Schema changes cause silent data corruption.
**Fix**: Always list columns.
```sql
INSERT INTO users (name, age) VALUES ('John', 30);
```

### 23. HAVING Instead of WHERE
```sql
SELECT customer_id, COUNT(*)
FROM orders
GROUP BY customer_id
HAVING customer_id > 100;
```
**Why slow**: Rows are grouped before filtering → more work.
**Fix**: Use WHERE for row-level filters.
```sql
SELECT customer_id, COUNT(*)
FROM orders
WHERE customer_id > 100
GROUP BY customer_id;
```

### 24. Nested Subqueries (Correlated)
```sql
SELECT *
FROM customers c
WHERE (SELECT COUNT(*) FROM orders o WHERE o.customer_id = c.id) > 5;
```
**Why slow**: The subquery runs once per row (= N queries).
**Fix**: Use a JOIN or LATERAL join (PG).
```sql
SELECT c.*
FROM customers c
JOIN (SELECT customer_id, COUNT(*) AS cnt
      FROM orders GROUP BY customer_id) o ON o.customer_id = c.id
WHERE o.cnt > 5;
```

### 25. UNION Instead of UNION ALL
```sql
SELECT * FROM current_orders
UNION
SELECT * FROM archived_orders;
```
**Why slow**: UNION removes duplicates with a sort even when no duplicates
exist (e.g., disjoint datasets).
**Fix**: Use `UNION ALL` when duplicates are impossible or acceptable.

---

## Sources

- [sqlcheck — GitHub Repository](https://github.com/jarulraj/sqlcheck)
- [sqlcheck — Logical Design Anti-patterns](https://github.com/jarulraj/sqlcheck/blob/master/docs/logical/)
- [sqlcheck — Physical Design Anti-patterns](https://github.com/jarulraj/sqlcheck/blob/master/docs/physical/)
- [sqlcheck — Query Anti-patterns](https://github.com/jarulraj/sqlcheck/blob/master/docs/query/)
- Bill Karwin, *SQL Anti-patterns: Avoiding the Pitfalls of Database Programming*
