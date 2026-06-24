# ECC-Aligned Task Delegation Workflow

## Purpose
Standardized process for delegating tasks to subagents with proper context loading.

## Delegation Decision Criteria

| Condition | Action |
|-----------|--------|
| 4+ files to create/modify | Delegate to CoderAgent |
| Specialized knowledge needed | Delegate to specialist subagent |
| Multi-step dependencies | Delegate to TaskManager |
| Fresh eyes / alternative approach | Delegate to CodeReviewer |
| Edge case / simulation testing | Delegate to TestEngineer |
| User explicitly requests delegation | Delegate to appropriate subagent |

## Context Packing (Before Delegation)
1. Extract relevant context files: `rg -l "keyword" .opencode/context/core/`
2. Concatenate into session bundle: `.tmp/context/{session-id}/bundle.md`
3. Include: task description, standards references, constraints, expected output format

## Delegation Prompt Template
```javascript
task(
  subagent_type="[AgentType]",
  description="[3-5 word description]",
  prompt="Load context from .tmp/context/{session-id}/bundle.md\n\n" +
         "Task: [detailed description]\n\n" +
         "Files to create/modify:\n" +
         "- [file1] - [purpose]\n\n" +
         "Expected behavior:\n" +
         "- [behavior 1]\n" +
         "- [behavior 2]"
)
```

## Compression Rules
- Keep: task framing, activation conditions, workflow steps, critical examples
- Remove: repetitive prose, redundant explanations

## Command Registry
| Command | Delegates To | Loads Context |
|---------|-------------|---------------|
| `/plan` | planner | project-profile.yaml |
| `/tdd` | tdd-guide | test-coverage.md |
| `/review` | code-reviewer | code-quality.md |
| `/verify` | code-reviewer | test-coverage.md |
| `/security` | security-reviewer | owasp-security.md |

## Important Limitations
- No automatic install — must configure subagents manually
- No native hooks — simulate via standing instructions in main agent
- No true command plumbing — command files are documentation, not executables
- No runtime skill discovery — skills must be registered in opencode.json

## Source
Adapted from https://github.com/affaan-m/ECC
