// scripts/validate-env.mjs
// Validates that required environment variables are set before session starts.
// Called by hooks/session-start.mjs — not meant to run standalone in production.
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// These vars are REQUIRED (MCP servers that are enabled: disabled=false)
const REQUIRED_ENV_VARS = [
  { name: 'MSSQL_PASSWORD',                  server: 'mssql' },
  { name: 'GITHUB_PERSONAL_ACCESS_TOKEN',    server: 'github-mcp-server' },
  { name: 'CONTEXT7_API_KEY',                server: 'context7-mcp' },
  { name: 'GCP_API_KEY',                     server: 'StitchMCP' },
];

// These are optional (disabled servers — warn but don't block)
const OPTIONAL_ENV_VARS = [
  { name: 'MONGODB_CONNECTION_STRING',       server: 'mongodb-mcp-server' },
];

export function validateEnv() {
  const missing = [];
  const warnings = [];

  for (const { name, server } of REQUIRED_ENV_VARS) {
    const value = process.env[name];
    // $env: prefix means it's a reference — only block if truly empty
    if (!value || value.startsWith('$env:') || value.includes('<your')) {
      missing.push({ name, server });
    }
  }

  for (const { name, server } of OPTIONAL_ENV_VARS) {
    const value = process.env[name];
    if (!value || value.startsWith('$env:') || value.includes('<your')) {
      warnings.push({ name, server });
    }
  }

  if (warnings.length > 0) {
    console.warn(`[validate-env] ⚠️  Optional MCP vars not set:`);
    warnings.forEach(({ name, server }) =>
      console.warn(`   ${name} → ${server} (disabled — OK to skip)`)
    );
  }

  if (missing.length > 0) {
    console.error(`[validate-env] ❌ Required env vars missing:`);
    missing.forEach(({ name, server }) =>
      console.error(`   ${name} → needed by: ${server}`)
    );
    console.error(`[validate-env] → Copy env.example to .env and fill in values.`);
    console.error(`[validate-env] → Then run: node scripts/sync.ps1`);
    // Return false but do NOT throw — let session-start decide to block or warn
    return { valid: false, missing, warnings };
  }

  console.log(`[validate-env] ✅ All required env vars present.`);
  return { valid: true, missing: [], warnings };
}

// Run directly for manual check
if (process.fileURLToPath
  ? process.fileURLToPath(new URL(import.meta.url)) === process.argv[1]
  : false) {
  const result = validateEnv();
  process.exit(result.valid ? 0 : 1);
}
