# Workflow Engine Rules
- Always initialize session files before any task.
- Always run @opencode-post-task-hook after every completed task.
- Never skip validation gates.
- All HIGH severity issues must be addressed before commit.
- CircuitBreaker wraps all external LLM/MCP calls with MAX_RETRIES=3.
- The workflow engine operates as a DAG — never delegate back to the orchestrator.
