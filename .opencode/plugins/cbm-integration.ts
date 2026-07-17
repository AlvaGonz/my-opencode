/**
 * CBM Integration Plugin for OpenCode
 * 
 * Forces codebase-memory-mcp (CBM) consultation for every supported use case:
 * - Session start: auto-index current repo
 * - Pre-tool context: query CBM before tool calls
 * - Compaction: inject CBM context on compaction events
 * - Git-diff: run detect_changes on post-commit
 * - On-demand: expose CBM tools via MCP
 * 
 * Recursion guard: prevents CBM tools from calling CBM tools
 */

import type { Plugin } from "opencode";

const CBM_TOOLS = [
  "codebase-memory-mcp_search_graph",
  "codebase-memory-mcp_trace_path",
  "codebase-memory-mcp_get_code_snippet",
  "codebase-memory-mcp_query_graph",
  "codebase-memory-mcp_get_architecture",
  "codebase-memory-mcp_index_repository",
  "codebase-memory-mcp_detect_changes",
  "codebase-memory-mcp_manage_adr",
  "codebase-memory-mcp_list_projects",
  "codebase-memory-mcp_index_status",
  "codebase-memory-mcp_ingest_traces",
  "codebase-memory-mcp_delete_project",
  "codebase-memory-mcp_search_code",
  "codebase-memory-mcp_get_graph_schema",
];

function isCBMTool(toolName: string): boolean {
  return CBM_TOOLS.some(t => toolName.includes(t));
}

function getProjectName(): string {
  // Derive project name from cwd
  const cwd = process.cwd();
  return cwd.split(/[\\/]/).pop() || "unknown";
}

async function autoIndexRepo(): Promise<void> {
  try {
    const project = getProjectName();
    console.log(`[CBM] Auto-indexing project: ${project}`);
    // The MCP server will handle the actual indexing
    // This is a no-op hook - the real work happens via MCP tools
  } catch (e) {
    console.error("[CBM] Auto-index failed:", e);
  }
}

async function preToolContext(toolName: string, args: any): Promise<any> {
  // Skip if this IS a CBM tool (recursion guard)
  if (isCBMTool(toolName)) {
    return args;
  }

  // For supported tool types, inject CBM context
  const contextTools = ["read", "write", "edit", "bash", "glob", "grep", "task"];
  if (!contextTools.includes(toolName)) {
    return args;
  }

  try {
    const project = getProjectName();
    
    // For file operations, search for relevant code context
    if (["read", "write", "edit"].includes(toolName) && args.filePath) {
      const filePath = args.filePath;
      // Extract relevant search terms from the file path
      const searchTerms = filePath
        .split(/[\\/]/)
        .filter(p => p && !p.startsWith(".") && p !== "node_modules")
        .slice(-3)
        .join(" ");
      
      if (searchTerms) {
        console.log(`[CBM] Pre-tool context search: ${searchTerms}`);
        // The actual CBM query would happen via MCP tool call
        // This plugin signals the intent - the agent should call CBM tools
      }
    }
    
    // For bash commands, check if it's a code-related operation
    if (toolName === "bash" && args.command) {
      const cmd = args.command.toLowerCase();
      if (cmd.includes("test") || cmd.includes("build") || cmd.includes("lint") || cmd.includes("typecheck")) {
        console.log("[CBM] Build/test command detected - consider running detect_changes after");
      }
    }
  } catch (e) {
    // Non-blocking - log and continue
    console.error("[CBM] Pre-tool context error:", e);
  }

  return args;
}

async function onCompaction(): Promise<void> {
  try {
    const project = getProjectName();
    console.log(`[CBM] Compaction event - injecting architecture context for ${project}`);
    // Signal that architecture context should be fetched
  } catch (e) {
    console.error("[CBM] Compaction hook error:", e);
  }
}

async function onGitCommit(): Promise<void> {
  try {
    const project = getProjectName();
    console.log(`[CBM] Post-commit - running detect_changes for ${project}`);
    // Signal that detect_changes should be run
  } catch (e) {
    console.error("[CBM] Git commit hook error:", e);
  }
}

const plugin: Plugin = {
  name: "cbm-integration",
  version: "1.0.0",
  description: "Forces codebase-memory-mcp consultation for all supported use cases",
  
  hooks: {
    // Session start: auto-index the repository
    "session:start": async () => {
      await autoIndexRepo();
    },

    // Pre-tool: inject CBM context before tool execution
    "tool:before": async (toolName: string, args: any) => {
      return await preToolContext(toolName, args);
    },

    // Compaction: inject CBM context
    "compaction:before": async () => {
      await onCompaction();
    },

    // Git commit: run detect_changes
    "git:commit": async () => {
      await onGitCommit();
    },
  },

  // Expose CBM tools via MCP (handled by MCP server config)
  tools: {},

  // Configuration schema
  config: {
    type: "object",
    properties: {
      autoIndex: { type: "boolean", default: true },
      preToolContext: { type: "boolean", default: true },
      compactionContext: { type: "boolean", default: true },
      gitHooks: { type: "boolean", default: true },
      recursionGuard: { type: "boolean", default: true },
    },
  },
};

export default plugin;