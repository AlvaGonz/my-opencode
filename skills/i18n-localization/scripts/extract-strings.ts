/**
 * extract-strings.ts
 *
 * Scans .tsx / .ts files for hardcoded strings (strings not wrapped in t() or <Trans>)
 * and outputs a report of file path, line number, and string value.
 *
 * Uses regex patterns derived from i18next (t() calls) and LinguiJS (<Trans> components)
 * to identify which strings are already translated, then flags the rest.
 *
 * Usage:
 *   npx ts-node scripts/extract-strings.ts --dir src --output report.json
 *
 * Sources:
 *   - https://github.com/i18next/i18next
 *   - https://github.com/lingui/js-lingui
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as glob from "glob";

interface HardcodedString {
  file: string;
  line: number;
  column: number;
  value: string;
  context?: string;
}

interface Report {
  generatedAt: string;
  scannedFiles: number;
  totalHardcoded: number;
  results: HardcodedString[];
}

// ── Configuration ──────────────────────────────────────────────────────────────

const DEFAULT_INCLUDE_PATTERNS = ["src/**/*.ts", "src/**/*.tsx"];
const DEFAULT_EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/*.d.ts",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
];

// Characters that likely indicate the string is not a UI label (internal identifiers)
const INTERNAL_PATTERN = /^[a-z_][a-zA-Z0-9_\-.]*$/;
const URL_PATTERN = /^(https?:\/\/|\/|\.\/|\.\.\/)/;
const NUMBER_PATTERN = /^\d+([.,]\d+)?$/;
const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;
const PATH_PATTERN = /^[/\\]/;

// Min string length to consider (shorter strings are often noise)
const MIN_STRING_LENGTH = 3;

// ── Detection Helpers ──────────────────────────────────────────────────────────

/**
 * Check if a string literal is already inside a t() call.
 * Matches patterns:
 *   - t("key")
 *   - t('key')
 *   - t(`key`)
 *   - i18n.t("key")
 *   - $t("key")   (i18next nesting syntax)
 */
function isInsideTCall(line: string, matchIndex: number): boolean {
  const before = line.slice(0, matchIndex);
  // Check for t( preceding the string
  const tCallMatch = before.match(
    /(?:^|[^a-zA-Z0-9_$])(?:t|i18n\.t|\$t)\s*\(\s*$/,
  );
  return tCallMatch !== null;
}

/**
 * Check if a string literal is inside a <Trans> component.
 * Matches:
 *   <Trans>...</Trans>
 */
function isInsideTransComponent(
  lines: string[],
  lineIndex: number,
  colIndex: number,
): boolean {
  // Look backward for <Trans> opening
  for (let i = lineIndex; i >= Math.max(0, lineIndex - 10); i--) {
    const line = lines[i];
    const searchTo = i === lineIndex ? colIndex : line.length;
    const fragment = line.slice(0, searchTo);
    const openMatch = fragment.match(/<Trans\b[^>]*>/);
    if (openMatch) return true;

    // If we hit a closing Trans before an opening one, stop
    if (/<\/Trans\s*>/.test(fragment)) return false;
  }
  return false;
}

/**
 * Check if a string is likely not a translatable UI string.
 */
function isNonTranslatable(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < MIN_STRING_LENGTH) return true;
  if (INTERNAL_PATTERN.test(trimmed)) return true;
  if (URL_PATTERN.test(trimmed)) return true;
  if (NUMBER_PATTERN.test(trimmed)) return true;
  if (HEX_COLOR.test(trimmed)) return true;
  if (PATH_PATTERN.test(trimmed)) return true;
  // Single characters, CSS values
  if (/^\s*[a-zA-Z]\s*$/.test(trimmed)) return true;
  // Whitespace-only
  if (/^\s*$/.test(trimmed)) return true;
  // JSX prop-like strings (className, style, etc.)
  if (/^[a-z]+[A-Z][a-zA-Z]*$/.test(trimmed)) return true;
  return false;
}

/**
 * Determine whether a string is wrapped with a JSX expression attribute
 * like title="string", placeholder="string", etc. These are often
 * translatable but need to be handled differently.
 */
function isJSXAttributeValue(line: string, matchIndex: number): boolean {
  const before = line.slice(0, matchIndex);
  return /=["']\s*$/.test(before) || /:\s*["']\s*$/.test(before);
}

// ── Scanning Logic ─────────────────────────────────────────────────────────────

function scanFile(
  filePath: string,
  relativeRoot: string,
): HardcodedString[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const results: HardcodedString[] = [];

  // String literal regex: captures double-quoted, single-quoted, template literals
  const stringRegex = /(["'`])((?:\\[\s\S]|(?!\1)[^\\])*?)\1/g;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    // Skip comment lines
    const trimmedLine = line.trim();
    if (
      trimmedLine.startsWith("//") ||
      trimmedLine.startsWith("/*") ||
      trimmedLine.startsWith("*")
    ) {
      continue;
    }

    // Skip import/require lines — they contain module paths, not UI strings
    if (
      trimmedLine.startsWith("import ") ||
      trimmedLine.startsWith("require(") ||
      trimmedLine.startsWith("export ") ||
      trimmedLine.startsWith("from ")
    ) {
      continue;
    }

    // Reset regex per line
    stringRegex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = stringRegex.exec(line)) !== null) {
      const [, quote, rawValue] = match;
      const value = rawValue
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

      const matchIndex = match.index;

      // Skip if inside t() call
      if (isInsideTCall(line, matchIndex)) continue;

      // Skip if inside <Trans> component
      if (isInsideTransComponent(lines, lineIdx, matchIndex)) continue;

      // Skip non-translatable strings
      if (isNonTranslatable(value)) continue;

      // Record the hardcoded string
      const contextBefore = line.slice(
        Math.max(0, matchIndex - 30),
        matchIndex,
      );
      results.push({
        file: path.relative(relativeRoot, filePath),
        line: lineIdx + 1,
        column: matchIndex + 1,
        value: value,
        context: isJSXAttributeValue(line, matchIndex)
          ? `jsx-attr: ${contextBefore.trim()}`
          : `text: ${contextBefore.trim()}`,
      });
    }
  }

  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf("--dir");
  const rootDir = dirIndex !== -1 ? args[dirIndex + 1] : "src";

  const outIndex = args.indexOf("--output");
  const outputPath = outIndex !== -1 ? args[outIndex + 1] : "i18n-report.json";

  const resolveRoot = path.resolve(rootDir);

  if (!fs.existsSync(resolveRoot)) {
    console.error(`Error: Directory "${rootDir}" does not exist.`);
    process.exit(1);
  }

  // Collect all files
  const files: string[] = [];
  for (const pattern of DEFAULT_INCLUDE_PATTERNS) {
    const matched = glob.sync(pattern, {
      cwd: resolveRoot,
      ignore: DEFAULT_EXCLUDE_PATTERNS,
      absolute: true,
    });
    files.push(...matched);
  }

  console.log(`Scanning ${files.length} files in ${resolveRoot}...\n`);

  // Scan each file
  const allResults: HardcodedString[] = [];
  for (const file of files) {
    const results = scanFile(file, resolveRoot);
    allResults.push(...results);
  }

  // Remove duplicates by file:line:value
  const uniqueResults = allResults.filter(
    (r, i, arr) =>
      arr.findIndex(
        (x) => x.file === r.file && x.line === r.line && x.value === r.value,
      ) === i,
  );

  // Sort by file, then line
  uniqueResults.sort((a, b) => {
    const fileCmp = a.file.localeCompare(b.file);
    return fileCmp !== 0 ? fileCmp : a.line - b.line;
  });

  // Build report
  const report: Report = {
    generatedAt: new Date().toISOString(),
    scannedFiles: files.length,
    totalHardcoded: uniqueResults.length,
    results: uniqueResults,
  };

  // Write output
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

  // Console summary
  console.log("─".repeat(60));
  console.log(`Scanned:       ${files.length} files`);
  console.log(`Hardcoded:     ${uniqueResults.length} strings found`);
  console.log(`Report saved:  ${outputPath}`);

  if (uniqueResults.length > 0) {
    console.log("\nTop files with hardcoded strings:");
    const fileCounts = new Map<string, number>();
    for (const r of uniqueResults) {
      fileCounts.set(r.file, (fileCounts.get(r.file) || 0) + 1);
    }
    const sorted = [...fileCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    for (const [file, count] of sorted) {
      console.log(`  ${file}: ${count} strings`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
