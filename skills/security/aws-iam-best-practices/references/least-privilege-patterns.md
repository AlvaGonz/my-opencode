# Least-Privilege IAM Patterns for AWS

> Sources:
> - [https://github.com/iann0036/iamlive](https://github.com/iann0036/iamlive) — v1.1.28
> - [https://github.com/salesforce/cloudsplaining](https://github.com/salesforce/cloudsplaining) — v0.9.1
> - [https://github.com/salesforce/policy_sentry](https://github.com/salesforce/policy_sentry)

## Overview

The standard workflow for achieving least-privilege IAM in AWS:

1. **Capture** — Use `iamlive` to intercept real API calls during normal operation
2. **Analyze** — Use `cloudsplaining` to scan existing policies for over-privilege
3. **Generate** — Use the captured/analyzed data to write minimal IAM policies
4. **Validate** — Use `parliament` to lint policies before deployment

---

## 1. iamlive — Capture Real API Calls

### Installation

```bash
# Homebrew (macOS/Linux)
brew install iann0036/iamlive/iamlive

# Go install
go install github.com/iann0036/iamlive@latest

# Pre-built binaries: https://github.com/iann0036/iamlive/releases
```

### CSM Mode (Action-level only)

Captures `Action` but **not** `Resource` ARNs.

```bash
# Start listener, auto-configure .aws/config
iamlive --set-ini

# In another terminal, run your application or CLI commands
aws s3 ls
aws ec2 describe-instances

# Stop with Ctrl+C — policy is printed to stdout
```

### Proxy Mode (Action + Resource — preferred)

Captures full `Action` + `Resource` ARNs for precise policies.

```bash
# Start proxy listener
iamlive --set-ini --mode proxy

# Set proxy env vars in your application terminal
export HTTP_PROXY=http://127.0.0.1:10080
export HTTPS_PROXY=http://127.0.0.1:10080
export AWS_CA_BUNDLE=~/.iamlive/ca.pem

# Run your application
python my_app.py

# Stop with Ctrl+C — policy with resource constraints is printed
```

### Advanced Usage

```bash
# Failures-only mode (capture only denied calls)
iamlive --fails-only --set-ini

# Output to file
iamlive --set-ini --output-file generated-policy.json

# Background mode (returns PID)
iamlive --set-ini --background

# Force wildcard resource (skip resource capture)
iamlive --set-ini --force-wildcard-resource

# Specific AWS profile
iamlive --set-ini --profile staging
```

### Lambda Extension

For AWS Lambda environments, use the dedicated extension:
[https://github.com/iann0036/iamlive-lambda-extension](https://github.com/iann0036/iamlive-lambda-extension)

---

## 2. Cloudsplaining — Analyze Existing Policies

### Installation

```bash
pip3 install --user cloudsplaining
# or
brew install cloudsplaining
```

### Download Account Authorization Details

```bash
# Download all IAM details (users, groups, roles, policies)
cloudsplaining download

# With specific profile
cloudsplaining download --profile my-audit-account
```

### Create Exclusions File

```bash
cloudsplaining create-exclusions-file
# Edits exclusions.yml to filter out known permissive-by-design policies
```

### Scan and Generate Report

```bash
cloudsplaining scan \
  --exclusions-file exclusions.yml \
  --input-file default.json \
  --output ./cloudsplaining-report
```

This generates an HTML report identifying:
- **Data Exfiltration** risks (e.g., `s3:GetObject` on `*`)
- **Privilege Escalation** paths (e.g., `iam:PassRole` + `ec2:RunInstances`)
- **Resource Exposure** (e.g., `s3:PutBucketPolicy` on `*`)
- **Credentials Exposure** (e.g., `iam:CreateAccessKey`)
- **Infrastructure Modification** without resource constraints

### Scan a Single Policy File

```bash
cloudsplaining scan-policy-file \
  --input-file my-policy.json
```

### Multi-Account Scan

```bash
# Create config
cloudsplaining create-multi-account-config-file -o accounts.yml

# Scan all accounts
cloudsplaining scan-multi-account \
  -c accounts.yml \
  --profile scanning-user \
  --role-name SecurityAuditRole \
  --output-directory ./
```

---

## 3. Over-Per missioned AWS Actions Table

These actions are frequently granted on `Resource: "*"` but should be scoped to specific ARNs:

| Over-Permissioned Action | Risk | Safer Alternative |
|---|---|---|
| `s3:GetObject` on `*` | Data exfiltration | `arn:aws:s3:::specific-bucket/*` |
| `s3:PutObject` on `*` | Data tampering | `arn:aws:s3:::specific-bucket/path/*` |
| `s3:PutBucketPolicy` on `*` | Resource exposure | `arn:aws:s3:::specific-bucket` |
| `iam:PassRole` on `*` | Privilege escalation | `arn:aws:iam::*:role/SpecificRole` |
| `ec2:RunInstances` on `*` | Uncontrolled compute | Scope by subnet, VPC, or instance type |
| `ec2:TerminateInstances` on `*` | Destructive | `arn:aws:ec2:region:account:instance/*` with condition `aws:ResourceTag` |
| `lambda:CreateFunction` on `*` | Code injection | Scope to specific IAM role or subnet |
| `kms:Decrypt` on `*` | Data exposure | `arn:aws:kms:region:account:key/specific-key-id` |
| `ssm:GetParameter` on `*` | Secret exposure | `arn:aws:ssm:region:account:parameter/specific-path/*` |
| `secretsmanager:GetSecretValue` on `*` | Secret exposure | `arn:aws:secretsmanager:region:account:secret:specific-name-??????` |
| `iam:CreateAccessKey` on `*` | Credentials exposure | `arn:aws:iam::account:user/${aws:username}` with condition |
| `iam:CreateUser` on `*` | Identity sprawl | Scope to specific path prefix |

---

## 4. Minimal IAM Policy Example

After running iamlive + cloudsplaining, here is a properly scoped policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-application-data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/MyTable"
    },
    {
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/mrk-1234567890abcdef",
      "Condition": {
        "ForAnyValue:StringLike": {
          "kms:ViaService": [
            "dynamodb.us-east-1.amazonaws.com",
            "s3.us-east-1.amazonaws.com"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:123456789012:log-group:/aws/my-app/*:*"
    }
  ]
}
```

---

## 5. Policy Linting with Parliament

```bash
pip install parliament

# Lint a policy file
parliament --file my-policy.json

# Lint with custom config
parliament --file my-policy.json --config parliament-config.yml
```

---

## Workflow Summary

```bash
# STEP 1: Capture real usage
iamlive --set-ini --mode proxy --output-file captured-actions.json

# STEP 2: Run your application, then Ctrl+C to stop iamlive

# STEP 3: Analyze existing policies
cloudsplaining download
cloudsplaining scan -i default.json -o ./report

# STEP 4: Review HTML report at ./report/index.html

# STEP 5: Write minimal policy based on captured actions and report findings

# STEP 6: Lint
parliament --file my-minimal-policy.json
```

## Sources

- iamlive: [https://github.com/iann0036/iamlive](https://github.com/iann0036/iamlive)
- Cloudsplaining: [https://github.com/salesforce/cloudsplaining](https://github.com/salesforce/cloudsplaining)
- Policy Sentry: [https://github.com/salesforce/policy_sentry](https://github.com/salesforce/policy_sentry)
- Parliament: [https://github.com/duo-labs/parliament](https://github.com/duo-labs/parliament)
- iamlive Lambda Extension: [https://github.com/iann0036/iamlive-lambda-extension](https://github.com/iann0036/iamlive-lambda-extension)
