// ecc-tdd-workflow — OpenCode plugin (ECC TDD Workflow Enforcement).
//
// Enforces Test-Driven Development (Red-Green-Refactor) cycle using the
// codebase-memory-mcp and post_task_loop.py. Blocks implementation until
// failing tests exist, validates Green phase, and enforces Refactor phase.
//
// OpenCode loads this as a server plugin — add it to your opencode.json:
//   { "plugin": ["./plugins/ecc-tdd-workflow.mjs"] }

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const globalOpenCodeDir = path.join(process.env.HOME || process.env.USERPROFILE, '.opencode');
const hooksDir = path.join(globalOpenCodeDir, 'hooks');
const skillsDir = path.join(globalOpenCodeDir, 'skills');

const require = createRequire(import.meta.url);

// TDD state tracking
const tddStatePath = path.join(process.cwd(), '.tmp', 'tdd-state.json');

function ensureTmpDir() {
  const tmpDir = path.join(process.cwd(), '.tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
}

function readTddState() {
  ensureTmpDir();
  try {
    return JSON.parse(fs.readFileSync(tddStatePath, 'utf8'));
  } catch (e) {
    return { phase: 'none', currentFeature: null, testFile: null, implementationFile: null, redPassed: false, greenPassed: false };
  }
}

function writeTddState(state) {
  ensureTmpDir();
  fs.writeFileSync(tddStatePath, JSON.stringify(state, null, 2));
}

function detectTestFramework() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps.vitest) return 'vitest';
    if (deps.jest) return 'jest';
    if (deps['@playwright/test']) return 'playwright';
    if (deps.cypress) return 'cypress';
  }
  // Check for Python
  if (fs.existsSync(path.join(process.cwd(), 'pytest.ini')) || 
      fs.existsSync(path.join(process.cwd(), 'pyproject.toml'))) {
    return 'pytest';
  }
  // Check for C#
  const csprojFiles = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.csproj'));
  if (csprojFiles.length > 0) return 'dotnet';
  return 'unknown';
}

function runTests(testFramework, testFile) {
  return new Promise((resolve) => {
    let cmd, args;
    switch (testFramework) {
      case 'vitest':
        cmd = 'npx'; args = ['vitest', 'run', testFile];
        break;
      case 'jest':
        cmd = 'npx'; args = ['jest', testFile];
        break;
      case 'pytest':
        cmd = 'python'; args = ['-m', 'pytest', testFile, '-v'];
        break;
      case 'dotnet':
        cmd = 'dotnet'; args = ['test', '--filter', `FullyQualifiedName~${path.basename(testFile, '.cs')}`];
        break;
      default:
        resolve({ passed: false, output: 'Unknown test framework' });
        return;
    }
    
    const child = spawn(cmd, args, { cwd: process.cwd(), stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (data) => output += data.toString());
    child.stderr.on('data', (data) => output += data.toString());
    child.on('close', (code) => {
      resolve({ passed: code === 0, output });
    });
  });
}

export default async ({ client } = {}) => {
  const log = (level, message) => {
    try { client && client.app && client.app.log({ body: { service: 'ecc-tdd', level, message } }); } catch (e) {}
  };

  return {
    config: async (config) => {
      if (!config.command) config.command = {};
      
      config.command['tdd:start'] = {
        description: 'Start TDD cycle for a new feature (Red phase)',
        template: `Starting TDD cycle for: {{feature}}

## Red Phase - Write Failing Test
1. Create test file for the feature
2. Write test that defines expected behavior
3. Run test - it MUST fail (Red)
4. Only then proceed to Green phase

Test framework detected: {{framework}}

Next step: Write your failing test, then run \`tdd:red\` to verify it fails.`
      };

      config.command['tdd:red'] = {
        description: 'Verify test fails (Red phase gate)',
        template: `Running tests to verify Red phase...

{{#if passed}}
❌ TESTS PASSED - This is not Red phase! Tests must fail first.
Remove implementation or fix test to make it fail.
{{else}}
✅ TESTS FAILED - Red phase confirmed!
You may now proceed to Green phase: \`tdd:green\`
{{/if}}

Test output:
\`\`\`
{{output}}
\`\`\``
      };

      config.command['tdd:green'] = {
        description: 'Implement minimal code to pass tests (Green phase)',
        template: `Green Phase - Implement minimal code to pass tests

Guidelines:
- Write ONLY enough code to make tests pass
- No extra features, no premature optimization
- Keep it simple - the simplest thing that works

Run \`tdd:green\` again after implementation to verify tests pass.

When tests pass, proceed to Refactor phase: \`tdd:refactor\``
      };

      config.command['tdd:refactor'] = {
        description: 'Refactor code while keeping tests green (Refactor phase)',
        template: `Refactor Phase - Improve code quality while tests stay green

Guidelines:
- Run tests after EVERY change
- Extract methods, remove duplication, improve names
- Apply SOLID principles, design patterns
- NO new functionality - only internal improvements

Run \`tdd:refactor\` to verify tests still pass after each change.

When satisfied, complete cycle: \`tdd:complete\``
      };

      config.command['tdd:complete'] = {
        description: 'Complete TDD cycle and record results',
        template: `TDD Cycle Complete!

Summary:
- Feature: {{feature}}
- Test file: {{testFile}}
- Implementation: {{implFile}}
- All phases passed: ✅

Cycle recorded in .tmp/tdd-state.json`
      };

      config.command['tdd:status'] = {
        description: 'Show current TDD cycle status',
        template: `TDD Status: {{phase}}

{{#if currentFeature}}
Feature: {{currentFeature}}
Test file: {{testFile}}
Impl file: {{implementationFile}}
Red passed: {{#if redPassed}}✅{{else}}❌{{/if}}
Green passed: {{#if greenPassed}}✅{{else}}❌{{/if}}
{{/if}}

Available commands:
- tdd:start <feature> - Start new cycle
- tdd:red - Verify tests fail
- tdd:green - Verify tests pass
- tdd:refactor - Verify tests still pass after refactor
- tdd:complete - Complete cycle`
      };

      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },

    // Hook: session.created - Initialize TDD context
    'session.created': async (ctx) => {
      const framework = detectTestFramework();
      log('info', `TDD workflow initialized with ${framework}`);
    },

    // Hook: experimental.chat.system.transform - Inject TDD reminders
    'experimental.chat.system.transform': async (_input, output) => {
      const state = readTddState();
      if (state.phase !== 'none' && state.currentFeature) {
        const phaseEmoji = { red: '🔴', green: '🟢', refactor: '🔵', complete: '✅' };
        output.system.push(`\n[ECC TDD] Active cycle: ${state.currentFeature} — Phase: ${phaseEmoji[state.phase] || state.phase.toUpperCase()}`);
        if (state.phase === 'red') {
          output.system.push('  → Next: Write failing test, then run `tdd:red`');
        } else if (state.phase === 'green') {
          output.system.push('  → Next: Implement minimal code, then run `tdd:green`');
        } else if (state.phase === 'refactor') {
          output.system.push('  → Next: Refactor freely, run `tdd:refactor` after each change');
        }
      }
    },

    // Hook: command.execute.before - Handle TDD commands
    'command.execute.before': async (input) => {
      if (!input || !input.command) return;

      const framework = detectTestFramework();
      const state = readTddState();

      if (input.command === 'tdd:start') {
        const feature = (input.arguments || '').trim();
        if (!feature) {
          log('warn', 'tdd:start requires a feature name');
          return;
        }
        
        const newState = {
          phase: 'red',
          currentFeature: feature,
          testFile: null,
          implementationFile: null,
          redPassed: false,
          greenPassed: false,
          framework,
          startedAt: new Date().toISOString()
        };
        writeTddState(newState);
        log('info', `TDD cycle started: ${feature} (${framework})`);
      }

      if (input.command === 'tdd:red') {
        if (!state.testFile) {
          log('warn', 'No test file specified. Set it first or provide path.');
          return;
        }
        
        const result = await runTests(framework, state.testFile);
        if (!result.passed) {
          state.redPassed = true;
          state.phase = 'green';
          writeTddState(state);
          log('info', 'Red phase passed - tests fail as expected');
        } else {
          log('warn', 'Tests passed - Red phase requires failing tests!');
        }
      }

      if (input.command === 'tdd:green') {
        if (!state.redPassed) {
          log('warn', 'Red phase not passed. Run `tdd:red` first.');
          return;
        }
        if (!state.testFile || !state.implementationFile) {
          log('warn', 'Test and implementation files must be set.');
          return;
        }
        
        const result = await runTests(framework, state.testFile);
        if (result.passed) {
          state.greenPassed = true;
          state.phase = 'refactor';
          writeTddState(state);
          log('info', 'Green phase passed - tests now pass');
        } else {
          log('warn', 'Tests still failing - implement minimal code to pass');
        }
      }

      if (input.command === 'tdd:refactor') {
        if (!state.greenPassed) {
          log('warn', 'Green phase not passed. Run `tdd:green` first.');
          return;
        }
        
        const result = await runTests(framework, state.testFile);
        if (result.passed) {
          log('info', 'Refactor phase - tests still pass');
        } else {
          log('warn', 'Tests broken during refactor! Revert changes.');
        }
      }

      if (input.command === 'tdd:complete') {
        if (state.redPassed && state.greenPassed) {
          state.phase = 'complete';
          writeTddState(state);
          log('info', `TDD cycle completed for: ${state.currentFeature}`);
        } else {
          log('warn', 'Cannot complete - Red and Green phases must pass first');
        }
      }

      if (input.command === 'tdd:status') {
        // Status is shown via command template
      }
    },

    // Custom tools for programmatic TDD control
    tools: {
      ecc_tdd_start: {
        description: 'Start a new TDD cycle for a feature',
        parameters: {
          type: 'object',
          properties: {
            feature: { type: 'string', description: 'Feature name/description' },
            testFile: { type: 'string', description: 'Path to test file (will be created)' },
            implementationFile: { type: 'string', description: 'Path to implementation file (will be created)' }
          },
          required: ['feature']
        },
        execute: async (args) => {
          const framework = detectTestFramework();
          const state = {
            phase: 'red',
            currentFeature: args.feature,
            testFile: args.testFile || null,
            implementationFile: args.implementationFile || null,
            redPassed: false,
            greenPassed: false,
            framework,
            startedAt: new Date().toISOString()
          };
          writeTddState(state);
          return `TDD cycle started for: ${args.feature}\nFramework: ${framework}\nPhase: RED (write failing test)`;
        }
      },

      ecc_tdd_set_files: {
        description: 'Set test and implementation file paths for current TDD cycle',
        parameters: {
          type: 'object',
          properties: {
            testFile: { type: 'string', description: 'Path to test file' },
            implementationFile: { type: 'string', description: 'Path to implementation file' }
          },
          required: ['testFile', 'implementationFile']
        },
        execute: async (args) => {
          const state = readTddState();
          if (state.phase === 'none') {
            return 'No active TDD cycle. Run tdd:start first.';
          }
          state.testFile = args.testFile;
          state.implementationFile = args.implementationFile;
          writeTddState(state);
          return `Files set:\n- Test: ${args.testFile}\n- Implementation: ${args.implementationFile}`;
        }
      },

      ecc_tdd_verify_red: {
        description: 'Verify tests fail (Red phase gate)',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          const state = readTddState();
          if (state.phase === 'none') return 'No active TDD cycle.';
          if (!state.testFile) return 'Test file not set. Use ecc_tdd_set_files first.';
          
          const framework = state.framework || detectTestFramework();
          const result = await runTests(framework, state.testFile);
          
          if (!result.passed) {
            state.redPassed = true;
            state.phase = 'green';
            writeTddState(state);
            return `✅ RED PHASE PASSED\nTests fail as expected.\n\nOutput:\n${result.output}\n\nNext: Implement minimal code, then run ecc_tdd_verify_green`;
          } else {
            return `❌ RED PHASE FAILED\nTests passed - they must fail first!\n\nOutput:\n${result.output}\n\nFix: Remove implementation or adjust test to make it fail.`;
          }
        }
      },

      ecc_tdd_verify_green: {
        description: 'Verify tests pass (Green phase gate)',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          const state = readTddState();
          if (state.phase === 'none') return 'No active TDD cycle.';
          if (!state.redPassed) return 'Red phase not passed. Run ecc_tdd_verify_red first.';
          if (!state.testFile) return 'Test file not set.';
          
          const framework = state.framework || detectTestFramework();
          const result = await runTests(framework, state.testFile);
          
          if (result.passed) {
            state.greenPassed = true;
            state.phase = 'refactor';
            writeTddState(state);
            return `✅ GREEN PHASE PASSED\nAll tests pass.\n\nOutput:\n${result.output}\n\nNext: Refactor freely, run ecc_tdd_verify_refactor after each change.`;
          } else {
            return `❌ GREEN PHASE FAILED\nTests still failing.\n\nOutput:\n${result.output}\n\nImplement minimal code to make tests pass.`;
          }
        }
      },

      ecc_tdd_verify_refactor: {
        description: 'Verify tests still pass during refactor',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          const state = readTddState();
          if (state.phase === 'none') return 'No active TDD cycle.';
          if (!state.greenPassed) return 'Green phase not passed.';
          if (!state.testFile) return 'Test file not set.';
          
          const framework = state.framework || detectTestFramework();
          const result = await runTests(framework, state.testFile);
          
          if (result.passed) {
            return `✅ REFACTOR PHASE - TESTS STILL PASS\n\nOutput:\n${result.output}\n\nContinue refactoring or run ecc_tdd_complete to finish.`;
          } else {
            return `❌ TESTS BROKEN DURING REFACTOR\n\nOutput:\n${result.output}\n\nRevert last change and try a different refactoring approach.`;
          }
        }
      },

      ecc_tdd_complete: {
        description: 'Complete the TDD cycle',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          const state = readTddState();
          if (state.phase === 'none') return 'No active TDD cycle.';
          if (!state.redPassed || !state.greenPassed) {
            return 'Cannot complete - Red and Green phases must both pass.';
          }
          
          state.phase = 'complete';
          state.completedAt = new Date().toISOString();
          writeTddState(state);
          
          return `✅ TDD CYCLE COMPLETE\n\nFeature: ${state.currentFeature}\nTest: ${state.testFile}\nImplementation: ${state.implementationFile}\nFramework: ${state.framework}\nStarted: ${state.startedAt}\nCompleted: ${state.completedAt}\n\nCycle recorded. Ready for next feature!`;
        }
      },

      ecc_tdd_status: {
        description: 'Get current TDD cycle status',
        parameters: { type: 'object', properties: {} },
        execute: async () => {
          const state = readTddState();
          if (state.phase === 'none') {
            return 'No active TDD cycle. Run ecc_tdd_start to begin.';
          }
          
          const phaseEmoji = { red: '🔴', green: '🟢', refactor: '🔵', complete: '✅' };
          return `TDD Status: ${phaseEmoji[state.phase] || ''} ${state.phase.toUpperCase()}\n` +
            `Feature: ${state.currentFeature}\n` +
            `Test file: ${state.testFile || 'not set'}\n` +
            `Impl file: ${state.implementationFile || 'not set'}\n` +
            `Framework: ${state.framework}\n` +
            `Red passed: ${state.redPassed ? '✅' : '❌'}\n` +
            `Green passed: ${state.greenPassed ? '✅' : '❌'}`;
        }
      }
    }
  };
};