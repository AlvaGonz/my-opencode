---
name: security
description: AWS cloud security including IAM policies, compliance scanning, secrets rotation, cloud security posture, and security audits.
trigger: "when the user asks about AWS IAM policies, AWS compliance scanning, AWS secrets rotation, cloud security posture, or AWS security audit — NOT for general web security, OWASP, or application security"
scope: aws-cloud-only
version: "1.0"
conflicts_with: ["owasp-security", "security-audit"]
sources:
  - https://github.com/prowler-cloud/prowler
  - https://github.com/iann0036/iamlive
  - https://github.com/cloud-custodian/cloud-custodian
  - https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas
---

# AWS Cloud Security Skill

## Purpose

This skill provides AWS cloud security guidance covering **IAM least-privilege analysis**, **compliance scanning** with Prowler, **policy-as-code enforcement** with Cloud Custodian, and **secrets rotation** with AWS Secrets Manager Lambda functions. It is designed for DevOps engineers, cloud security architects, and platform teams operating AWS workloads.

## Scope Boundaries

| Included (AWS Cloud Security) | Excluded (use other skills) |
|---|---|
| AWS IAM policy analysis and least-privilege patterns | OWASP Top 10 web application security |
| Prowler AWS compliance scanning (CIS, SOC2, PCI-DSS) | General penetration testing |
| Cloud Custodian policy enforcement on AWS resources | SAST/DAST application scanning |
| AWS Secrets Manager rotation Lambda functions | Container image vulnerability scanning |
| S3 bucket policy and access control audits | Network firewall rule analysis |
| EC2/EBS security configuration reviews | Kubernetes RBAC or pod security policies |

**When NOT to use this skill:**
- If the question mentions OWASP, XSS, SQL injection, CSRF → load `owasp-security`
- If the question is about generic web application security or penetration testing → load `security-audit`
- If the question involves non-AWS cloud providers exclusively (GCP only, Azure only) → this skill still applies if AWS is involved

## How to Use

1. **Determine the sub-skill needed:**
   - `aws-security-audit/` → Use Prowler for compliance scanning
   - `aws-iam-best-practices/` → Use iamlive + Cloudsplaining for IAM analysis
   - `aws-compliance-checker/` → Use Cloud Custodian for policy-as-code enforcement
   - `aws-secrets-rotation/` → Use Secrets Manager rotation Lambda templates

2. **Reference the command docs** in each subdirectory's `references/` folder for exact CLI flags and policy formats.

3. **Always run with dry-run / read-only first** before applying any destructive actions.

## Reference File Descriptions

| File | Purpose |
|---|---|
| `aws-security-audit/references/prowler-commands.md` | Prowler CLI install, top 20 commands, compliance framework flags, output formats |
| `aws-iam-best-practices/references/least-privilege-patterns.md` | iamlive usage, Cloudsplaining workflow, over-permissioned action table, minimal policy patterns |
| `aws-compliance-checker/references/custodian-rules.md` | Cloud Custodian YAML policy format, 10 production-ready policies, dryrun vs enforce |
| `aws-secrets-rotation/scripts/rotation-lambda-template.py` | Complete Python Lambda for database credential rotation with all 4 steps |

## Gotchas

- **Prowler** requires read-only IAM credentials (use `SecurityAudit` managed policy or equivalent). Running without `--output-formats` will only print to stdout.
- **iamlive** CSM mode only captures `Action`, not `Resource`. Use proxy mode for full `Resource` constraints in generated policies.
- **Cloud Custodian** policies in `dryrun` mode do not execute actions. Always run `--dryrun` first in production accounts.
- **Secrets Manager rotation Lambdas** must have the `AWSPENDING` stage set before rotation begins. The `create_secret` step handles this automatically.
- All tools in this skill operate on **live AWS APIs**. Ensure you have proper AWS credentials configured before running any commands.

## Sources

- Prowler: [https://github.com/prowler-cloud/prowler](https://github.com/prowler-cloud/prowler)
- iamlive: [https://github.com/iann0036/iamlive](https://github.com/iann0036/iamlive)
- Cloud Custodian: [https://github.com/cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian)
- AWS Secrets Manager Rotation Lambdas: [https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas](https://github.com/aws-samples/aws-secrets-manager-rotation-lambdas)
- Cloudsplaining: [https://github.com/salesforce/cloudsplaining](https://github.com/salesforce/cloudsplaining)
