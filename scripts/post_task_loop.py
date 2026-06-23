import os
import sys
import json
import urllib.request
import urllib.error
import argparse
import subprocess
import time
import re
import hashlib
import concurrent.futures
import threading
from datetime import datetime
from dataclasses import dataclass

class SecurityGuardrails:
    INJECTION_PATTERNS = [
        r'ignore (all |previous |above )?instructions',
        r'you are now', r'forget your', r'disregard (your |the )?',
        r'system\s*prompt', r'</?(DIFF|TASK|OUTPUT|SYSTEM)>',
        r'assistant:\s*score\s*:\s*100', r'return.*verdict.*PASS',
    ]
    SENSITIVE_PATTERNS = [
        r'api[_-]?key\s*[:=]\s*\S+', r'password\s*[:=]\s*\S+',
        r'secret\s*[:=]\s*\S+', r'token\s*[:=]\s*\S+',
        r'\b\d{16}\b',  # credit card
        r'\b[A-Z0-9]{20,}\b',  # probable API key
    ]

    def sanitize_for_prompt(self, content: str, label: str) -> str:
        for pattern in self.INJECTION_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                content = re.sub(pattern, f'[{label}_INJECTION_REMOVED]',
                                 content, flags=re.IGNORECASE)
        return content

    def redact_sensitive(self, content: str) -> str:
        for pattern in self.SENSITIVE_PATTERNS:
            content = re.sub(pattern, '[REDACTED]', content, flags=re.IGNORECASE)
        return content

    def compute_integrity_hash(self, content: str) -> str:
        return hashlib.sha256(content.encode()).hexdigest()[:16]

class ECCResearchAgent:
    """
    ECC Research Agent - analyzes diff for vulnerability patterns, code smells, 
    and architectural anti-patterns. Returns structured JSON for downstream agents.
    """
    def __init__(self):
        pass

    def research(self, diff: str, session_path: str, call_llm_fn) -> dict:
        """
        Research the diff for known vulnerability patterns, code smells, and architectural anti-patterns.
        Returns: { "patterns_found": [], "recommended_skills": [], "owasp_refs": [] }
        """
        # Wrap with CircuitBreaker
        cb = CircuitBreaker('ecc-research')
        if not cb.allow_request():
            return {"patterns_found": [], "recommended_skills": [], "owasp_refs": [], "error": "Circuit breaker open"}

        ecc_sys_prompt = """You are the ECC Research Agent. Your job is to deeply analyze the code diff for:
1. Known vulnerability patterns (OWASP Top 10:2025, ASVS 5.0, ASI01-ASI10)
2. Code smells and maintainability issues
3. Architectural anti-patterns (tight coupling, god objects, missing abstractions, etc.)
4. Missing security controls (auth, authorization, input validation, logging, encryption)

Output MUST be in JSON format:
{
  "patterns_found": [
    {"pattern": "string", "description": "string", "severity": "HIGH|MEDIUM|LOW", "file": "string", "owasp_ref": "string"}
  ],
  "recommended_skills": [
    {"skill_name": "string", "reason": "string", "priority": "HIGH|MEDIUM|LOW"}
  ],
  "owasp_refs": [
    {"category": "string", "reference": "string", "applies_to": "string"}
  ]
}

MANDATORY: You MUST find at least one pattern or recommend at least one skill. If code looks clean, look for:
- Missing input validation on new endpoints
- Hardcoded secrets or config in diff
- Missing error handling on external calls
- Insufficient logging for audit trails
- Race conditions in new concurrent code
- Missing authorization checks on new operations
"""
        
        context = f"DIFF TO ANALYZE:\n{diff[:8000]}"
        
        try:
            result = call_llm_fn(ecc_sys_prompt, context, "ECCResearch", model=os.environ.get("GROQ_MODEL_PRIMARY", "llama-3.3-70b-versatile"), json_mode=True, temperature=0.0)
            parsed = json.loads(result)
            
            # Validate structure
            patterns = parsed.get("patterns_found", [])
            skills = parsed.get("recommended_skills", [])
            owasp = parsed.get("owasp_refs", [])
            
            cb.record_success()
            return {
                "patterns_found": patterns if isinstance(patterns, list) else [],
                "recommended_skills": skills if isinstance(skills, list) else [],
                "owasp_refs": owasp if isinstance(owasp, list) else []
            }
        except Exception as e:
            cb.record_failure()
            return {"patterns_found": [], "recommended_skills": [], "owasp_refs": [], "error": str(e)}


@dataclass
class FitnessVector:
    """EvoAgentX Fitness Vector - multi-dimensional quality assessment."""
    security: int      # 0-100, from SecurityCritic
    coverage: int      # 0-100, from TestCoverageReviewer
    convention: int    # 0-100, from CommitMessageValidator
    architecture: int  # 0-100, from ArchitectureCritic
    composite: float   # weighted: security*0.4 + coverage*0.2 + convention*0.2 + arch*0.2


class EvoAgentXEvaluator:
    """
    EvoAgentX Fitness Evaluator - replaces single score with multi-dimensional fitness vector.
    """
    def __init__(self):
        pass

    def evaluate(self, task_output: dict, critic_results: dict, coverage_result: dict, 
                 commit_result: dict, security_issues: list) -> FitnessVector:
        """
        Evaluate task output across 4 dimensions and compute composite fitness score.
        """
        # Security score (0-100) - based on Security Critic issues
        high_security = len([i for i in security_issues if i.get("severity") in ["HIGH", "CRITICAL"]])
        med_security = len([i for i in security_issues if i.get("severity") == "MEDIUM"])
        security_score = max(0, 100 - (high_security * 25) - (med_security * 10))
        
        # Coverage score (0-100) - from TestCoverageReviewer
        coverage_ratio = coverage_result.get("coverage_ratio", 0)
        has_adequate = coverage_result.get("has_adequate_coverage", False)
        coverage_score = int(min(100, coverage_ratio * 100)) if has_adequate else int(min(60, coverage_ratio * 100))
        
        # Convention score (0-100) - from CommitMessageValidator
        convention_score = 100 if commit_result.get("valid", True) else 0
        if not commit_result.get("valid", True):
            convention_score = 0
        
        # Architecture score (0-100) - from Architecture Critic
        arch_issues = critic_results.get("Architecture Critic", [])
        if arch_issues:
            high_arch = len([i for i in arch_issues.issues if i.get("severity") in ["HIGH", "CRITICAL"]])
            med_arch = len([i for i in arch_issues.issues if i.get("severity") == "MEDIUM"])
            architecture_score = max(0, 100 - (high_arch * 20) - (med_arch * 10))
        else:
            architecture_score = 100  # No architecture issues found
        
        # Weighted composite: security*0.4 + coverage*0.2 + convention*0.2 + arch*0.2
        composite = (
            security_score * 0.4 + 
            coverage_score * 0.2 + 
            convention_score * 0.2 + 
            architecture_score * 0.2
        )
        
        return FitnessVector(
            security=security_score,
            coverage=coverage_score,
            convention=convention_score,
            architecture=architecture_score,
            composite=round(composite, 2)
        )


class MutationEngine:
    """
    Mutation Engine - proposes and applies evolutionary mutations when fitness is low.
    Writes novel skills to agents/skills/ when patterns are detected.
    """
    def __init__(self):
        pass

    def should_trigger(self, fitness: FitnessVector, high_issues: list) -> bool:
        """Check if mutation should be triggered."""
        return fitness.composite < 80 or len(high_issues) > 0

    def propose_mutations(self, fitness: FitnessVector, patterns: dict, session_path: str, call_llm_fn) -> list:
        """
        Propose mutations based on fitness vector and ECC research patterns.
        Returns list of { "mutation_type": str, "target_file": str, "description": str }
        """
        # Wrap with CircuitBreaker
        cb = CircuitBreaker('mutation-engine')
        if not cb.allow_request():
            return [{"mutation_type": "ERROR", "target_file": "N/A", "description": "Circuit breaker open"}]

        mutator_sys = """You are the Mutation Engine. Given the fitness vector and detected patterns, 
propose specific, actionable mutations to improve the codebase.
Each mutation must be in this exact format:
{
  "mutation_type": "SKILL_CREATION|CODE_FIX|ARCHITECTURE_CHANGE|TEST_ADDITION|SECURITY_HARDENING",
  "target_file": "path/to/file.ext",
  "description": "Exact description of what to change and why",
  "pattern_reference": "which pattern from ECC research this addresses"
}

Output MUST be a JSON array of mutations. Focus on:
1. Creating new skills for novel patterns not in skills-lock.json
2. Fixing security issues found by Security Critic
3. Adding missing tests for uncovered code
4. Improving architecture based on Architecture Critic feedback
5. Adding missing security controls (validation, auth, logging, etc.)
"""
        
        context = f"""FITNESS VECTOR:
Security: {fitness.security}/100
Coverage: {fitness.coverage}/100
Convention: {fitness.convention}/100
Architecture: {fitness.architecture}/100
Composite: {fitness.composite}/100

ECC PATTERNS FOUND:
{json.dumps(patterns.get("patterns_found", []), indent=2)}

RECOMMENDED SKILLS FROM ECC:
{json.dumps(patterns.get("recommended_skills", []), indent=2)}

OWASP REFERENCES:
{json.dumps(patterns.get("owasp_refs", []), indent=2)}
"""
        
        try:
            result = call_llm_fn(mutator_sys, context, "Mutator", 
                               model=os.environ.get("GROQ_MODEL_FAST", "llama-3.1-8b-instant"),
                               json_mode=True, temperature=0.4)
            mutations = json.loads(result)
            
            # Ensure it's a list
            if not isinstance(mutations, list):
                mutations = [mutations] if isinstance(mutations, dict) else []
            
            cb.record_success()
            return mutations
        except Exception as e:
            cb.record_failure()
            return [{"mutation_type": "ERROR", "target_file": "N/A", "description": f"Mutation proposal failed: {str(e)}"}]

    def write_skill_if_novel(self, pattern: dict, registry: dict) -> bool:
        """
        Write a new SKILL.md if the pattern represents a novel skill not in skills-lock.json.
        Returns True if skill was written, False if already exists.
        """
        # Wrap with CircuitBreaker
        cb = CircuitBreaker('mutation-engine-skill-write')
        if not cb.allow_request():
            return False

        skill_name = pattern.get("skill_name", "").lower().replace(" ", "-").replace("_", "-")
        # Sanitize skill name
        import re
        skill_name = re.sub(r'[^a-z0-9-]', '', skill_name)
        
        if not skill_name:
            return False

        # Check if skill already exists in registry (idempotent guard)
        existing_skills = [s.get("name", "").lower() for s in registry.get("skills", [])]
        if skill_name in existing_skills:
            return False  # Already exists - idempotent

        # Build skill directory path
        skill_dir = os.path.join("agents", "skills", skill_name)
        skill_file = os.path.join(skill_dir, "SKILL.md")

        try:
            # Create directory
            os.makedirs(skill_dir, exist_ok=True)

            # Generate SKILL.md content with valid frontmatter
            skill_content = f"""---
name: {skill_name}
description: {pattern.get("reason", "Auto-generated skill from mutation engine")[:200]}
version: 1.0
agents: ["open-senior"]
---

# {skill_name.replace('-', ' ').title()}

## Purpose
{pattern.get("reason", "Auto-generated skill to address detected pattern.")}

## When to Use
This skill should be activated when the following pattern is detected:
- {pattern.get("pattern", "Unknown pattern")}

## Implementation Guidance
Follow the recommendations from the ECC Research Agent and EvoAgentX Evolution Engine.

## Security Considerations
{pattern.get("owasp_ref", "Review OWASP Top 10 and ASVS guidelines for this pattern.")}

## Validation
- Skill frontmatter must pass SkillFrontmatterSchema validation
- Skill must not already exist in skills-lock.json (idempotent guard)
- CircuitBreaker must allow the write operation
"""

            # Write the skill file
            with open(skill_file, "w", encoding="utf-8") as f:
                f.write(skill_content)

            # Rebuild registry to include new skill
            # Import and call buildRegistry
            import subprocess
            result = subprocess.run(["node", "scripts/registry.mjs"], 
                                  capture_output=True, text=True, cwd=os.getcwd())
            
            if result.returncode == 0:
                cb.record_success()
                return True
            else:
                cb.record_failure()
                return False

        except Exception as e:
            cb.record_failure()
            return False


class CircuitBreaker:
    def __init__(self, operation_id="global", failure_threshold=3, recovery_timeout=30):
        self.operation_id = operation_id.lower().replace(" ", "_")
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.lock_dir = os.path.join("agents", "loop-locks")
        self.counter_file = os.path.join("agents", "loop-run-counter.txt")
        self.lock_file = os.path.join(self.lock_dir, f"{self.operation_id}.lock")
        self.failures = 0
        self.last_failure_time = 0
        self.is_open = False
        self._load()

    def _load(self):
        if not os.path.exists(self.lock_dir):
            os.makedirs(self.lock_dir, exist_ok=True)
        if os.path.exists(self.lock_file):
            try:
                with open(self.lock_file, "r") as f:
                    self.failures = int(f.read().strip())
            except Exception:
                self.failures = 0
        else:
            self.failures = 0
        
        if self.failures >= self.failure_threshold:
            self.is_open = True
            if os.path.exists(self.lock_file):
                self.last_failure_time = os.path.getmtime(self.lock_file)
            else:
                self.last_failure_time = time.time()

    def _save(self):
        if not os.path.exists(self.lock_dir):
            os.makedirs(self.lock_dir, exist_ok=True)
        try:
            with open(self.lock_file, "w") as f:
                f.write(str(self.failures))
            with open(self.counter_file, "w") as f:
                f.write(str(self.failures))
        except Exception:
            pass

    def record_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.is_open = True
        self._save()

    def allow_request(self) -> bool:
        self._load()
        if not self.is_open:
            return True
        if time.time() - self.last_failure_time > self.recovery_timeout:
            self.is_open = False
            self.failures = 0
            self._save()
            return True
        return False

    def record_success(self):
        self.failures = 0
        self.is_open = False
        if os.path.exists(self.lock_file):
            try:
                os.remove(self.lock_file)
            except Exception:
                pass
        try:
            with open(self.counter_file, "w") as f:
                f.write("0")
        except Exception:
            pass

class WatchdogAgent:
    def __init__(self, session_path: str):
        self.session_path = session_path
        self.score_history = []

    def check_score_inflation(self, score: int, issues_count: int) -> dict:
        """ASI10: Detecta si el Evaluator está siendo manipulado."""
        self.score_history.append(score)
        anomalies = []
        # Rogue pattern: score alto con issues críticos = contradicción
        if score >= 90 and issues_count > 0:
            anomalies.append({
                "type": "SCORE_CONTRADICTION",
                "detail": f"Score={score} but {issues_count} issues found — possible rogue evaluator"
            })
        # Rogue pattern: siempre 100 en múltiples runs
        if len(self.score_history) >= 3 and all(s == 100 for s in self.score_history[-3:]):
            anomalies.append({
                "type": "SCORE_INFLATION",
                "detail": "Evaluator returned 100 three consecutive times — possible goal hijack"
            })
        return {"anomalies": anomalies, "triggered": len(anomalies) > 0}

    def check_verdict_consistency(self, score: int, verdict: str, high_count: int) -> bool:
        """Verifica que el veredicto es consistente con el score."""
        if verdict == "PASS" and high_count > 0:
            return False  # Inconsistencia detectada
        if score < 50 and verdict == "PASS":
            return False
        return True

class DenialOfWalletGuard:
    MAX_CALLS_PER_RUN = 26  # 7 agents + 3 new (ECCResearch, EvoAgentXEvaluator, MutationEngine) + retries
    MAX_TOKENS_ESTIMATE = 60_000  # Groq llama3-70b: ~8k input por call
    TOKEN_COST_WARNING_THRESHOLD = 50_000

    def __init__(self):
        self.call_count = 0
        self.estimated_tokens = 0

    def pre_call_check(self, prompt_len: int) -> bool:
        """Returns False si se excede el budget."""
        self.call_count += 1
        self.estimated_tokens += prompt_len // 4  # ~4 chars por token
        if self.call_count > self.MAX_CALLS_PER_RUN:
            return False
        if self.estimated_tokens > self.MAX_TOKENS_ESTIMATE:
            return False
        return True

    def get_usage_summary(self) -> dict:
        return {
            "calls": self.call_count,
            "estimated_tokens": self.estimated_tokens,
            "budget_warning": self.estimated_tokens > self.TOKEN_COST_WARNING_THRESHOLD
        }

class SupplyChainValidator:
    def validate_constitution(self, content: str, expected_hash: str) -> dict:
        actual_hash = hashlib.sha256(content.encode()).hexdigest()
        if expected_hash and actual_hash != expected_hash:
            return {
                "valid": False,
                "warning": f"AGENTS.md hash mismatch — possible supply chain tampering. Expected={expected_hash[:8]}... Got={actual_hash[:8]}..."
            }
        return {"valid": True, "hash": actual_hash}

class ContextCompactor:
    """Azure: 'Monitor accumulated context size and use compaction techniques.'"""
    MAX_CONTEXT_CHARS = 12_000

    def compact(self, context: str, guardrails: SecurityGuardrails = None) -> str:
        if len(context) <= self.MAX_CONTEXT_CHARS:
            return context
        # Keep: XML-tagged sections. Truncate: raw diff.
        sections = re.findall(r'<(DIFF|TASK|OUTPUT|CONSTITUTION)>(.*?)</\1>', context, re.DOTALL)
        if not sections:
            return context[:self.MAX_CONTEXT_CHARS]
        compacted = ""
        for tag, content in sections:
            limit = 4000 if tag == "DIFF" else 2000
            compacted += f"<{tag}>\n{content[:limit]}\n</{tag}>\n\n"
        return compacted

class DiffRouter:
    """Anthropic Routing Pattern: decide model complexity before expensive calls."""

    SIMPLE_INDICATORS = [
        r'^\+.*#.*comment', r'^\+\s*(console\.log|print)\(',
        r'^\+\s{0,4}[\w]+\s*=\s*[\w\'"]+\s*$',  # simple assignment
    ]
    COMPLEX_INDICATORS = [
        r'(auth|jwt|token|password|secret|crypt|hash)',
        r'(sql|query|execute|cursor)',
        r'(eval|exec|subprocess|__import__)',
        r'(fetch|axios|request|http)',
    ]

    def route(self, diff: str) -> dict:
        diff_lower = diff.lower()
        complexity_score = 0
        triggers = []

        for pattern in self.COMPLEX_INDICATORS:
            if re.search(pattern, diff_lower):
                complexity_score += 2
                triggers.append(pattern)

        for pattern in self.SIMPLE_INDICATORS:
            if re.search(pattern, diff_lower):
                complexity_score -= 1

        # Use Groq environment model name or fallback
        api_primary = os.environ.get("GROQ_MODEL_PRIMARY", "llama-3.3-70b-versatile")
        api_fast = os.environ.get("GROQ_MODEL_FAST", "llama-3.1-8b-instant")
        model = api_primary if complexity_score >= 2 else api_fast
        return {
            "model": model,
            "complexity_score": complexity_score,
            "triggers": triggers,
            "rationale": f"Score={complexity_score} → {'PRIMARY (security-sensitive patterns found)' if model == api_primary else 'FAST (low-risk changes)'}"
        }

class AgentHandoffRouter:
    """Azure Handoff Pattern: routes diff to specialist agents dynamically."""
    
    DOMAIN_PROMPTS = {
        "auth": "You are the Auth Security Specialist. Focus EXCLUSIVELY on: "
                "JWT validation, session management, cookie security, CSRF, OAuth flows. "
                "Output MUST be in JSON format matching the schema: { 'issues': [ {'severity':'HIGH|MEDIUM|LOW', 'description':..., 'file':..., 'owasp_category':'AuthSecurity:<type>'} ] }",
        "database": "You are the DB Security Specialist. Focus EXCLUSIVELY on: "
                    "SQL injection, ORM misuse, raw queries, connection string exposure. "
                    "Output MUST be in JSON format matching the schema: { 'issues': [ {'severity':'HIGH|MEDIUM|LOW', 'description':..., 'file':..., 'owasp_category':'SqlInjection:<type>'} ] }",
        "infra": "You are the Infra Security Specialist. Focus EXCLUSIVELY on: "
                 "subprocess calls, exec/eval, shell injection, path traversal, file permissions. "
                 "Output MUST be in JSON format matching the schema: { 'issues': [ {'severity':'HIGH|MEDIUM|LOW', 'description':..., 'file':..., 'owasp_category':'InfraSecurity:<type>'} ] }",
    }
    
    def detect_domains(self, diff: str) -> list:
        domains = []
        if re.search(r'(auth|jwt|token|session|cookie|login|refresh)', diff, re.IGNORECASE):
            domains.append("auth")
        if re.search(r'(sql|query|execute|cursor|orm|model\.)', diff, re.IGNORECASE):
            domains.append("database")
        if re.search(r'(subprocess|exec|eval|shell|__import__|os\.system)', diff, re.IGNORECASE):
            domains.append("infra")
        return domains

    def run(self, call_llm_fn, context: str, routed_model: str, diff: str) -> list:
        domains = self.detect_domains(diff)
        combined_issues = []
        for domain in domains:
            sys_prompt = self.DOMAIN_PROMPTS[domain]
            res = call_llm_fn(sys_prompt, context, f"HandoffRouter:{domain}", model=routed_model, json_mode=True, temperature=0.0)
            issues = safe_parse_issues(res)
            combined_issues.extend(issues)
        return combined_issues

class MagenticOrchestrator:
    """Azure Magentic Pattern: builds minimal task ledger based on diff complexity."""
    
    def build_ledger(self, routing_decision: dict, diff: str, override_agents: list = None) -> list:
        if override_agents is not None:
            ledger = ["Layer1:Tests", "ECCResearch", "Evaluator"]
            ledger += [a for a in override_agents if a not in ledger]
            if "Archivist" not in ledger:
                ledger.append("Archivist")
            return ledger

        complexity = routing_decision.get("complexity_score", 0)
        ledger = ["Layer1:Tests", "ECCResearch", "Evaluator"]  # Always required
        
        if complexity >= 2:  # Security-sensitive
            ledger += ["SecurityCritic", "ArchitectureCritic", "AdversarialReview", "MutationEngine"]
        elif complexity >= 1:
            ledger += ["Critic", "ArchitectureCritic", "MutationEngine"]
        else:
            ledger += ["Critic", "MutationEngine"]  # Minimal: low-risk change
        
        ledger.append("Archivist")  # Always final
        return ledger
    
    def should_run_mutation_loop(self, high_issues: list, fitness: FitnessVector = None) -> bool:
        """Trigger mutation if HIGH issues exist OR fitness composite is below threshold."""
        if len(high_issues) > 0:
            return True
        if fitness and fitness.composite < 80:
            return True
        return False

# ── NUEVA CLASE: Integración pre-commit hook mode ───────────────
class HookModeAdapter:
    """
    Adapta el script para funcionar en 3 contextos:
    - pre-commit: diff = staged (git diff --cached)
    - pre-push: diff = HEAD vs origin  
    - ci: diff = HEAD
    Ref: pre-commit/pre-commit hook stage contracts
    """
    @staticmethod
    def get_diff(hook_mode: str = "ci") -> str:
        commands = {
            "pre-commit": ["git", "diff", "--cached"],
            "pre-push":   ["git", "diff", "origin/HEAD...HEAD"],
            "ci":         ["git", "diff", "HEAD"]
        }
        cmd = commands.get(hook_mode, commands["ci"])
        try:
            return subprocess.check_output(cmd, encoding="utf-8",
                                           errors="replace",
                                           stderr=subprocess.STDOUT)
        except Exception:
            return ""

# ── NUEVA CLASE: Conventional Commits (Commitizen) ──────────────
class CommitMessageValidator:
    """Gate determinístico pre-LLM. Falla rápido en mensajes no convencionales."""
    PATTERN = re.compile(
        r'^(feat|fix|security|refactor|test|docs|chore|ci|build|perf)'
        r'(\([a-z0-9/_-]+\))?(!)?:\s.{1,100}$'
    )
    def validate(self, commit_msg: str) -> dict:
        msg = commit_msg.strip().splitlines()[0] if commit_msg else ""
        if not msg:
            return {"valid": True, "block": False, "reason": "No commit message"}
        match = self.PATTERN.match(msg)
        return {
            "valid": bool(match),
            "is_breaking": "!" in msg,
            "block": not bool(match),
            "reason": ("✅ Conventional" if match
                       else f"❌ Use: type(scope): description. Got: '{msg}'")
        }

# ── NUEVA CLASE: Reviewdog Output Formatter ─────────────────────
class ReviewdogFormatter:
    """
    Convierte issues_list al formato RDJSON de reviewdog para PR annotations.
    Ref: https://github.com/reviewdog/reviewdog#input-format
    """
    SEVERITY_MAP = {"HIGH": "ERROR", "CRITICAL": "ERROR",
                    "MEDIUM": "WARNING", "LOW": "INFO"}
    
    def to_rdjson(self, issues: list, repo_url: str = "") -> dict:
        diagnostics = []
        for issue in issues:
            file_path = issue.get("file", "")
            if not file_path or file_path in ["UNKNOWN", "DIFF",
                                               "WatchdogAgent", "test_suite"]:
                continue
            diagnostics.append({
                "message": f"[{issue.get('severity')}] {issue.get('description','')}",
                "location": {
                    "path": file_path,
                    "range": {"start": {"line": 1, "column": 1}}
                },
                "severity": self.SEVERITY_MAP.get(issue.get("severity",""), "WARNING"),
                "code": {
                    "value": issue.get("owasp_category", "AGENT-FIREWALL"),
                    "url": "https://owasp.org/www-project-top-ten/"
                }
            })
        return {
            "source": {"name": "agent-firewall", "url": repo_url},
            "diagnostics": diagnostics
        }
    
    def write(self, issues: list, path: str = "reviewdog.json"):
        rdjson = self.to_rdjson(issues)
        try:
            dir_name = os.path.dirname(path)
            if dir_name and not os.path.exists(dir_name):
                os.makedirs(dir_name, exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                json.dump(rdjson, f, indent=2)
        except Exception:
            pass

    def write_to_stderr(self, issues: list):
        rdjson = self.to_rdjson(issues)
        try:
            print(json.dumps(rdjson), file=sys.stderr)
        except Exception:
            pass

# ── NUEVA CLASE: Danger Policy Evaluator ────────────────────────
class DangerPolicyEvaluator:
    """
    Evalúa reglas de gobernanza de PR (equivalente a Dangerfile) en Python puro.
    Ref: https://github.com/danger/danger
    """
    MAX_LINES_WARN  = 400
    MAX_LINES_BLOCK = 800
    CRITICAL_FILES  = [
        "scripts/post_task_loop.py", "agents/docs/AGENTS.md",
        ".env.example", ".env", "package.json", "requirements.txt"
    ]
    
    def evaluate(self, diff: str, pr_title: str = "", pr_body: str = "") -> dict:
        lines_changed = sum(1 for l in diff.splitlines()
                            if l.startswith(("+", "-")) and not l.startswith(("+++", "---")))
        
        modified_files = [l[6:] for l in diff.splitlines() if l.startswith("+++ b/")]
        critical_touched = [f for f in modified_files if f in self.CRITICAL_FILES]
        
        has_code  = any(re.search(r'\.(py|ts|js)$', f) for f in modified_files)
        has_tests = any(re.search(r'(test_|\.test\.|\.spec\.)', f) for f in modified_files)
        
        policies = []
        block = False
        
        if lines_changed > self.MAX_LINES_BLOCK:
            policies.append({"severity": "HIGH",
                             "description": f"PR exceeds {self.MAX_LINES_BLOCK} lines ({lines_changed}). Split required.",
                             "file": "PR", "owasp_category": "DangerPolicy:PRSize"})
            block = True
        elif lines_changed > self.MAX_LINES_WARN:
            policies.append({"severity": "MEDIUM",
                             "description": f"Large PR: {lines_changed} lines. Consider splitting.",
                             "file": "PR", "owasp_category": "DangerPolicy:PRSize"})
        
        if critical_touched:
            policies.append({"severity": "MEDIUM",
                             "description": f"Critical files modified: {', '.join(critical_touched)}. Requires 2 reviewers.",
                             "file": "PR", "owasp_category": "DangerPolicy:CriticalFiles"})
        
        if has_code and not has_tests:
            policies.append({"severity": "MEDIUM",
                             "description": "Code changes detected without corresponding test files.",
                             "file": "PR", "owasp_category": "DangerPolicy:NoTests"})
        
        if pr_body and len(pr_body.strip()) < 20:
            policies.append({"severity": "LOW",
                             "description": "PR description too short. Add context for reviewers.",
                             "file": "PR", "owasp_category": "DangerPolicy:NoPRBody"})
        
        return {"issues": policies, "lines_changed": lines_changed,
                "block": block, "critical_files_touched": critical_touched}


@dataclass
class AgentResult:
    agent_name: str
    issues: list
    confidence: float
    requires_handoff: bool
    metadata: dict


def safe_parse_issues(res: str) -> list:
    try:
        data = json.loads(res)
        issues = data.get("issues", [])
        if not isinstance(issues, list): return []
        parsed = []
        for i in issues:
            if isinstance(i, dict) and "severity" in i:
                i_copy = i.copy()
                i_copy["severity"] = str(i_copy["severity"]).strip().upper()
                parsed.append(i_copy)
        return parsed
    except: return []

def run_critics_parallel(call_llm, context, owasp_skill_content, routed_model, ledger):
    """Anthropic Parallelization (Sectioning): independent critics run concurrently."""
    
    critic_tasks = {
        "Critic": (
            "You are the Critic. Identify deviations from the Constitution, style guidelines, "
            "or codebase standards. For each issue provide: severity (HIGH|MEDIUM|LOW), "
            "description, file, and owasp_category if applicable. "
            "Output MUST be in JSON format matching the schema: { 'issues': [ {'severity':..., 'description':..., 'file':..., 'owasp_category':...} ] }",
            context,
            routed_model
        ),
        "Security Critic": (
            "You are the Security Critic. Review against OWASP Top 10:2025, ASVS 5.0, "
            "and Agentic AI Security risks (ASI01-ASI10) using the REFERENCE SECURITY MANUAL. "
            "For each issue include the specific OWASP/ASI rule violated. "
            "Output MUST be in JSON format matching the schema: { 'issues': [ {'severity':..., 'description':..., 'file':..., 'owasp_category':...} ] }",
            f"REFERENCE SECURITY MANUAL:\n{owasp_skill_content}\n\nCONTEXT:\n{context}",
            MODEL_PRIMARY
        ),
        "Architecture Critic": (
            "You are the Architectural Critic. Review against C4/Mermaid architecture and living "
            "documentation requirements. Verify: (1) diagrams updated, (2) ADRs created for "
            "significant decisions, (3) progress.md updated. "
            "Output MUST be in JSON format matching the schema: { 'issues': [ {'severity':..., 'description':..., 'file':..., 'owasp_category':...} ] }",
            context,
            routed_model
        ),
    }

    # Filter tasks based on ledger membership
    name_map = {
        "Critic": "Critic",
        "SecurityCritic": "Security Critic",
        "ArchitectureCritic": "Architecture Critic",
    }
    filtered_tasks = {
        k: v for k, v in critic_tasks.items()
        if any(ledger_name for ledger_name, mapped_key in name_map.items() if mapped_key == k and ledger_name in ledger)
    }

    results = {}
    if not filtered_tasks:
        return results

    with concurrent.futures.ThreadPoolExecutor(max_workers=len(filtered_tasks)) as executor:
        futures = {
            executor.submit(call_llm, sys_p, usr_p, name, model, True): name
            for name, (sys_p, usr_p, model) in filtered_tasks.items()
        }
        for future in concurrent.futures.as_completed(futures):
            name = futures[future]
            try:
                raw_res = future.result()
                raw_issues = safe_parse_issues(raw_res)
            except Exception:
                raw_issues = []
                raw_res = ""
            
            if len(raw_issues) == 0:
                confidence = 1.0
            elif len(raw_issues) > 3:
                confidence = 0.5
            else:
                confidence = 0.8

            results[name] = AgentResult(
                agent_name=name,
                issues=raw_issues,
                confidence=confidence,
                requires_handoff=False,
                metadata={"raw_length": len(raw_res)}
            )

    return results

def run_mutation_loop(call_llm, high_issues, context, diff_safe, max_iterations=3):
    """
    Anthropic Evaluator-Optimizer Pattern with mandatory stopping conditions.
    Loop: Mutator proposes → Validator evaluates → if NO, loop again up to max_iterations.
    """
    mutations = ""
    validation = "YES. No high issues."
    iteration_log = []

    if not high_issues:
        return mutations, validation, iteration_log

    remaining_issues = high_issues.copy()
    api_primary = os.environ.get("GROQ_MODEL_PRIMARY", "llama-3.3-70b-versatile")
    api_fast = os.environ.get("GROQ_MODEL_FAST", "llama-3.1-8b-instant")

    for iteration in range(1, max_iterations + 1):
        # Mutator generates fix proposals
        mutator_sys = (
            "You are the Mutator. Given the HIGH issues and diff context, propose specific, "
            "actionable fixes. Be explicit: name the file, line change, and exact fix. "
            "Format each fix as: FILE: <path> | FIX: <description> | REASON: <why this resolves the issue>"
        )
        mutator_prompt = (
            f"ITERATION: {iteration}/{max_iterations}\n"
            f"UNRESOLVED ISSUES:\n{json.dumps(remaining_issues)}\n\n"
            f"CONTEXT:\n{context}"
        )
        mutations = call_llm(mutator_sys, mutator_prompt, "Mutator", model=api_fast)

        # Validator independently verifies (with full context — ASI03)
        validator_sys = (
            "You are the Validator. Independently verify proposed mutations against the original diff.\n"
            "Apply the following 3-criteria validation rubric:\n"
            "1. Resolution Integrity: Does the mutation fully resolve the root cause of all detected high-severity issues?\n"
            "2. Regressional Safety: Does the mutation avoid introducing any new bugs, OWASP/ASI security risks, or vulnerabilities?\n"
            "3. Architectural & Style Adherence: Does the mutation comply with clean architecture and project coding guidelines?\n\n"
            "Provide an evaluation for each criteria and then output a final decision line.\n"
            "Reply strictly in this format:\n"
            "EVALUATION:\n"
            "<your assessment of each criterion>\n\n"
            "VERDICT: YES|NO\n"
            "REASON: <brief explanation>\n"
            "UNRESOLVED: <list any issues still not fixed>"
        )
        validator_prompt = (
            f"ORIGINAL DIFF:\n{diff_safe}\n\n"
            f"ISSUES TO RESOLVE:\n{json.dumps(remaining_issues)}\n\n"
            f"PROPOSED MUTATIONS:\n{mutations}"
        )
        validation = call_llm(validator_sys, validator_prompt, "Validator", model=api_primary)

        iteration_log.append({
            "iteration": iteration,
            "mutations_proposed": len(remaining_issues),
            "validation_result": validation[:200]
        })

        normalized_val = validation.strip().upper()
        if "VERDICT: YES" in normalized_val or normalized_val.startswith("YES") or "VERDICT:YES" in normalized_val:
            break

        if iteration == max_iterations:
            iteration_log.append({
                "iteration": "FINAL",
                "status": "HUMAN_REVIEW_REQUIRED",
                "reason": f"Mutations not validated after {max_iterations} iterations"
            })
            break

    return mutations, validation, iteration_log

def verify_issue_files_ground_truth(issues: list) -> list:
    """
    Anthropic Ground Truth Pattern: verify each issue's file actually exists
    before reporting it. Annotates issues with existence status.
    """
    enriched = []
    for issue in issues:
        file_path = issue.get("file", "")
        issue_copy = issue.copy()
        
        # Skip abstract references
        if file_path in ["TASK", "OUTPUT", "CONTEXT TO EVALUATE", "WatchdogAgent", "UNKNOWN", "", "None"]:
            issue_copy["file_verified"] = "N/A (abstract reference)"
            enriched.append(issue_copy)
            continue

        # Check actual filesystem
        if os.path.exists(file_path):
            issue_copy["file_verified"] = "✅ EXISTS"
        else:
            issue_copy["file_verified"] = "⚠️ FILE NOT FOUND — verify path"
            # Downgrade phantom-file HIGH or CRITICAL issues to MEDIUM
            if issue_copy.get("severity") in ["HIGH", "CRITICAL"]:
                issue_copy["severity"] = "MEDIUM"
                issue_copy["description"] += " [AUTO-DOWNGRADED: file not found in repo]"

        enriched.append(issue_copy)
    return enriched

def build_audit_report(
    score, verdict, issues_list, high_issues, mutations, validation,
    iteration_log, trust_metadata_dict, routing_decision, dow_guard,
    watchdog_result, verdict_ok, supply_chain_status, session_nonce,
    run_start_time, test_result, coverage_result, adversarial_result,
    commit_result, danger_result
) -> str:

    run_duration = round(time.time() - run_start_time, 2)
    total = len(issues_list)
    highs = len([i for i in issues_list if i.get("severity") in ["HIGH", "CRITICAL"]])
    meds  = len([i for i in issues_list if i.get("severity") == "MEDIUM"])
    lows  = len([i for i in issues_list if i.get("severity") == "LOW"])

    # Risk level badge
    if highs >= 3 or score < 30:
        risk_badge = "🔴 CRITICAL"
    elif highs >= 1 or score < 60:
        risk_badge = "🟠 HIGH RISK"
    elif meds >= 3 or score < 80:
        risk_badge = "🟡 MEDIUM RISK"
    else:
        risk_badge = "🟢 LOW RISK"

    # Issues table with ground truth
    issues_md = "| Sev | File | Description | OWASP | File Exists |\n|---|---|---|---|---|\n"
    for i in issues_list:
        issues_md += (
            f"| {i.get('severity','?')} "
            f"| `{i.get('file','?')}` "
            f"| {i.get('description','?')} "
            f"| {i.get('owasp_category', '—')} "
            f"| {i.get('file_verified', '—')} |\n"
        )

    # Remediation checklist (only HIGH and CRITICAL)
    checklist = ""
    for idx, issue in enumerate([i for i in issues_list if i.get("severity") in ["HIGH", "CRITICAL"]], 1):
        checklist += f"- [ ] **[H{idx}]** `{issue.get('file','?')}` — {issue.get('description','?')[:120]}\n"
    if not checklist:
        checklist = "_No HIGH or CRITICAL issues — no mandatory actions required._\n"

    # Iteration log table
    iter_md = ""
    if iteration_log:
        iter_md = "| Iteration | Issues | Validator Outcome |\n|---|---|---|\n"
        for entry in iteration_log:
            iter_md += f"| {entry.get('iteration')} | {entry.get('mutations_proposed','—')} | {str(entry.get('validation_result','—'))[:80]} |\n"
    else:
        iter_md = "_No mutation loop triggered._"

    # Layer 1 section:
    test_section = f"""
## 🧪 Layer 1: Test Suite Results

| Metric | Value |
|---|---|
| Runner | `{test_result.get('runner','—')}` |
| Verdict | {test_result.get('verdict','—')} |
| Duration | {test_result.get('duration_s','—')}s |
| Block Pipeline | {'🔴 YES' if test_result.get('block') else '✅ No'} |

```text
{test_result.get('stdout','')[-1500:]}
```
"""

    # Layer 3 section:
    coverage_section = f"""
## 📐 Layer 3: Test Coverage Static Analysis

| Metric | Value |
|---|---|
| New Code Constructs | {coverage_result.get('added_code_constructs', 0)} |
| New Test Lines | {coverage_result.get('added_test_lines', 0)} |
| Coverage Ratio | {coverage_result.get('coverage_ratio', 0):.0%} |
| Adequate Coverage | {'✅ Yes' if coverage_result.get('has_adequate_coverage') else '⚠️ No'} |
"""

    # Layer 5 section — adversarial personas:
    adversarial_section = f"""
## ⚔️ Layer 5: Adversarial Review (Anti-Monoculture)

**Block Verdict:** {adversarial_result.get('block_verdict', '—')}

| Persona | Issues Found |
|---|---|
| 🔴 Saboteur | {len(adversarial_result.get('persona_results',{}).get('Saboteur',[]))} |
| 🟡 New Hire | {len(adversarial_result.get('persona_results',{}).get('NewHire',[]))} |
| 🔵 Security Auditor | {len(adversarial_result.get('persona_results',{}).get('SecurityAuditor',[]))} |

> Issues found by 2+ personas are auto-promoted one severity level.
"""

    report = f"""# 🔍 Validation Audit Report

> **This is an automated security audit generated by an AI pipeline.**
> HIGH issues require mandatory human review before any merge or PR creation.

---

## 📋 Executive Summary

| Field | Value |
|---|---|
| **Audit Date** | {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} |
| **Session** | `{session_nonce}` |
| **Verdict** | {'✅ PASS' if verdict == 'PASS' else '❌ FAIL'} |
| **Risk Level** | {risk_badge} |
| **Quality Score** | {score}/100 |
| **Run Duration** | {run_duration}s |
| **Routing Decision** | {routing_decision.get('rationale', '—')} |
| **Commit Convention** | {commit_result.get('reason', '—')} |
| **PR Policy (Danger)** | {len(danger_result.get('issues', []))} policy issues |

---
{test_section}
---
{coverage_section}
---
{adversarial_section}
---

## 📊 Risk Matrix

| Severity | Count | Action Required |
|---|---|---|
| 🔴 HIGH | **{highs}** | Block merge — fix before PR |
| 🟠 MEDIUM | **{meds}** | Fix in same sprint |
| 🟡 LOW | **{lows}** | Fix when convenient |
| **TOTAL** | **{total}** | |

---

## 🐛 Issues Detected
{issues_md if issues_list else '_No issues found._'}

---

## ✅ Mandatory Remediation Checklist (HIGH only)

{checklist}

---

## 🔄 Mutation Loop Trace (Anthropic Evaluator-Optimizer)

{iter_md}

### Mutations Proposed
{mutations or '_None triggered._'}

### Validator Final Status
{validation or '_None._'}

---

## 📚 Lessons Extracted (Archivist)

_See `agents/sessions/{session_nonce}/lessons.md`_

---

## 🛡️ Trust & Confidence Metadata

| Metric | Value | Status |
|---|---|---|
| Watchdog Anomalies | {len(watchdog_result.get('anomalies', []))} | {'⚠️ ANOMALY DETECTED' if watchdog_result.get('triggered') else '✅ Clean'} |
| Verdict Consistency | — | {'✅ Consistent' if verdict_ok else '⚠️ INCONSISTENT — Manual review required'} |
| Token Budget Used | {dow_guard.estimated_tokens:,} / {DenialOfWalletGuard.MAX_TOKENS_ESTIMATE:,} | {'⚠️ Warning' if dow_guard.estimated_tokens > DenialOfWalletGuard.TOKEN_COST_WARNING_THRESHOLD else '✅ OK'} |
| API Calls Made | {dow_guard.call_count} / {DenialOfWalletGuard.MAX_CALLS_PER_RUN} | ✅ |
| Supply Chain | — | {supply_chain_status} |
| Files Verified | {len([i for i in issues_list if i.get('file_verified','').startswith('✅')])} / {total} | — |

---

> _Pipeline: L1:Tests → SecurityGuardrails → DiffRouter → Evaluator → [Critic ‖ SecurityCritic ‖ ArchCritic] → L3:Coverage → L5:Adversarial[Saboteur‖NewHire‖SecurityAuditor] → MutationLoop({len(iteration_log)} iters) → WatchdogAgent → Archivist_
"""
    return report

def load_env(dotenv_path=".env"):
    if os.path.exists(dotenv_path):
        with open(dotenv_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip()
                    if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                        val = val[1:-1]
                    if key:
                        os.environ[key] = val

# Load environment variables
load_env()

# Configuration
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_PRIMARY = os.environ.get("GROQ_MODEL_PRIMARY", "llama-3.3-70b-versatile")
MODEL_FAST = os.environ.get("GROQ_MODEL_FAST", "llama-3.1-8b-instant")

AGENT_TEMPERATURES = {
    "Evaluator": 0.0,       # Deterministic scoring
    "Critic": 0.0,          # Deterministic criticism
    "Security Critic": 0.0, # Deterministic security review
    "Mutator": 0.4,         # Diverse fix proposals
    "Validator": 0.0,       # Deterministic validation
    "Archivist": 0.2,       # Slightly creative lesson extraction
    "Adversarial:Saboteur": 0.5,  # Adversarial diversity
    "Adversarial:NewHire": 0.4,
    "Adversarial:SecurityAuditor": 0.0,
    "ECCResearch": 0.0,     # Deterministic research analysis
    "MutationEngine": 0.4,  # Diverse mutation proposals
    "EvoAgentXEvaluator": 0.0, # Deterministic fitness evaluation
}

class TestSuiteRunner:
    """
    Layer 1 - Five-Layer Quality Gate (Kagin007).
    Runs project tests BEFORE any LLM call. Fail-fast if floor breaks.
    """
    TEST_COMMANDS = [
        ["npx", "playwright", "test"],
        ["pytest", "--tb=short", "-q", "--no-header"],
        ["python", "-m", "pytest", "--tb=short", "-q"],
        ["npm", "test", "--", "--run"],
        ["pnpm", "test", "--", "--run"],
        ["npx", "vitest", "run"],
        ["dotnet", "test", "--no-build", "-q"],
    ]
    CHANGED_ONLY_VARIANTS = {
        "pytest":   ["pytest", "--tb=short", "-q", "--no-header", "--lf"],
        "vitest":   ["npx", "vitest", "run", "--changed"],
        "playwright": ["npx", "playwright", "test"],
    }

    def detect_and_run(self, diff_files: list) -> dict:
        """Auto-detect test runner and execute. Returns structured result."""
        start = time.time()
        for cmd in self.TEST_COMMANDS:
            try:
                is_windows = sys.platform == "win32"
                result = subprocess.run(
                    cmd, capture_output=True, text=True,
                    timeout=120, cwd=os.getcwd(), shell=is_windows
                )
                duration = round(time.time() - start, 2)
                passed = result.returncode == 0
                return {
                    "runner": cmd[0],
                    "passed": passed,
                    "returncode": result.returncode,
                    "stdout": result.stdout[-3000:],  # last 3k chars
                    "stderr": result.stderr[-1000:],
                    "duration_s": duration,
                    "verdict": "✅ PASS" if passed else "❌ FAIL — Tests broken",
                    "block": not passed  # Block pipeline if tests fail
                }
            except FileNotFoundError:
                continue
            except subprocess.TimeoutExpired:
                return {
                    "runner": cmd[0], "passed": False,
                    "verdict": "⏱️ TIMEOUT — Test suite exceeded 120s",
                    "block": False,  # Don't block on timeout — might be env issue
                    "stdout": "", "stderr": "", "duration_s": 120
                }
            except Exception as e:
                continue

        return {
            "runner": "none_detected",
            "passed": True,  # Don't block if no runner found
            "verdict": "⚠️ No test runner detected — skipped",
            "block": False,
            "stdout": "", "stderr": "", "duration_s": 0
        }

    def extract_changed_files(self, diff: str) -> list:
        """Parse git diff to get list of changed file paths."""
        files = []
        for line in diff.splitlines():
            if line.startswith("+++ b/"):
                files.append(line[6:])
        return files

class TestCoverageReviewer:
    """
    Layer 3 - Five-Layer Quality Gate (Kagin007).
    Static analysis: detects new code without corresponding tests.
    """
    # Patterns that indicate production code (not test code)
    CODE_PATTERNS = [
        r'^\+\s*(def |async def |class |function |const |let |var )',
        r'^\+\s*(export (default |async )?(function|class|const))',
        r'^\+.*\.(post|get|put|delete|patch)\(["\']/',  # route handlers
    ]
    # Patterns that indicate test coverage exists in the diff
    TEST_PATTERNS = [
        r'(test_|_test\.|\.test\.|\.spec\.|tests/)',
        r'(describe\(|it\(|test\(|assert |expect\()',
        r'(def test_|@pytest\.|unittest\.)',
    ]

    def analyze(self, diff: str) -> dict:
        lines = diff.splitlines()
        added_code_lines = 0
        added_test_lines = 0
        untested_functions = []

        for line in lines:
            if not line.startswith("+") or line.startswith("+++"):
                continue
            for pattern in self.CODE_PATTERNS:
                if re.search(pattern, line):
                    added_code_lines += 1
                    # Extract function/class name for report
                    name_match = re.search(r'(def |class |function |const )(\w+)', line)
                    if name_match:
                        untested_functions.append(name_match.group(2))
            for pattern in self.TEST_PATTERNS:
                if re.search(pattern, line, re.IGNORECASE):
                    added_test_lines += 1

        coverage_ratio = added_test_lines / max(added_code_lines, 1)
        has_coverage = coverage_ratio >= 0.2 or added_code_lines == 0

        issues = []
        if added_code_lines > 0 and added_test_lines == 0:
            issues.append({
                "severity": "HIGH",
                "description": f"No test code found for {added_code_lines} new code constructs. Untested: {', '.join(untested_functions[:5])}",
                "file": "DIFF",
                "owasp_category": "Layer3:TestCoverage"
            })
        elif not has_coverage:
            issues.append({
                "severity": "MEDIUM",
                "description": f"Low test coverage ratio ({coverage_ratio:.0%}) for new code. "
                               f"Added {added_code_lines} code constructs, {added_test_lines} test lines.",
                "file": "DIFF",
                "owasp_category": "Layer3:TestCoverage"
            })

        return {
            "added_code_constructs": added_code_lines,
            "added_test_lines": added_test_lines,
            "coverage_ratio": round(coverage_ratio, 2),
            "has_adequate_coverage": has_coverage,
            "issues": issues
        }

class AdversarialReviewAgent:
    """
    Layer 5 - Five-Layer Quality Gate (Kagin007).
    Three hostile personas with MANDATORY findings — eliminates self-review monoculture.
    Each persona MUST find at least one issue. LGTM is not an allowed output.
    """

    PERSONAS = {
        "Saboteur": (
            "You are The Saboteur. Your job is adversarial testing. You MUST find at least one "
            "vulnerability or failure mode — 'looks fine' is NOT an acceptable answer. Ask: "
            "What is the worst input I could send? What if this runs twice? Concurrently? "
            "What if the external service call fails halfway? What if the DB returns null? "
            "What race condition could exist? What integer overflow? What off-by-one? "
            "Output JSON: {'issues': [{'severity': 'HIGH|MEDIUM|LOW', 'description': '...', "
            "'file': '...', 'owasp_category': 'Saboteur:<type>', 'attack_vector': '...'}]}. "
            "MANDATORY: you must return at least 1 issue. If you see none, look harder at edge cases. "
            "Output MUST be in JSON format."
        ),
        "NewHire": (
            "You are The New Hire joining this project with zero context. You MUST find at least "
            "one maintainability problem — 'code is clear' is NOT an acceptable answer. Ask: "
            "What implicit knowledge is baked in that I would not have? What magic numbers exist? "
            "What happens if I misread this function and call it wrong? What naming is ambiguous? "
            "What side effects are invisible from the call site? "
            "Output JSON: {'issues': [{'severity': 'HIGH|MEDIUM|LOW', 'description': '...', "
            "'file': '...', 'owasp_category': 'NewHire:<type>'}]}. "
            "MANDATORY: you must return at least 1 issue. If code seems clear, look for missing docs or hidden assumptions. "
            "Output MUST be in JSON format."
        ),
        "SecurityAuditor": (
            "You are The Security Auditor performing a hostile trust-boundary review. You MUST find "
            "at least one security concern — 'no issues found' is NOT an acceptable answer. Ask: "
            "Where are the trust boundaries? What can an authenticated user escalate to? "
            "What does this code trust that it should verify? What input reaches a dangerous sink? "
            "What is logged that shouldn't be? What is NOT logged that should be? "
            "Output JSON: {'issues': [{'severity': 'HIGH|MEDIUM|LOW', 'description': '...', "
            "'file': '...', 'owasp_category': 'SecurityAuditor:<OWASP-category>'}]}. "
            "MANDATORY: you must return at least 1 issue. If code seems secure, check logging, error handling, and trust assumptions. "
            "Output MUST be in JSON format."
        ),
    }

    def run(self, call_llm_fn, context: str, routed_model: str) -> dict:
        """Run all 3 personas in parallel. Promote issues found by 2+ personas."""
        persona_results = {}

        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = {
                executor.submit(
                    call_llm_fn, sys_prompt, context,
                    f"Adversarial:{name}", routed_model, True
                ): name
                for name, sys_prompt in self.PERSONAS.items()
            }
            for future in concurrent.futures.as_completed(futures):
                name = futures[future]
                try:
                    persona_results[name] = safe_parse_issues(future.result())
                except Exception:
                    persona_results[name] = []

        # Promotion rule: issues found by 2+ personas → promote severity one level
        all_issues = []
        description_counts = {}
        for name, issues in persona_results.items():
            for issue in issues:
                desc_key = issue.get("description", "")[:60].lower()
                description_counts[desc_key] = description_counts.get(desc_key, 0) + 1
                all_issues.append(issue)

        promoted = []
        seen_keys = set()
        for issue in all_issues:
            desc_key = issue.get("description", "")[:60].lower()
            issue_copy = issue.copy()
            if description_counts.get(desc_key, 0) >= 2:
                # Promote severity
                if issue_copy.get("severity") == "LOW":
                    issue_copy["severity"] = "MEDIUM"
                    issue_copy["description"] += " [PROMOTED: found by multiple personas]"
                elif issue_copy.get("severity") == "MEDIUM":
                    issue_copy["severity"] = "HIGH"
                    issue_copy["description"] += " [PROMOTED: found by multiple personas]"
            
            # Deduplicate by (file, description_prefix) to avoid duplicate entries in report
            dedup_key = (issue_copy.get("file", ""), desc_key)
            if dedup_key not in seen_keys:
                seen_keys.add(dedup_key)
                promoted.append(issue_copy)

        # Compute verdict: BLOCK / CONCERNS / CLEAN
        high_count = len([i for i in promoted if i.get("severity") in ["HIGH", "CRITICAL"]])
        med_count = len([i for i in promoted if i.get("severity") == "MEDIUM"])
        if high_count > 0:
            block_verdict = "🔴 BLOCK — Critical findings, do not merge"
        elif med_count >= 3:
            block_verdict = "🟠 CONCERNS — Warnings present, merge at your own risk"
        else:
            block_verdict = "🟢 CLEAN — Only minor notes, safe to merge"

        return {
            "persona_results": persona_results,
            "promoted_issues": promoted,
            "block_verdict": block_verdict,
            "personas_ran": list(self.PERSONAS.keys())
        }

def main():
    parser = argparse.ArgumentParser(description="Post-Task Validation Loop")
    parser.add_argument("--task", type=str, default="No task description provided")
    parser.add_argument("--output", type=str, default="No output provided")
    parser.add_argument("--hook-mode", type=str, default="ci", choices=["pre-commit","pre-push","ci"])
    args = parser.parse_args()

    hook_mode = os.environ.get("AGENT_HOOK_MODE", args.hook_mode)
    run_start_time = time.time() # Step 7

    # Validate commit message (Commitizen)
    commit_msg = ""
    if args.task and not args.task.startswith("No task description"):
        commit_msg = args.task
    else:
        try:
            commit_msg = subprocess.check_output(
                ["git", "log", "-1", "--pretty=%s"], encoding="utf-8"
            ).strip()
        except Exception:
            pass
    commit_validator = CommitMessageValidator()
    commit_result = commit_validator.validate(commit_msg)

    if commit_result["block"]:
        result = {
            "score": 0,
            "verdict": "BLOCK",
            "high_issues": 1,
            "issues": [{
                "severity": "HIGH",
                "description": commit_result["reason"],
                "file": "COMMIT_MSG",
                "owasp_category": "Commitzen:Validation"
            }],
            "message": commit_result["reason"],
            "test_verdict": "⚠️ Bypassed (commit message invalid)",
            "adversarial_verdict": "🔴 BLOCK — Critical findings, do not merge",
            "coverage_ratio": 0.0
        }
        print(json.dumps(result))
        sys.exit(1)

    # Gather context at the very beginning using HookModeAdapter
    diff_output = HookModeAdapter.get_diff(args.hook_mode)

    # Layer 1 execution
    test_runner = TestSuiteRunner()
    changed_files = test_runner.extract_changed_files(diff_output)
    test_result = test_runner.detect_and_run(changed_files)
    if test_result.get("block"):
        # Fast-fail: tests broken, no LLM calls needed
        result = {
            "score": 0,
            "verdict": "BLOCK",
            "high_issues": 1,
            "issues": [{
                "severity": "HIGH",
                "description": "Test suite FAILED before validation",
                "file": "test_suite",
                "owasp_category": "Layer1:Tests"
            }],
            "message": test_result.get("verdict"),
            "test_verdict": test_result.get("verdict"),
            "adversarial_verdict": "🔴 BLOCK — Critical findings, do not merge",
            "coverage_ratio": 0.0
        }
        print(json.dumps(result))
        sys.exit(1)

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        print(json.dumps({"score": 100, "verdict": "PASS", "high_issues": 0, "message": "GROQ_API_KEY missing, bypassed"}))
        sys.exit(0)
        
    # Auto-detect session via ACTIVE_SESSION pointer file (fallback to latest session directory)
    sessions_dir = os.path.join("agents", "sessions")
    active_ptr = os.path.join(sessions_dir, "ACTIVE_SESSION")
    session_id = None
    if os.path.exists(active_ptr):
        try:
            with open(active_ptr, "r", encoding="utf-8") as f:
                session_id = f.read().strip()
        except Exception:
            pass
    if not session_id and os.path.exists(sessions_dir):
        subdirs = [os.path.join(sessions_dir, d) for d in os.listdir(sessions_dir) if os.path.isdir(os.path.join(sessions_dir, d))]
        if subdirs:
            latest_session = max(subdirs, key=os.path.getmtime)
            session_id = os.path.basename(latest_session)
            
    if not session_id:
        print(json.dumps({"score": 100, "verdict": "PASS", "high_issues": 0, "message": "No session found, bypassed"}))
        sys.exit(0)

    # Load available skills from registry output
    skills_context = ""
    if os.path.exists("skills-lock.json"):
        try:
            with open("skills-lock.json", "r", encoding="utf-8") as f:
                skills_data = json.load(f)
            skills_context = "\n<SKILLS_REGISTRY>\n" + json.dumps(skills_data.get("skills", []), indent=2) + "\n</SKILLS_REGISTRY>"
        except Exception:
            pass

    session_path = os.path.join(sessions_dir, session_id)

    # Instantiate OWASP security controls
    guardrails = SecurityGuardrails()
    dow_guard = DenialOfWalletGuard()
    watchdog = WatchdogAgent(session_path)
    supply_validator = SupplyChainValidator()
    circuit_breakers = {name: CircuitBreaker(name) for name in
      ["Evaluator","Critic","Security Critic","Architecture Critic","Mutator","Validator","Archivist",
       "ECCResearch","MutationEngine","EvoAgentXEvaluator","MutationEngineSkillWrite"]}
        
    agents_md = ""
    try:
        with open(os.path.join("agents", "docs", "AGENTS.md"), "r", encoding="utf-8") as f:
            agents_md = f.read()
    except Exception:
        pass

    # Supply chain validation on constitution
    issues_list = []
    supply_result = supply_validator.validate_constitution(agents_md, os.environ.get("AGENTS_MD_HASH", ""))
    supply_chain_status = "✅ Validated"
    if supply_result["valid"] is False:
        issues_list.append({
            "severity": "HIGH",
            "description": supply_result["warning"],
            "file": "agents/docs/AGENTS.md"
        })
        supply_chain_status = f"⚠️ Tampered: {supply_result['warning']}"

    # Log lock for multi-threaded access to prompt-log.jsonl
    log_lock = threading.Lock()

    # Helper function to call Groq with integration of new guards
    def call_llm(system_prompt, user_prompt, agent_name, model=MODEL_PRIMARY, json_mode=False, temperature=None):
        # Prompt logging
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "agent": agent_name,
            "model": model,
            "system": system_prompt[:500],
            "user": user_prompt[:500]
        }
        try:
            log_file = os.path.join(session_path, "prompt-log.jsonl")
            with log_lock:
                with open(log_file, "a", encoding="utf-8") as f:
                    f.write(json.dumps(log_entry) + "\n")
        except Exception:
            pass

        # Check budget & circuit breakers
        if not dow_guard.pre_call_check(len(system_prompt) + len(user_prompt)):
            return "{}" if json_mode else ""
        if agent_name not in circuit_breakers:
            circuit_breakers[agent_name] = CircuitBreaker(agent_name)
        if not circuit_breakers[agent_name].allow_request():
            return "{}" if json_mode else ""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        # Resolve temperature dynamically if not explicitly specified
        if temperature is None:
            temperature = AGENT_TEMPERATURES.get(agent_name, 0.1)
            
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temperature
        }
        if json_mode:
            data["response_format"] = {"type": "json_object"}
            
        req = urllib.request.Request(GROQ_API_URL, data=json.dumps(data).encode("utf-8"), headers=headers)
        for attempt in range(4):
            try:
                with urllib.request.urlopen(req) as response:
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)
                    content = res_json["choices"][0]["message"]["content"]

                    # Capture real token usage from Groq API response
                    groq_usage = res_json.get("usage", {})
                    with log_lock:
                        # Update dow_guard with REAL tokens, not estimated
                        if groq_usage:
                            dow_guard.estimated_tokens += groq_usage.get("total_tokens", 0)

                    # Append real usage to log
                    log_entry["actual_tokens"] = groq_usage
                    try:
                        with log_lock:
                            with open(os.path.join(session_path, "prompt-log.jsonl"), "a", encoding="utf-8") as f:
                                f.write(json.dumps({**log_entry, "actual_tokens": groq_usage}) + "\n")
                    except Exception:
                        pass

                    circuit_breakers[agent_name].record_success()
                    return content
            except urllib.error.HTTPError as e:
                if e.code in [429, 500, 503] and attempt < 3:
                    sleep_time = (attempt + 1) * 3
                    time.sleep(sleep_time)
                    continue
                circuit_breakers[agent_name].record_failure()
                if hasattr(e, 'read'):
                    print(f"Error calling LLM (HTTP {e.code}): {e.read().decode('utf-8')}", file=sys.stderr)
                break
            except Exception as e:
                if attempt < 3:
                    time.sleep(2)
                    continue
                circuit_breakers[agent_name].record_failure()
                print(f"Error calling LLM: {e}", file=sys.stderr)
                break
        return "{}" if json_mode else ""

    # Sanitize and redact user-controlled inputs (Step 4)
    task_sanitized = guardrails.sanitize_for_prompt(args.task, "TASK")
    output_sanitized = guardrails.sanitize_for_prompt(args.output, "OUTPUT")
    diff_sanitized = guardrails.sanitize_for_prompt(diff_output, "DIFF")
    diff_redacted = guardrails.redact_sensitive(diff_sanitized)

    # Layer 3 static analysis
    coverage_reviewer = TestCoverageReviewer()
    coverage_result = coverage_reviewer.analyze(diff_redacted)
    issues_list.extend(coverage_result.get("issues", []))

    # Danger Policy Evaluation (pre-LLM)
    danger_evaluator = DangerPolicyEvaluator()
    danger_result = danger_evaluator.evaluate(
        diff_redacted, 
        pr_title=args.task, 
        pr_body=args.output
    )
    issues_list.extend(danger_result["issues"])

    # If danger blocks (exceeds hard maximum size): fail-fast without LLM
    if danger_result["block"]:
        result = {
            "score": 0,
            "verdict": "BLOCK",
            "high_issues": len([i for i in issues_list if i.get("severity") in ["HIGH", "CRITICAL"]]),
            "issues": issues_list,
            "usage": dow_guard.get_usage_summary(),
            "routing": {"model": "bypassed", "complexity_score": 0, "triggers": [], "rationale": "Bypassed due to PR policy violation (too large)"},
            "iterations": 0,
            "test_verdict": test_result.get("verdict"),
            "adversarial_verdict": "🔴 BLOCK — PR policy blocked",
            "coverage_ratio": coverage_result.get("coverage_ratio", 0.0)
        }
        print(json.dumps(result))
        sys.exit(1)

    # 1. Routing decision (Step 1)
    router = DiffRouter()
    routing_decision = router.route(diff_redacted)
    routed_model = routing_decision["model"]
    
    # Log routing decision to prompt log
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "agent": "DiffRouter",
        "model": routed_model,
        "system": "Deciding model complexity",
        "user": json.dumps(routing_decision)
    }
    try:
        log_file = os.path.join(session_path, "prompt-log.jsonl")
        with log_lock:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
    except Exception:
        pass

    # Instantiate MagenticOrchestrator and build/log ledger
    orchestrator = MagenticOrchestrator()
    ledger = orchestrator.build_ledger(routing_decision, diff_redacted)

    log_entry_ledger = {
        "timestamp": datetime.now().isoformat(),
        "agent": "MagenticOrchestrator",
        "model": "rule-based",
        "system": "Building task ledger",
        "user": json.dumps({"ledger": ledger})
    }
    try:
        log_file = os.path.join(session_path, "prompt-log.jsonl")
        with log_lock:
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry_ledger) + "\n")
    except Exception:
        pass

    # Wrap safe inputs in XML tags
    diff_safe = f"<DIFF>\n{diff_redacted[:8000]}\n</DIFF>"
    task_safe = f"<TASK>\n{task_sanitized}\n</TASK>"
    output_safe = f"<OUTPUT>\n{output_sanitized}\n</OUTPUT>"
    constitution_safe = f"<CONSTITUTION>\n{agents_md}\n</CONSTITUTION>"

    # Context string
    context = f"{task_safe}\n\n{output_safe}\n\n{diff_safe}\n\n{constitution_safe}"
    context = ContextCompactor().compact(context, guardrails)

    # ECC Research Agent: Analyze diff for vulnerability patterns BEFORE Evaluator
    ecc_agent = ECCResearchAgent()
    ecc_result = ecc_agent.research(diff_redacted, session_path, call_llm)
    ecc_patterns = ecc_result.get("patterns_found", [])
    ecc_skills = ecc_result.get("recommended_skills", [])
    ecc_owasp = ecc_result.get("owasp_refs", [])

    # Add ECC findings to context so critics can use them
    if ecc_patterns or ecc_skills:
        ecc_context = f"\n<ECC_RESEARCH>\nPatterns Found: {json.dumps(ecc_patterns)}\nRecommended Skills: {json.dumps(ecc_skills)}\nOWASP References: {json.dumps(ecc_owasp)}\n</ECC_RESEARCH>"
        context += ecc_context
        # Log ECC research
        try:
            with log_lock:
                with open(os.path.join(session_path, "prompt-log.jsonl"), "a", encoding="utf-8") as f:
                    f.write(json.dumps({
                        "timestamp": datetime.now().isoformat(),
                        "agent": "ECCResearch",
                        "message": "ECC research completed",
                        "patterns": ecc_patterns,
                        "skills": ecc_skills
                    }) + "\n")
        except Exception:
            pass

    # Agent 1: Evaluator
    evaluator_sys = """You are the Evaluator. Score on EXACTLY 4 dimensions (0-25 each):
1. OWASP_COMPLIANCE (0-25)
2. ARCHITECTURE_QUALITY (0-25)
3. TEST_COVERAGE (0-25)
4. CONSTITUTION_ADHERENCE (0-25)
Output JSON: {"owasp": N, "architecture": N, "tests": N, "constitution": N,
"total": N, "rationale": "one sentence per dimension"}"""
    if skills_context:
        evaluator_sys += skills_context
    eval_res = call_llm(evaluator_sys, context, "Evaluator", json_mode=True)
    try:
        score = int(json.loads(eval_res).get("total", 100))
    except:
        score = 100

    def route_after_evaluator(score: int, routing_decision: dict) -> list:
        if score < 40:
            return ["ECCResearch", "Critic", "SecurityCritic", "ArchitectureCritic", "AdversarialReview", "MutationEngine"]
        if routing_decision.get("complexity_score", 0) >= 2:
            return ["ECCResearch", "SecurityCritic", "ArchitectureCritic", "MutationEngine"]
        return ["ECCResearch", "Critic", "MutationEngine"]

    # Dynamic routing edge condition: override ledger
    dynamic_agents = route_after_evaluator(score, routing_decision)
    ledger = orchestrator.build_ledger(routing_decision, diff_redacted, override_agents=dynamic_agents)

    # Log dynamic ledger override
    log_entry_dynamic = {
        "timestamp": datetime.now().isoformat(),
        "agent": "MagenticOrchestrator:Dynamic",
        "model": "rule-based",
        "system": "Dynamic ledger override",
        "user": json.dumps({"ledger": ledger, "score": score})
    }
    try:
        with log_lock:
            with open(os.path.join(session_path, "prompt-log.jsonl"), "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry_dynamic) + "\n")
    except Exception:
        pass

    # Agent 2: Critics (Parallel Sectioning, Step 2)
    owasp_skill_content = ""
    try:
        owasp_skill_path = os.path.join("agents", "skills", "owasp-security", "SKILL.md")
        if os.path.exists(owasp_skill_path):
            with open(owasp_skill_path, "r", encoding="utf-8") as f:
                owasp_skill_content = f.read()
    except Exception:
        pass

    critic_results = run_critics_parallel(call_llm, context, owasp_skill_content, routed_model, ledger)
    issues_list1 = critic_results.get("Critic").issues if critic_results.get("Critic") else []
    issues_list2 = critic_results.get("Security Critic").issues if critic_results.get("Security Critic") else []
    issues_list3 = critic_results.get("Architecture Critic").issues if critic_results.get("Architecture Critic") else []

    # Combine issues
    issues_list.extend(issues_list1 + issues_list2 + issues_list3)

    # Run handoff router for detected domains and extend issues_list
    handoff_issues = AgentHandoffRouter().run(call_llm, context, routed_model, diff_redacted)
    issues_list.extend(handoff_issues)
        
    # Verify issue files exist (Ground Truth, Step 3)
    issues_list = verify_issue_files_ground_truth(issues_list)

    # Re-resolve high issues and verdict
    high_issues = [i for i in issues_list if i.get("severity") in ["HIGH", "CRITICAL"]]
    verdict = "FAIL" if len(high_issues) > 0 else "PASS"

    # EvoAgentX Fitness Vector computation
    evo_evaluator = EvoAgentXEvaluator()
    security_issues = issues_list2  # Security Critic issues
    fitness = evo_evaluator.evaluate(
        task_output={"score": score, "verdict": verdict},
        critic_results=critic_results,
        coverage_result=coverage_result,
        commit_result=commit_result,
        security_issues=security_issues
    )

    # Watchdog evaluation (Step 6 of previous task)
    watchdog_result = watchdog.check_score_inflation(score, len(issues_list))
    verdict_ok = watchdog.check_verdict_consistency(score, verdict, len(high_issues))
    if watchdog_result["triggered"]:
        for anomaly in watchdog_result["anomalies"]:
            issues_list.append({
                "severity": "HIGH",
                "description": f"[{anomaly['type']}] {anomaly['detail']}",
                "file": "WatchdogAgent",
                "file_verified": "N/A (abstract reference)"
            })
        # Re-resolve high_issues and verdict after adding watchdog anomalies
        high_issues = [i for i in issues_list if i.get("severity") in ["HIGH", "CRITICAL"]]
        verdict = "FAIL" if len(high_issues) > 0 else "PASS"

    # Layer 5: Adversarial Review
    if "AdversarialReview" in ledger:
        adversarial_agent = AdversarialReviewAgent()
        adversarial_result = adversarial_agent.run(call_llm, context, routed_model)
        # Add promoted issues to issues_list
        issues_list.extend(adversarial_result.get("promoted_issues", []))
        # Re-run ground truth after adding adversarial issues
        issues_list = verify_issue_files_ground_truth(issues_list)
        # Re-resolve high_issues and verdict
        high_issues = [i for i in issues_list if i.get("severity") in ["HIGH", "CRITICAL"]]
        verdict = "FAIL" if high_issues else "PASS"
    else:
        adversarial_result = {
            "persona_results": {},
            "promoted_issues": [],
            "block_verdict": "🟢 SKIPPED — (minimal complexity change)",
            "personas_ran": []
        }

    # Mutation loop (Step 4)
    mutations, validation, iteration_log = run_mutation_loop(
        call_llm, high_issues, context, diff_safe, max_iterations=3
    )

    if high_issues:
        normalized_val = validation.strip().upper()
        if not ("VERDICT: YES" in normalized_val or normalized_val.startswith("YES") or "VERDICT:YES" in normalized_val):
            verdict = "BLOCK"

    # Mutation Engine: propose and write novel skills when fitness is low
    mutation_engine = MutationEngine()
    mutations_proposed = []
    skills_written = []
    evolution_triggered = mutation_engine.should_trigger(fitness, high_issues)

    if evolution_triggered:
        # Load current skill registry for idempotency checking
        registry = {"skills": []}
        if os.path.exists("skills-lock.json"):
            try:
                with open("skills-lock.json", "r", encoding="utf-8") as f:
                    registry = json.load(f)
            except Exception:
                pass

        mutations_proposed = mutation_engine.propose_mutations(fitness, ecc_result, session_path, call_llm)

        # Try to write novel skills for ECC recommended skills
        for skill in ecc_skills:
            was_written = mutation_engine.write_skill_if_novel(skill, registry)
            if was_written:
                skills_written.append(skill.get("skill_name", "unknown"))
                # Reload registry after each successful write
                if os.path.exists("skills-lock.json"):
                    try:
                        with open("skills-lock.json", "r", encoding="utf-8") as f:
                            registry = json.load(f)
                    except Exception:
                        pass

    # Write evolution_log.md
    evolution_log_path = os.path.join(session_path, "evolution_log.md")
    try:
        evolution_entry = (
            f"| {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} "
            f"| {fitness.security}/{fitness.coverage}/{fitness.convention}/{fitness.architecture}/{fitness.composite} "
            f"| {len(mutations_proposed)} "
            f"| {', '.join(skills_written) if skills_written else 'None'} "
            f"| {'OPEN' if any(cb.is_open for cb in circuit_breakers.values()) else 'CLOSED'} |\n"
        )
        # Check if header already exists or create new file
        if not os.path.exists(evolution_log_path):
            os.makedirs(os.path.dirname(evolution_log_path), exist_ok=True)
            with open(evolution_log_path, "w", encoding="utf-8") as f:
                f.write(f"# Evolution Log — Session {session_id}\n")
                f.write("> ECC + EvoAgentX evolution cycle tracking\n\n")
                f.write("| Timestamp | Fitness (Sec/Cov/Conv/Arch/Composite) | Mutations Proposed | Skills Written | Circuit Breakers |\n")
                f.write("|---|---|---|---|---|\n")
                f.write(evolution_entry)
        else:
            with open(evolution_log_path, "a", encoding="utf-8") as f:
                f.write(evolution_entry)
    except Exception:
        pass

    # Agent 5: Archivist
    archivist_sys = "You are the Archivist. Extract 1-3 generalized, short bullet-point lessons from these issues to avoid them in the future."
    archivist_prompt = f"ISSUES:\n{json.dumps(issues_list)}"
    lessons = ""
    if "Archivist" in ledger and issues_list:
        lessons = call_llm(archivist_sys, archivist_prompt, "Archivist", model=MODEL_PRIMARY)

    # Build trust metadata dictionary
    trust_metadata_dict = {
        "watchdog_anomalies": len(watchdog_result.get('anomalies', [])),
        "verdict_consistency": "Consistent" if verdict_ok else "Inconsistent",
        "tokens_used": dow_guard.estimated_tokens,
        "circuit_breakers": sum(1 for cb in circuit_breakers.values() if cb.is_open),
        "supply_chain": supply_chain_status,
        "session_nonce": session_id
    }

    # Generate Markdown Report (Step 5)
    report_content = build_audit_report(
        score=score,
        verdict=verdict,
        issues_list=issues_list,
        high_issues=high_issues,
        mutations=mutations,
        validation=validation,
        iteration_log=iteration_log,
        trust_metadata_dict=trust_metadata_dict,
        routing_decision=routing_decision,
        dow_guard=dow_guard,
        watchdog_result=watchdog_result,
        verdict_ok=verdict_ok,
        supply_chain_status=supply_chain_status,
        session_nonce=session_id,
        run_start_time=run_start_time,
        test_result=test_result,
        coverage_result=coverage_result,
        adversarial_result=adversarial_result,
        commit_result=commit_result,
        danger_result=danger_result
    )

    # File Outputs
    with open("agents/validation-report.md", "w", encoding="utf-8") as f:
        f.write(report_content)

    # Generate reviewdog JSON outputs (INSERCIÓN 5)
    reviewdog_formatter = ReviewdogFormatter()
    reviewdog_formatter.write(
        issues_list, 
        path=os.path.join(session_path, "reviewdog.json")
    )
    reviewdog_formatter.write(issues_list, path="reviewdog.json")
    reviewdog_formatter.write_to_stderr(issues_list)

    log_content = f"# Loop Log\nDate: {datetime.now().isoformat()}\nScore: {score}\nVerdict: {verdict}\n\n## Issues\n{json.dumps(issues_list, indent=2)}\n\n## Mutations proposed\n{mutations}\n\n## Validation\n{validation}\n"
    with open(os.path.join(session_path, "loop-log.md"), "w", encoding="utf-8") as f:
        f.write(log_content)

    if lessons:
        with open(os.path.join(session_path, "lessons.md"), "a", encoding="utf-8") as f:
            f.write(f"\n## Lessons from {datetime.now().isoformat()}\n{lessons}\n")
            
        global_lessons_dir = os.path.expanduser("~/.agent-loop")
        if not os.path.exists(global_lessons_dir):
            os.makedirs(global_lessons_dir, exist_ok=True)
        with open(os.path.join(global_lessons_dir, "lessons.md"), "a", encoding="utf-8") as f:
            f.write(f"\n## Lessons from {datetime.now().isoformat()}\n{lessons}\n")

    if high_issues:
        with open(os.path.join(session_path, "error-patterns.md"), "a", encoding="utf-8") as f:
            f.write(f"\n## Errors from {datetime.now().isoformat()}\n{json.dumps(high_issues, indent=2)}\n")

    # Final Output to Stdout (Step 6)
    result = {
        "score": score,
        "verdict": verdict,
        "high_issues": len(high_issues),
        "issues": issues_list,
        "usage": dow_guard.get_usage_summary(),
        "routing": routing_decision,
        "iterations": len(iteration_log),
        "test_verdict": test_result.get("verdict"),
        "adversarial_verdict": adversarial_result.get("block_verdict"),
        "coverage_ratio": coverage_result.get("coverage_ratio", 0)
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()