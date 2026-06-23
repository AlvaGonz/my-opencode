# Prowler CLI — AWS Security Audit Commands

> Source: [https://github.com/prowler-cloud/prowler](https://github.com/prowler-cloud/prowler) — version 5.31.0

## Installation

### CLI via pip (Python >=3.10, <3.13)

```bash
pip install prowler
prowler -v
```

### Docker

```bash
docker run -it --rm toniblyx/prowler:latest aws
```

### From source (with uv)

```bash
git clone https://github.com/prowler-cloud/prowler
cd prowler
uv sync
source .venv/bin/activate
python prowler-cli.py -v
```

## Authentication

Prowler uses standard AWS credential chain:

```bash
aws configure --profile my-audit-profile
prowler aws --profile my-audit-profile
```

Requires at minimum the `SecurityAudit` managed IAM policy or equivalent read-only access.

## Top 20 Prowler Commands

### 1–5: Full Audits

```bash
# Full AWS account audit (all checks, all services)
prowler aws

# Full audit with HTML report
prowler aws --output-formats html --output-directory ./reports

# Full audit with JSON + CSV + HTML
prowler aws --output-formats json csv html --output-directory ./reports

# Full audit, only critical and high severity
prowler aws --severity critical high

# Full audit with specific AWS profile
prowler aws --profile production-audit
```

### 6–10: Compliance-Specific Scans

```bash
# CIS AWS Foundations Benchmark v1.5
prowler aws --compliance cis_1.5_aws

# CIS AWS Foundations Benchmark v2.0
prowler aws --compliance cis_2.0_aws

# PCI DSS v3.2.1
prowler aws --compliance pci_3.2.1_aws

# SOC 2
prowler aws --compliance soc2_aws

# ISO 27001:2013
prowler aws --compliance iso27001_2013_aws
```

### 11–15: Compliance (continued) + HIPAA

```bash
# HIPAA
prowler aws --compliance hipaa_aws

# NIST SP 800-53 Rev 5
prowler aws --compliance nist_800_53_revision_5_aws

# GDPR
prowler aws --compliance gdpr_aws

# AWS Well-Architected Framework (Security Pillar)
prowler aws --compliance aws_well_architected_framework_security_aws

# FedRAMP Low / Moderate
prowler aws --compliance fedramp_low_aws
prowler aws --compliance fedramp_moderate_aws
```

### 16–20: Targeted Scans + Reports

```bash
# Scan only specific services
prowler aws --services s3 ec2 iam

# Scan specific checks by ID
prowler aws --checks check11 check12 check31

# List all available checks
prowler aws --list-checks

# List all available services
prowler aws --list-services

# List all compliance frameworks for AWS
prowler aws --list-compliance
```

## Compliance Frameworks Table

| Framework | Prowler Flag | Provider |
|---|---|---|
| CIS AWS Foundations 1.5 | `cis_1.5_aws` | AWS |
| CIS AWS Foundations 2.0 | `cis_2.0_aws` | AWS |
| PCI DSS v3.2.1 | `pci_3.2.1_aws` | AWS |
| SOC 2 | `soc2_aws` | AWS |
| ISO 27001:2013 | `iso27001_2013_aws` | AWS |
| HIPAA | `hipaa_aws` | AWS |
| NIST SP 800-53 Rev 4 | `nist_800_53_revision_4_aws` | AWS |
| NIST SP 800-53 Rev 5 | `nist_800_53_revision_5_aws` | AWS |
| GDPR | `gdpr_aws` | AWS |
| AWS Well-Architected (Security) | `aws_well_architected_framework_security_aws` | AWS |
| AWS FTR | `aws_ftr_aws` | AWS |
| FedRAMP Low | `fedramp_low_aws` | AWS |
| FedRAMP Moderate | `fedramp_moderate_aws` | AWS |
| ENS (Spanish National Security) | `ens_rd2022_aws` | AWS |
| BSI C5 | `bsi_c5_aws` | AWS |
| CISA | `cisa_aws` | AWS |
| NIS2 | `nis2_aws` | AWS |
| FFIEC | `ffiec_aws` | AWS |
| RBI | `rbi_aws` | AWS |
| KISA ISMS-P | `kisa_isms_p_aws` | AWS |
| GxP 21 CFR Part 11 | `gxp_21_cfr_part_11_aws` | AWS |

## Output Formats

```bash
# HTML report (opens in browser)
prowler aws --output-formats html

# JSON (machine-readable)
prowler aws --output-formats json

# CSV (spreadsheet-friendly)
prowler aws --output-formats csv

# JSON-OCSF (industry standard format)
prowler aws --output-formats json-ocsf

# SARIF (for GitHub Advanced Security integration)
prowler aws --output-formats sarif

# Multiple formats at once
prowler aws --output-formats html json csv --output-directory ./reports
```

## Python SDK Usage

```python
from prowler.lib.check.compliance import list_compliance_frameworks
from prowler.providers.aws.lib.audit.audit import run_audit

# List available compliance frameworks
frameworks = list_compliance_frameworks("aws")
print(frameworks)

# Run a compliance scan (programmatic)
results = run_audit(
    provider="aws",
    compliance_frameworks=["cis_2.0_aws"],
    services=["s3", "iam"],
    output_format="json"
)
```

## Sources

- Prowler GitHub: [https://github.com/prowler-cloud/prowler](https://github.com/prowler-cloud/prowler)
- Prowler Docs: [https://docs.prowler.com](https://docs.prowler.com)
- Prowler Compliance Docs: [https://docs.prowler.com/user-guide/compliance/tutorials/compliance](https://docs.prowler.com/user-guide/compliance/tutorials/compliance)
- Prowler Hub (check catalog): [https://hub.prowler.com](https://hub.prowler.com)
