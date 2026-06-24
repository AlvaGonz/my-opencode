# MCP → Workflow Routing Map
**Generated**: 2026-06-23T11:05:00Z
**Session**: 20260623-1105

## Active MCP Server Registry

| Server ID | Type | Status | Protocol | Tools Available |
|---|---|---|---|---|
| mssql | stdio (npx) | ✅ ACTIVE | JSON-RPC | 14 tools (mssql_connect_database, mssql_run_sql_query, mssql_list_schema_objects, mssql_read_table_rows, mssql_execute_stored_procedure, mssql_list_databases, etc.) |
| github-mcp-server | stdio (docker) | ✅ ACTIVE | JSON-RPC | Tools: push_files, pull_request_read, issue_write, search_code, etc. |
| context7-mcp | stdio (npx) | ✅ ACTIVE | JSON-RPC | 2 tools (resolve-library-id, query-docs) |
| awesome-copilot | stdio (docker) | ✅ ACTIVE | JSON-RPC | .NET Copilot tools |
| StitchMCP | HTTP (mcp-remote) | ✅ ACTIVE | HTTP/SSE | UI Design tools via Google Stitch API |
| mongodb-mcp-server | stdio (npx) | ⭕ DISABLED | — | — |
| sequential-thinking | stdio (npx) | ⭕ DISABLED | — | — |

## Workflow Routing Table

| Workflow | Required MCPs | Status |
|---|---|---|
| opencode-feature-delivery | context7-mcp ✅ | ✅ READY |
| opencode-ci-autofix | github-mcp-server ✅, context7-mcp ✅ | ✅ READY |
| opencode-debug-session | context7-mcp ✅ | ✅ READY |
| opencode-boundary-check | context7-mcp ✅ | ✅ READY |
| opencode-codebase-audit | context7-mcp ✅ | ✅ READY |
| opencode-dead-code-sweep | context7-mcp ✅ | ✅ READY |
| opencode-frontend-restructure | context7-mcp ✅, StitchMCP ✅ | ✅ READY |
| opencode-backend-restructure | context7-mcp ✅, mssql ✅ | ✅ READY |
| opencode-memory-sync | context7-mcp ✅ | ✅ READY |
| opencode-post-task-hook | context7-mcp ✅, github-mcp-server ✅ | ✅ READY |
| opencode-coverage-backlog | context7-mcp ✅ | ✅ READY |
| opencode-error-digest | context7-mcp ✅ | ✅ READY |
| opencode-evolve-prompts | context7-mcp ✅ | ✅ READY |
| opencode-evolve-skills | context7-mcp ✅ | ✅ READY |
| opencode-security-audit | context7-mcp ✅, github-mcp-server ✅ | ✅ READY |
| opencode-agent-evolution | context7-mcp ✅ | ✅ READY |

**Result**: 16/16 workflows READY — 0 BLOCKED

## MCP Tool Call Reference by Workflow

### opencode-ci-autofix
| Phase | MCP Tool | Fallback |
|---|---|---|
| Read CI failure logs via GitHub MCP | `github-mcp-server/pull_request_read` (get_check_runs) | Read from .agents/sessions/<id>/ci-output.txt |
| Push fix | `github-mcp-server/push_files` | Local git commit |

### opencode-feature-delivery
| Phase | MCP Tool | Fallback |
|---|---|---|
| Documentation lookup (any phase) | `context7-mcp/resolve-library-id` + `context7-mcp/query-docs` | Web search |

### opencode-post-task-hook
| Phase | MCP Tool | Fallback |
|---|---|---|
| Push git commit via MCP | `github-mcp-server/push_files` | Local git commit |
| Documentation | `context7-mcp/query-docs` | Web search |

### opencode-security-audit
| Phase | MCP Tool | Fallback |
|---|---|---|
| GitHub API queries | `github-mcp-server/search_code`, `github-mcp-server/pull_request_read` | Local file inspection |
| Documentation | `context7-mcp/query-docs` | Web search |

### opencode-backend-restructure
| Phase | MCP Tool | Fallback |
|---|---|---|
| Database schema verification | `mssql/mssql_list_schema_objects`, `mssql/mssql_describe_table_columns` | Manual SQL |
| Data verification queries | `mssql/mssql_run_sql_query` (read-only) | Manual inspection |

### opencode-frontend-restructure
| Phase | MCP Tool | Fallback |
|---|---|---|
| UI design verification | `StitchMCP` (Google Stitch API) | Manual review |
| Documentation | `context7-mcp/query-docs` | Web search |

### opencode-debug-session / boundary-check / codebase-audit / dead-code-sweep / memory-sync / coverage-backlog / error-digest / evolve-prompts / evolve-skills / agent-evolution
| Phase | MCP Tool | Fallback |
|---|---|---|
| Documentation lookup | `context7-mcp/query-docs` | Web search |
| Library resolution | `context7-mcp/resolve-library-id` | Manual search |
