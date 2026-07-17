/**
 * Codebase Memory MCP Integration Plugin
 * 
 * Provides hooks and utilities for integrating the codebase-memory-mcp
 * server with OpenCode sessions. Automatically indexes the workspace
 * on session start and provides helper functions for common operations.
 */

import { definePlugin } from "@opencode/plugin";

export default definePlugin({
  name: "cbm-integration",
  version: "1.0.0",
  description: "Codebase Memory MCP integration for automatic indexing and context retrieval",
  
  hooks: {
    "session:start": async (ctx) => {
      const { workspace } = ctx;
      console.log(`[CBM] Session started for workspace: ${workspace}`);
      
      // Auto-index the workspace on session start
      try {
        const result = await ctx.mcp.call("codebase-memory-mcp", "index_repository", {
          repo_path: workspace,
          mode: "fast",
          persistence: true
        });
        console.log(`[CBM] Indexing complete: ${result.status}`);
      } catch (err) {
        console.warn(`[CBM] Auto-index failed (non-blocking): ${err.message}`);
      }
    },
    
    "session:stop": async (ctx) => {
      console.log(`[CBM] Session ended`);
    },
    
    "pre:tool": async (ctx, tool) => {
      // Inject CBM context for relevant tools
      if (["read", "write", "edit", "grep", "glob"].includes(tool.name)) {
        // Could add pre-fetch logic here if needed
      }
    }
  },
  
  commands: {
    "cbm:index": {
      description: "Index the current workspace with codebase-memory-mcp",
      async handler(ctx, args) {
        const mode = args.mode || "full";
        const result = await ctx.mcp.call("codebase-memory-mcp", "index_repository", {
          repo_path: ctx.workspace,
          mode,
          persistence: true
        });
        return `Indexing ${mode} mode: ${result.status}`;
      }
    },
    
    "cbm:search": {
      description: "Search the codebase knowledge graph",
      async handler(ctx, args) {
        const { query, limit = 20, label, file_pattern } = args;
        const result = await ctx.mcp.call("codebase-memory-mcp", "search_graph", {
          project: ctx.workspace.split(/[\\/]/).pop() || "workspace",
          query,
          limit,
          label,
          file_pattern
        });
        return JSON.stringify(result, null, 2);
      }
    },
    
    "cbm:trace": {
      description: "Trace call paths for a function",
      async handler(ctx, args) {
        const { function_name, direction = "both", depth = 3 } = args;
        const result = await ctx.mcp.call("codebase-memory-mcp", "trace_path", {
          project: ctx.workspace.split(/[\\/]/).pop() || "workspace",
          function_name,
          direction,
          depth
        });
        return JSON.stringify(result, null, 2);
      }
    },
    
    "cbm:architecture": {
      description: "Get high-level architecture overview",
      async handler(ctx, args) {
        const { aspects = ["all"] } = args;
        const result = await ctx.mcp.call("codebase-memory-mcp", "get_architecture", {
          project: ctx.workspace.split(/[\\/]/).pop() || "workspace",
          aspects
        });
        return JSON.stringify(result, null, 2);
      }
    },
    
    "cbm:status": {
      description: "Check indexing status",
      async handler(ctx) {
        const result = await ctx.mcp.call("codebase-memory-mcp", "index_status", {
          project: ctx.workspace.split(/[\\/]/).pop() || "workspace"
        });
        return JSON.stringify(result, null, 2);
      }
    },
    
    "cbm:adr": {
      description: "Manage Architecture Decision Records",
      async handler(ctx, args) {
        const { mode = "get", content, sections } = args;
        const result = await ctx.mcp.call("codebase-memory-mcp", "manage_adr", {
          project: ctx.workspace.split(/[\\/]/).pop() || "workspace",
          mode,
          content,
          sections
        });
        return JSON.stringify(result, null, 2);
      }
    }
  },
  
  // Provide context functions for agents
  context: {
    "cbm:search": async (ctx, query: string, options?: any) => {
      return ctx.mcp.call("codebase-memory-mcp", "search_graph", {
        project: ctx.workspace.split(/[\\/]/).pop() || "workspace",
        query,
        ...options
      });
    },
    
    "cbm:get_code": async (ctx, qualified_name: string) => {
      return ctx.mcp.call("codebase-memory-mcp", "get_code_snippet", {
        project: ctx.workspace.split(/[\\/]/).pop() || "workspace",
        qualified_name
      });
    },
    
    "cbm:trace": async (ctx, function_name: string, options?: any) => {
      return ctx.mcp.call("codebase-memory-mcp", "trace_path", {
        project: ctx.workspace.split(/[\\/]/).pop() || "workspace",
        function_name,
        ...options
      });
    }
  }
});