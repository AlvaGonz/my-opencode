# scripts/sync.ps1
# Syncs this repo → C:\Users\Admin\.opencode\
# Run from repo root: powershell -File scripts\sync.ps1
# Or with custom target: powershell -File scripts\sync.ps1 -Target "D:\custom\path"
# What it does:
#   1. Validates required constitution files exist (AGENTS.md, SOUL.md)
#   2. Copies all tracked files to target directory
#   3. Excludes: .git/, .env, runtime artifacts, __pycache__
#   4. Validates target structure after copy
#   5. Prints a summary of what was synced

param(
  [string]$Target = "$env:USERPROFILE\.opencode"
)

$ErrorActionPreference = "Stop"

# ── ANSI colors (Windows Terminal supports these) ───────────────
$GREEN  = "`e[32m"
$YELLOW = "`e[33m"
$RED    = "`e[31m"
$BOLD   = "`e[1m"
$RESET  = "`e[0m"

$REPO_ROOT = Split-Path -Parent $PSScriptRoot

Write-Host ""
Write-Host "${BOLD}╔══════════════════════════════════════════════╗${RESET}"
Write-Host "${BOLD}║  OPENCODE SYNC — REPO → ~/.opencode          ║${RESET}"
Write-Host "${BOLD}╚══════════════════════════════════════════════╝${RESET}"
Write-Host ""
Write-Host "  Source: ${BOLD}$REPO_ROOT${RESET}"
Write-Host "  Target: ${BOLD}$Target${RESET}"
Write-Host ""

# ── STEP 1: Pre-flight checks ───────────────────────────────────
$REQUIRED_FILES = @(
  "AGENTS.md",
  "SOUL.md",
  "opencode.json",
  "mcp.json",
  "env.example",
  "hooks/session-start.mjs",
  "hooks/session-stop.mjs",
  "scripts/validate-env.mjs",
  "scripts/activate-profile.mjs",
  ".opencode/WORKING-CONTEXT.md"
)

Write-Host "  ${BOLD}[1/4] Pre-flight validation...${RESET}"
$missing = @()
foreach ($file in $REQUIRED_FILES) {
  $fullPath = Join-Path $REPO_ROOT $file
  if (-not (Test-Path $fullPath)) {
    $missing += $file
  }
}

if ($missing.Count -gt 0) {
  Write-Host "  ${RED}❌ Required files missing from repo:${RESET}"
  foreach ($f in $missing) {
    Write-Host "     ${RED}→ $f${RESET}"
  }
  Write-Host "  ${RED}   Sync aborted. Fix missing files before syncing.${RESET}"
  exit 1
}
Write-Host "  ${GREEN}✅ All required files present${RESET}"
Write-Host ""

# ── STEP 2: Create target directory ─────────────────────────────
Write-Host "  ${BOLD}[2/4] Preparing target directory...${RESET}"
if (-not (Test-Path $Target)) {
  New-Item -ItemType Directory -Path $Target -Force | Out-Null
  Write-Host "  ${GREEN}✅ Created: $Target${RESET}"
} else {
  Write-Host "  ${GREEN}✅ Exists: $Target${RESET}"
}
Write-Host ""

# ── STEP 3: Copy files — exclude runtime/secret artifacts ───────
Write-Host "  ${BOLD}[3/4] Syncing files...${RESET}"

# Directories to EXCLUDE entirely
$EXCLUDE_DIRS = @(
  ".git",
  "node_modules",
  "scripts\__pycache__",
  "__pycache__",
  "logs",
  "sessions",
  ".tmp",
  "evoagentx\__pycache__",
  "evoagentx\outputs"
)

# Files to EXCLUDE by name (even if .gitignore missed them)
$EXCLUDE_FILES = @(
  ".env",
  ".env.local",
  "config.toml",
  "machine-report.json",
  "agents-lock.json",
  "skills-lock.json"
)

$copiedCount = 0
$skippedCount = 0

# Use robocopy for reliable Windows file sync
# /MIR = mirror (copy new + overwrite changed + delete removed)
# /XD  = exclude directories
# /XF  = exclude files
# /NFL = no file list in output
# /NDL = no directory list in output
# /NJH = no job header
# /NJS = no job summary

$robocopyArgs = @(
  $REPO_ROOT,
  $Target,
  "/MIR",
  "/NFL", "/NDL", "/NJH", "/NJS",
  "/XD"
)
$robocopyArgs += $EXCLUDE_DIRS
$robocopyArgs += "/XF"
$robocopyArgs += $EXCLUDE_FILES

$result = & robocopy @robocopyArgs

# robocopy exit codes: 0=no change, 1=files copied, 2=extra files, 3=both
# codes 4+ are errors
if ($LASTEXITCODE -ge 8) {
  Write-Host "  ${RED}❌ robocopy failed with exit code $LASTEXITCODE${RESET}"
  Write-Host "  ${RED}   Check permissions for: $Target${RESET}"
  exit 1
}

Write-Host "  ${GREEN}✅ Files synced to: $Target${RESET}"
Write-Host ""

# ── STEP 4: Post-sync validation ─────────────────────────────────
Write-Host "  ${BOLD}[4/4] Validating target structure...${RESET}"

$VALIDATE_AT_TARGET = @(
  "AGENTS.md",
  "SOUL.md",
  "opencode.json",
  "mcp.json",
  ".opencode/WORKING-CONTEXT.md",
  "hooks/session-start.mjs",
  "hooks/session-stop.mjs",
  "scripts/activate-profile.mjs",
  "scripts/validate-env.mjs",
  "agents/core"
)

$targetMissing = @()
foreach ($path in $VALIDATE_AT_TARGET) {
  $fullPath = Join-Path $Target $path
  if (-not (Test-Path $fullPath)) {
    $targetMissing += $path
  }
}

# Verify secrets were NOT copied
$SECRET_CHECK = @(".env", "machine-report.json", "agents-lock.json", "skills-lock.json")
$leakedSecrets = @()
foreach ($secret in $SECRET_CHECK) {
  $fullPath = Join-Path $Target $secret
  if (Test-Path $fullPath) {
    $leakedSecrets += $secret
  }
}

if ($leakedSecrets.Count -gt 0) {
  Write-Host "  ${RED}🚨 SECURITY ALERT: Secret files found in target!${RESET}"
  foreach ($f in $leakedSecrets) {
    Write-Host "     ${RED}→ $f${RESET}"
    Remove-Item (Join-Path $Target $f) -Force
    Write-Host "     ${YELLOW}  Deleted from target.${RESET}"
  }
}

if ($targetMissing.Count -gt 0) {
  Write-Host "  ${YELLOW}⚠️  Some expected paths missing at target:${RESET}"
  foreach ($p in $targetMissing) {
    Write-Host "     ${YELLOW}→ $p${RESET}"
  }
} else {
  Write-Host "  ${GREEN}✅ Target structure validated${RESET}"
}

Write-Host ""
Write-Host ''
Write-Host '╔══════════════════════════════════════════════╗' -ForegroundColor Cyan
Write-Host '║  SYNC COMPLETE                               ║' -ForegroundColor Cyan
Write-Host '╚══════════════════════════════════════════════╝' -ForegroundColor Cyan
Write-Host ''
Write-Host '  Agent live at: ' -NoNewline; Write-Host $Target
Write-Host '  Active profile: run node scripts/activate-profile.mjs [name]'
Write-Host '  Start session:  node hooks/session-start.mjs'
Write-Host ''
