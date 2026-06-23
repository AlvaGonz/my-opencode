---
name: groq-autofix
description: "Auto-fix code errors using LLM models (Groq/Gemini). Analyzes complex error logs, TypeScript compilation failures, or runtime errors. Use when the user says 'fix this error', 'autofix build errors', or 'analyze this stack trace and fix it'."
---

# Skill: groq-autofix

## Overview
Auto-correction pipeline that feeds error logs to an LLM (Groq or Gemini), gets back a fix, and applies it. Useful for stubborn build errors, complex TypeScript type failures, and runtime stack traces that aren't immediately obvious.

## Usage
Use this agent to analyze complex error logs, TypeScript compilation failures, or runtime errors that are not immediately evident.

The skill includes a reusable script at `scripts/groq-autofix.js` that:
- Reads file content from a given path
- Sends it to the Groq API with structured audit/fix instructions
- Extracts the fixed code from the response
- Writes the fix back to the file

## Strategy
1. **Capture**: Read `build_output.txt` or terminal output.
2. **Analysis**: Identify the exact file and line of the error.
3. **Draft**: Propose a fix based on Clean Architecture and SOLID patterns.
4. **Validation**: Apply the change and run `npm run build` or `dotnet build` to confirm resolution.

## Script: groq-autofix.js
Usage: `node scripts/groq-autofix.js <file1> <file2> ...`

The script:
- Reads each file from the project source directory
- Sends it to Groq API with a structured audit/fix prompt
- Applies the returned fix in-place
- Includes path traversal protection (locked to `../../src/`)

Environment variables:
- `GROQ_API_KEY` or `VITE_GROQ_API_KEY`
- `GROQ_MODEL_PRIMARY` (default: `llama-3.3-70b-versatile`)

## Workflow Integration
This skill is designed to be invoked as part of an **evolve/fix workflow**:
- Run the build → capture errors
- Feed errors to groq-autofix
- Re-run build to confirm
- Commit fixes

Can be chained with `@opencode-workflow-engine` for multi-phase error resolution pipelines.

## Security
- NEVER send secrets or API keys to the analysis model.
- Sanitize logs before processing.
- The script enforces path traversal protection to keep operations within the project source tree.
