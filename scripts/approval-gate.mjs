#!/usr/bin/env node
/**
 * Approval Gate Enforcement Module
 * 
 * Ensures all execution operations (bash, write, edit, task)
 * receive explicit user approval before proceeding.
 * 
 * Usage:
 *   import { requestApproval, requestBatchApproval } from './approval-gate.mjs'
 *   const ok = await requestApproval('Write file', 'Create src/index.ts')
 *   if (!ok) { console.log('Skipped'); process.exit(0) }
 */

import readline from 'readline'

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

/**
 * Request approval for a single operation
 * @param {string} operation - Type of operation (bash/write/edit/task)
 * @param {string} details - Description of what will be done
 * @returns {Promise<boolean>} - true if approved
 */
export async function requestApproval(operation, details) {
  const rl = createInterface()
  return new Promise((resolve) => {
    rl.question(
      `\n⚠️  APPROVAL REQUIRED\n  Operation: ${operation}\n  Details: ${details}\n  Approve? (y/N): `,
      (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      }
    )
  })
}

/**
 * Request a single approval for a batch of parallel operations
 * @param {Array<{operation: string, details: string}>} tasks
 * @returns {Promise<boolean>} - true if entire batch approved
 */
export async function requestBatchApproval(tasks) {
  const rl = createInterface()
  const taskList = tasks.map((t, i) => `  ${i + 1}. [${t.operation}] ${t.details}`).join('\n')
  return new Promise((resolve) => {
    rl.question(
      `\n⚠️  BATCH APPROVAL REQUIRED\n  Parallel batch of ${tasks.length} tasks:\n${taskList}\n  Approve all? (y/N): `,
      (answer) => {
        rl.close()
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
      }
    )
  })
}

/**
 * Middleware-style wrapper: calls fn only after approval
 * @param {string} operation
 * @param {string} details
 * @param {Function} fn - async function to execute if approved
 * @returns {Promise<any>} - result of fn or undefined if skipped
 */
export async function withApproval(operation, details, fn) {
  const ok = await requestApproval(operation, details)
  if (!ok) {
    console.log(`⏭️  Skipped: ${details}`)
    return undefined
  }
  return await fn()
}

// CLI mode: run directly with arguments
// node approval-gate.mjs --operation "Write file" --details "Create src/index.ts"
if (process.argv[1]?.endsWith('approval-gate.mjs')) {
  const args = process.argv.slice(2)
  const opIndex = args.indexOf('--operation')
  const detIndex = args.indexOf('--details')
  
  if (opIndex === -1 || detIndex === -1) {
    console.error('Usage: approval-gate.mjs --operation "op" --details "desc"')
    process.exit(1)
  }
  
  const operation = args[opIndex + 1]
  const details = args[detIndex + 1]
  
  const approved = await requestApproval(operation, details)
  process.exit(approved ? 0 : 1)
}
