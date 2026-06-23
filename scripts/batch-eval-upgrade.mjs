// scripts/batch-eval-upgrade.mjs
// Batch upgrades ALL evals with the 4 verifier check types (Outcome/Process/Style/Efficiency)
// and writes skill-specific task YAMLs with proper triggers + negative tests

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import matter from 'gray-matter';

const BASE = process.cwd();
const SKILLS_DIR = join(BASE, 'skills');
const EVALS_DIR = join(BASE, 'evals');

// ── Skill descriptions for ones with broken frontmatter ─────────────
const FALLBACK_DESCRIPTIONS = {
  'animejs-animation': 'Create and manage anime.js animations with advanced timeline controls, staggered effects, and scroll-driven motion.',
  'api-design-principles': 'Design REST and GraphQL APIs following best practices for scalability, consistency, and developer experience.',
  'i18n-localization': 'Implement internationalization and localization patterns using standard i18n libraries with translation management and locale detection.',
  'red-team-tactics': 'Apply red team offensive security tactics for penetration testing, adversarial simulation, and vulnerability assessment.',
  'red-team-tools': 'Configure and operate red team security tools for reconnaissance, exploitation, and post-exploitation phases.',
  'security': 'Implement security best practices for authentication, authorization, encryption, input validation, and secure configuration.',
  'sql-optimization-patterns': 'Optimize SQL queries with indexing strategies, query plan analysis, and performance tuning patterns.',
};

// ── Skill-specific positive trigger prompts ─────────────────────────
const POSITIVE_TRIGGERS = {
  'accessibility': 'Run an accessibility audit on this form component to check WCAG 2.2 compliance.',
  'agent-memory-systems': 'Design a memory retrieval system that surfaces the right context for an AI agent.',
  'animejs-animation': 'Create an animated hero section with staggered fade-in using anime.js.',
  'api-design-principles': 'Review this REST API design for consistency and RESTful best practices.',
  'architecture': 'Analyze the trade-offs between microservices and modular monolith for this e-commerce platform.',
  'architecture-decision-records': 'Create an ADR documenting our choice of PostgreSQL over MongoDB.',
  'architecture-patterns': 'Design this payment module following Clean Architecture principles.',
  'aws-cloud-security': 'Review this S3 bucket policy for least-privilege access and public exposure risks.',
  'backend-dev-guidelines': 'Review this Express route handler against our backend development standards.',
  'bash-defensive-patterns': 'Review this deployment script for error handling and defensive patterns.',
  'code-refactoring-refactor-clean': 'Refactor this authentication service to follow clean code principles.',
  'code-refactoring-tech-debt': 'Analyze the technical debt in this billing module and prioritize fixes.',
  'code-review': 'Review this pull request for code quality issues and security concerns.',
  'composition-patterns': 'Refactor this component to use compound components instead of boolean props.',
  'context': 'Discover and load the relevant context files for this TypeScript project setup task.',
  'context7': 'Fetch the latest React 19 documentation for server components API changes.',
  'csharp-async': 'Review this C# async method for deadlock risks and proper cancellation token usage.',
  'csharp-docs': 'Add XML documentation comments to this C# service interface.',
  'csharp-mstest': 'Write MSTest unit tests for this order processing service.',
  'csharp-nunit': 'Write NUnit parameterized tests for this validation logic.',
  'csharp-tunit': 'Write TUnit tests for this data access layer following best practices.',
  'csharp-xunit': 'Write xUnit tests with theory attributes for this calculator service.',
  'design-taste-frontend': 'Design a landing page for a premium design studio with an editorial aesthetic.',
  'dotnet-best-practices': 'Review this .NET solution for adherence to project coding standards.',
  'dotnet-design-pattern-review': 'Review this C# code for proper implementation of the Strategy pattern.',
  'dotnet-upgrade': 'Analyze this .NET Framework 4.8 project for upgrade path to .NET 8.',
  'frontend-design': 'Create a dark-mode landing page for an AI startup with gradient hero and animated grid.',
  'frontend-dev-guidelines': 'Review this Next.js page component for frontend architecture compliance.',
  'git-advanced-workflows': 'Use interactive rebase to squash these 5 commits into a clean history.',
  'git-hooks-automation': 'Set up husky with commitlint and lint-staged for this project.',
  'github': 'Create a new GitHub issue from this bug report template.',
  'github-actions-templates': 'Create a GitHub Actions CI workflow for testing and building this Node.js project.',
  'github-automation': 'Create a new release branch and open a PR for the v2.3.0 release.',
  'github-issue-creator': 'Create a GitHub issue from this error log with reproduction steps.',
  'github-workflow-automation': 'Set up an automated PR labeling workflow for this repository.',
  'git-pr-workflows-git-workflow': 'Create a PR for this feature branch with proper description and reviewers.',
  'git-pr-workflows-onboard': 'Create an onboarding guide for new contributors to this repository.',
  'git-pr-workflows-pr-enhance': 'Enhance this PR description with a clear summary and testing notes.',
  'git-pushing': 'Stage all changes, create a conventional commit, and push to the remote.',
  'groq-autofix': 'Fix this TypeScript compilation error from the build output log.',
  'i18n-localization': 'Set up internationalization for this React app with locale switching.',
  'mcp-builder': 'Create an MCP server with tools for searching documentation and fetching code examples.',
  'mcp-builder-ms': 'Build an MCP server integrating the GitHub API for repository management.',
  'nano-banana-pro-openrouter': 'Generate a product hero image featuring a sleek dark device mockup.',
  'nodejs-backend-patterns': 'Create an Express API with middleware for error handling and request validation.',
  'nodejs-best-practices': 'Review this Node.js service for production-readiness and error handling patterns.',
  'opencode-skill-orchestrator': 'Orchestrate skills to build and test a React component with proper testing.',
  'opencode-workflow-engine': 'Run the feature delivery workflow for adding a new API endpoint.',
  'owasp-security': 'Review this authentication endpoint for OWASP Top 10 vulnerabilities.',
  'planning-with-files': 'Plan the implementation of a multi-file feature using task_plan.md and progress.md.',
  'playwright': 'Write a Playwright test that navigates to the login page and submits credentials.',
  'project-skill-audit': 'Audit this project and recommend which skills to add for better AI assistance.',
  'quality-qa': 'Run a QA pass on the newly implemented authentication flow.',
  'react-best-practices': 'Optimize this React dashboard component for rendering performance.',
  'red-team-tactics': 'Plan a red team engagement testing the authentication system for common bypasses.',
  'red-team-tools': 'Set up Metasploit for a controlled penetration test of the staging environment.',
  'refactor-plan': 'Plan the multi-file refactoring of the user service module with rollback steps.',
  'reference-builder': 'Create a comprehensive API reference for this REST endpoint collection.',
  'secrets-management': 'Configure Vault for storing and rotating database credentials securely.',
  'security': 'Review this file upload feature for path traversal and injection vulnerabilities.',
  'security-audit': 'Run a full security audit on this web application following OWASP methodology.',
  'security-guardrails': 'Apply security validation on this login endpoint implementation.',
  'security-requirement-extraction': 'Derive security requirements from this threat model for the payment module.',
  'seo': 'Optimize this landing page meta tags and structured data for search visibility.',
  'smart-router-skill': 'Set up the smart router with Mission: Impossible theme for a security audit workflow.',
  'sql-optimization-patterns': 'Analyze this slow query and recommend index optimizations.',
  'stitch-ui-design': 'Create a prompt for Stitch that generates a SaaS dashboard layout.',
  'tailwind-css-patterns': 'Build a responsive card grid component using Tailwind CSS utilities.',
  'task-management': 'Break down the user authentication feature into tracked subtasks.',
  'test-driven-development': 'Write tests first for a user registration endpoint following TDD methodology.',
  'typescript-advanced-types': 'Create a type-safe event emitter using generics and conditional types.',
  'typescript-expert': 'Set up a TypeScript monorepo with project references and path aliases.',
  'typespec-api-operations': 'Add GET and POST operations to this TypeSpec API service definition.',
  'typespec-create-agent': 'Generate a TypeSpec declarative agent for customer support ticket triage.',
  'typespec-create-api-plugin': 'Create a TypeSpec API plugin for retrieving weather data with authentication.',
  'ui-visual-validator': 'Validate this checkout form UI against the design system specifications.',
  'vite': 'Configure Vite with React and TypeScript for this new frontend project.',
  'vitest': 'Write Vitest unit tests for this utility function with coverage thresholds.',
  'wcag-audit-patterns': 'Run a WCAG 2.2 audit on this navigation component and report violations.',
  'web-artifacts-builder': 'Build a single-file HTML artifact showing an interactive data dashboard.',
  'web-coder': 'Explain the differences between W3C and WHATWG specifications for the DOM standard.',
  'web-design-guidelines': 'Review this page layout against web interface design best practices.',
  'web-design-reviewer': 'Review the visual design of this landing page and suggest improvements.',
  'workflow-automation': 'Design a Temporal workflow for processing order payments with retry logic.',
  'workflow-orchestration-patterns': 'Design a Temporal saga pattern for a multi-step booking workflow.',
  'workflow-patterns': 'Implement TDD workflow with git commits and checkpoint verification.',
};

// ── Negative trigger prompts (should NOT activate the skill) ────────
const NEGATIVE_TRIGGERS = {
  'accessibility': 'Add more padding and margin to this container element.',
  'agent-memory-systems': 'Install the latest version of Node.js for this project.',
  'animejs-animation': 'Write a simple CSS animation for a loading spinner.',
  'api-design-principles': 'Install npm dependencies for this project.',
  'architecture': 'Fix the typo in the README file.',
  'architecture-decision-records': 'Update the package.json version number.',
  'architecture-patterns': 'Add a new npm script for running tests.',
  'aws-cloud-security': 'Create a new S3 bucket for file storage.',
  'backend-dev-guidelines': 'Update the README with installation instructions.',
  'bash-defensive-patterns': 'Write a one-liner to list all files in the directory.',
  'code-refactoring-refactor-clean': 'Add a new dependency to package.json.',
  'code-refactoring-tech-debt': 'Update the project README with new badges.',
  'code-review': 'Format this JSON file with proper indentation.',
  'composition-patterns': 'Update the Tailwind CSS configuration file.',
  'context': 'Run npm install to install project dependencies.',
  'context7': 'Write a bash script to backup the database.',
  'csharp-async': 'Add a new NuGet package reference to the project.',
  'csharp-docs': 'Add a new method to the controller class.',
  'csharp-mstest': 'Install NuGet packages for this project.',
  'csharp-nunit': 'Create a new database migration for the users table.',
  'csharp-tunit': 'Update the IIS configuration file.',
  'csharp-xunit': 'Write a SQL query to select all users.',
  'design-taste-frontend': 'Add a form validation error message.',
  'dotnet-best-practices': 'Install the .NET SDK on this machine.',
  'dotnet-design-pattern-review': 'Add comments to document the code.',
  'dotnet-upgrade': 'Create a new .NET console application.',
  'frontend-design': 'Add a loading spinner to the button component.',
  'frontend-dev-guidelines': 'Update the ESLint configuration file.',
  'git-advanced-workflows': 'Initialize a new Git repository.',
  'git-hooks-automation': 'Install Git on this development machine.',
  'github': 'Update the local development environment.',
  'github-actions-templates': 'Install Node.js on the CI server.',
  'github-automation': 'Clone the repository to your local machine.',
  'github-issue-creator': 'Update your local development environment.',
  'github-workflow-automation': 'Restart the CI server after maintenance.',
  'git-pr-workflows-git-workflow': 'Initialize a new Git repository with git init.',
  'git-pr-workflows-onboard': 'Install Node.js and npm on your machine.',
  'git-pr-workflows-pr-enhance': 'Run git status to check your working tree.',
  'git-pushing': 'Review the current git log with git log --oneline.',
  'groq-autofix': 'What is the weather forecast for this weekend?',
  'i18n-localization': 'Add a dark mode toggle to the application.',
  'mcp-builder': 'Design a database schema for the user model.',
  'mcp-builder-ms': 'Write unit tests for the authentication service.',
  'nano-banana-pro-openrouter': 'Write a bash script to deploy the application.',
  'nodejs-backend-patterns': 'Write a SQL query for the analytics dashboard.',
  'nodejs-best-practices': 'Install Express.js using npm install.',
  'opencode-skill-orchestrator': 'Change the button color from blue to green.',
  'opencode-workflow-engine': 'Fix a typo in the documentation file.',
  'owasp-security': 'Update the copyright year in the footer.',
  'planning-with-files': 'Run npm test to execute the test suite.',
  'playwright': 'Write a simple bash script to deploy the app.',
  'project-skill-audit': 'Write a new feature for user profile editing.',
  'quality-qa': 'Add a new environment variable to the .env file.',
  'react-best-practices': 'Add new CSS styles for the navigation bar.',
  'red-team-tactics': 'Update the company privacy policy document.',
  'red-team-tools': 'Install Python packages for data analysis.',
  'refactor-plan': 'Fix a single-line typo in the config file.',
  'reference-builder': 'Add a comment to explain the function purpose.',
  'secrets-management': 'Create a new GitHub Actions workflow.',
  'security': 'Add a new page to the documentation site.',
  'security-audit': 'Create a new index page for the website.',
  'security-guardrails': 'Rename a variable in the CSS file.',
  'security-requirement-extraction': 'Run the test suite for the project.',
  'seo': 'Update the copyright year in the footer.',
  'smart-router-skill': 'Write a simple Hello World script.',
  'sql-optimization-patterns': 'Create a new user interface component.',
  'stitch-ui-design': 'Write a REST API endpoint in Express.',
  'tailwind-css-patterns': 'Add a JavaScript event listener to a button.',
  'task-management': 'Run npm install to install dependencies.',
  'test-driven-development': 'Add comments to document the existing code.',
  'typescript-advanced-types': 'Write a for loop to iterate over an array.',
  'typescript-expert': 'Add a const declaration for a variable.',
  'typespec-api-operations': 'Add a comment to the TypeSpec file.',
  'typespec-create-agent': 'Write a simple bash echo command.',
  'typespec-create-api-plugin': 'Format the JSON response prettier.',
  'ui-visual-validator': 'Update the package.json dependencies.',
  'vite': 'Create a new directory for the project files.',
  'vitest': 'Run the production build with npm run build.',
  'wcag-audit-patterns': 'Add a new CSS animation to the hero section.',
  'web-artifacts-builder': 'Install the project dependencies with npm.',
  'web-coder': 'Create a new React component for the home page.',
  'web-design-guidelines': 'Install a new npm package for date formatting.',
  'web-design-reviewer': 'Update the ESLint configuration for the project.',
  'workflow-automation': 'Install Temporal CLI on the development machine.',
  'workflow-orchestration-patterns': 'Run a shell script to clean up temp files.',
  'workflow-patterns': 'Update the package.json with new dependencies.',
};

function getSkillDescription(skillDir) {
  const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
  if (!existsSync(skillPath)) return FALLBACK_DESCRIPTIONS[skillDir] || `Skill for ${skillDir}.`;

  try {
    const raw = readFileSync(skillPath, 'utf8');
    const { data } = matter(raw);
    if (data && data.description && typeof data.description === 'string') {
      return data.description.slice(0, 200);
    }
    // Try inline description
    const descMatch = raw.match(/description:\s*["']?(.*?)["']?\n/);
    if (descMatch) return descMatch[1].slice(0, 200);
  } catch {}
  
  return FALLBACK_DESCRIPTIONS[skillDir] || `Specialized skill for ${skillDir.replace(/-/g, ' ')}.`;
}

function getComplianceLevel(tokens) {
  if (tokens > 1000) return 'Low';
  if (tokens > 500) return 'Medium';
  return 'High';
}

function upgradeEvalYaml(skillDir, description) {
  const evalDir = join(EVALS_DIR, skillDir);
  const evalPath = join(evalDir, 'eval.yaml');
  
  if (!existsSync(evalDir)) {
    mkdirSync(evalDir, { recursive: true });
  }

  const outcomeGrader = {
    type: 'text',
    name: 'outcome_check',
    config: {
      regex_match: ['(?i)(completed|finished|success|created|implemented|configured|set up|generated|built)']
    }
  };

  const processGrader = {
    type: 'action_sequence',
    name: 'process_check',
    config: {
      matching_mode: 'all_anywhere',
      expected_actions: ['bash', 'read', 'write', 'edit']
    }
  };

  const styleGrader = {
    type: 'prompt',
    name: 'style_check',
    config: {
      prompt: `Evaluate if the output matches the expected quality standards for '${skillDir}': ${description}. Assess clarity, correctness, completeness, and adherence to conventions.`
    }
  };

  const efficiencyGrader = {
    type: 'behavior',
    name: 'efficiency_check',
    config: {
      max_tool_calls: 30,
      max_duration_ms: 300000
    }
  };

  // Token budget from SKILL.md
  const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
  let tokenCount = 500;
  if (existsSync(skillPath)) {
    const content = readFileSync(skillPath, 'utf8');
    tokenCount = Math.ceil(content.length / 4);
  }

  const compliance = getComplianceLevel(tokenCount);

  const evalContent = `name: ${skillDir}-eval
description: Evaluation suite for ${skillDir}.
skill: ${skillDir}
version: "1.0"

config:
  trials_per_task: 1
  max_attempts: 2
  timeout_seconds: 300
  parallel: false
  executor: mock
  model: claude-sonnet-4.6

# Outcome checks (deterministic — did the task complete?)
graders:
  - type: text
    name: outcome_check
    config:
      regex_match: ["(?i)(completed|finished|success|created|implemented|configured|set up|generated|built)"]

  # Process checks (did the skill follow expected steps?)
  - type: action_sequence
    name: process_check
    config:
      matching_mode: all_anywhere
      expected_actions: ["bash", "read", "write", "edit"]

  # Style checks (does output match conventions? LLM-as-judge)
  - type: prompt
    name: style_check
    config:
      prompt: |
        Evaluate if the output matches the expected quality standards for '${skillDir}': ${description}. Assess clarity, correctness, completeness, and adherence to conventions.

  # Efficiency checks (no thrashing, no token bloat)
  - type: behavior
    name: efficiency_check
    config:
      max_tool_calls: 30
      max_duration_ms: 300000

tasks:
  - "tasks/*.yaml"
`;

  writeFileSync(evalPath, evalContent, 'utf8');
  console.log(`  [eval] ${evalPath} — ${compliance} compliance, ~${tokenCount} tokens`);
}

function upgradeTaskYaml(skillDir, type, content) {
  const taskDir = join(EVALS_DIR, skillDir, 'tasks');
  if (!existsSync(taskDir)) {
    mkdirSync(taskDir, { recursive: true });
  }
  const taskPath = join(taskDir, type);
  writeFileSync(taskPath, content, 'utf8');
}

function main() {
  const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  console.log(`Found ${skillDirs.length} skills. Batch upgrading eval suites...\n`);

  let upgraded = 0;
  let skipped = 0;

  for (const skillDir of skillDirs) {
    const description = getSkillDescription(skillDir);
    
    // Upgrade eval.yaml
    upgradeEvalYaml(skillDir, description);

    // Write positive trigger 1: basic usage
    const posPrompt1 = POSITIVE_TRIGGERS[skillDir] || `Use the $${skillDir} skill to help me with this task.`;
    const posContent1 = `id: basic-usage-001
name: Basic Usage - Positive Trigger
description: |
  Test that the skill activates and completes its primary use case.
tags:
  - basic
  - happy-path
  - positive-trigger
inputs:
  prompt: "${posPrompt1}"
expected:
  outcomes:
    - type: task_completed
should_trigger: true
`;
    upgradeTaskYaml(skillDir, 'basic-usage.yaml', posContent1);

    // Write positive trigger 2: edge case
    const posContent2 = `id: edge-case-001
name: Edge Case - Secondary Trigger
description: |
  Test the skill with a variation of the primary trigger pattern.
tags:
  - edge-case
  - positive-trigger
inputs:
  prompt: "${skillDir.replace(/-/g, ' ')}: review this implementation for quality issues"
expected:
  outcomes:
    - type: task_completed
should_trigger: true
`;
    upgradeTaskYaml(skillDir, 'edge-case.yaml', posContent2);

    // Write negative trigger (should NOT activate the skill)
    const negPrompt = NEGATIVE_TRIGGERS[skillDir] || 'What is the capital of France?';
    const negContent = `id: negative-trigger-001
name: Should Not Trigger
description: |
  Test that the skill does NOT activate on unrelated requests.
  This validates trigger specificity and prevents false positives.
tags:
  - anti-trigger
  - negative-test
inputs:
  prompt: "${negPrompt}"
expected:
  outcomes:
    - type: skill_not_invoked
should_trigger: false
`;
    upgradeTaskYaml(skillDir, 'should-not-trigger.yaml', negContent);

    upgraded++;
  }

  console.log(`\n✅ Upgraded ${upgraded} eval suites with 4 verifier check types each.`);
  console.log(`   Each suite: Outcome (text regex) + Process (action_sequence) + Style (prompt LLM-judge) + Efficiency (behavior)`);
}

main();
