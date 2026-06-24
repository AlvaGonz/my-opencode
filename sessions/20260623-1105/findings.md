# Findings ‚Äî Session 20260623-1105
> Created: 2026-06-23T15:05:43.960Z
> Last updated: 2026-06-23T11:10:00Z

## Findings

### 1. Skill Discovery Results
- **84 valid skills** discovered via scanner.mjs + registry.mjs
- **1 discarded** (design-taste-frontend ‚Äî file too large at 88332 bytes)
- Circuit Breakers remained **CLOSED** throughout all operations

### 2. Test Suite Status (Layer 1 Gate)
- Auto-detected: **vitest** (confirmed via package.json: `"vitest": "^4.1.9"`)
- Result: **‚ùå FAIL** ‚Äî 20 failed test files, 25 failed tests
- Root causes identified:
  - React 19 hook version mismatches (react-dom 19.2.6 vs react 19.0.0)
  - Missing Leaflet asset files (marker-icon-2x.png, marker-shadow.png)
  - Playwright test imported as vitest module (test.describe() conflict)
  - Missing `expect` global in jest-dom setup

### 3. Pipeline Behavior
- **Fail-fast guard works**: Pipeline correctly blocks on Layer 1 failure
- **Windows compatibility issue**: run-pipeline.sh is bash-only; individual steps work via PowerShell
- **GROQ_API_KEY dependency**: Full LLM pipeline bypasses without API key

### 4. Skill Registry Composition
| Category | Count | Key Skills |
|----------|-------|------------|
| Development | ~25 | typescript-expert, nodejs-best-practices, vite, vitest |
| Testing | ~10 | playwright-skill, csharp-xunit, test-driven-development |
| Security | ~8 | owasp-security, security-audit, security-guardrails |
| Architecture | ~6 | architecture, architecture-patterns |
| UI/UX | ~8 | frontend-design, tailwind-css-patterns |
| DevOps | ~6 | github-actions-templates, git-advanced-workflows |
| Workflow | ~4 | opencode-workflow-engine, opencode-skill-orchestrator |
| Other | ~17 | planning-with-files, reference-builder, web-coder |

### 5. Branch Created
- **Branch name:** `demo/opencode-skill-orchestrator-pipeline`
- **Base:** `feat-a`
- **Added:** `docs/orchestrator-pipeline-demo-20260623.md`

## MCP Connection State ó 2026-06-23T14:50:44Z

### Active Server Registry
| Server ID | Type | Status | Tools Available |
|---|---|---|---|
| mssql | stdio (npx) | ? ACTIVE | 14 tools |
| github-mcp-server | stdio (docker) | ? ACTIVE | ~10+ tools |
| context7-mcp | stdio (npx) | ? ACTIVE | 2 tools |
| awesome-copilot | stdio (docker) | ? ACTIVE | .NET tools |
| StitchMCP | HTTP (mcp-remote) | ? ACTIVE | UI Design tools |
| mongodb-mcp-server | stdio (npx) | ? DISABLED | 0 |
| sequential-thinking | stdio (npx) | ? DISABLED | 0 |

### Server Details
- **mssql** v2.3.4 ó SQL Server database MCP. Tools: connect, disconnect, run_sql_query, list_schema_objects, describe_table_columns, read_table_rows, execute_stored_procedure, list_databases
- **github-mcp-server** ó GitHub API via Docker. Tools: push_files, pull_request_read, issue_write, search_code, etc.
- **context7-mcp** v2.1.4 ó Documentation retrieval. Tools: resolve-library-id, query-docs
- **awesome-copilot** ó Microsoft .NET Copilot sample via Docker
- **StitchMCP** ó Google Stitch UI Design via HTTP/mcp-remote
- **mongodb-mcp-server** ó DISABLED (mongoDB connection)
- **sequential-thinking** ó DISABLED

### Blocked Workflows
- **NONE** ó All 16 workflows have their required MCPs in ? ACTIVE state

### Session MCP Budget
- Max tool calls this session: controlled by DenialOfWalletGuard (MAX_CALLS_PER_RUN=26)
- MCP calls count toward this budget.
- MCP call log: .opencode/agents/sessions/20260623-1105/mcp-call-log.md

### MCP Config Location
- C:\Users\Admin\.opencode\mcp.json
- Integrated: 7 servers total (5 active, 2 disabled)
