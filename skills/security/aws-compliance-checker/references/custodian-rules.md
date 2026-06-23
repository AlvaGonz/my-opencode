# Cloud Custodian — Policy-as-Code Rules for AWS

> Source: [https://github.com/cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian) — v0.9.51.0 (CNCF Incubating)

## Installation

```bash
python3 -m venv custodian
source custodian/bin/activate
pip install c7n

# Verify
custodian version
```

## Policy Format (YAML)

Every Cloud Custodian policy follows this structure:

```yaml
policies:
  - name: <unique-policy-name>
    resource: <aws.<service>>
    description: |
      <human-readable description>
    mode:
      type: <pull|cloudtrail|ec2-instance-state|asg-instance-state|...>
      role: <arn-of-execution-role>  # required for serverless modes
      events:
        - <event-name>
    filters:
      - <filter-definition>
    actions:
      - <action-definition>
```

**Key concepts:**
- `resource` — The AWS resource type (e.g., `aws.s3`, `aws.ec2`, `aws.iam-user`)
- `filters` — Selection criteria (what resources match)
- `actions` — What to do with matched resources (delete, tag, notify, etc.)
- `mode` — Execution mode: `pull` (periodic), `cloudtrail` (event-driven), etc.

## 10 Production-Ready Policies

### 1. Block S3 Public Access (Cross-Account)

```yaml
policies:
  - name: s3-block-cross-account-access
    resource: aws.s3
    description: |
      Removes cross-account access statements from S3 bucket policies.
    filters:
      - type: cross-account
    actions:
      - type: remove-statements
        statement_ids: matched
```

### 2. Delete EC2 Instances with Old AMIs (>180 days)

```yaml
policies:
  - name: ec2-old-ami-cleanup
    resource: aws.ec2
    description: |
      Terminate EC2 instances running AMIs older than 180 days.
    filters:
      - type: image-age
        days: 180
    actions:
      - type: terminate
        force: true
```

### 3. Detect and Remediate Unencrypted EBS Volumes

```yaml
policies:
  - name: ebs-enforce-encryption
    resource: aws.ebs
    description: |
      Snapshot and delete unencrypted EBS volumes. Alerts on creation.
    mode:
      type: cloudtrail
      role: arn:aws:iam::123456789012:role/CustodianRole
      events:
        - CreateVolume
    filters:
      - Encrypted: false
    actions:
      - type: snapshot
      - type: delete
```

### 4. Disable or Delete Unused IAM Access Keys (>90 days)

```yaml
policies:
  - name: iam-disable-unused-keys
    resource: aws.iam-user
    description: |
      Disable IAM access keys that have not been used in 90 days.
    filters:
      - type: credential
        key: access_keys
        unused_days: 90
    actions:
      - type: remove-keys
```

### 5. Find and Remediate Open Security Groups (0.0.0.0/0)

```yaml
policies:
  - name: sg-remove-open-ingress
    resource: aws.security-group
    description: |
      Removes rules that allow ingress from 0.0.0.0/0 on non-HTTP/HTTPS ports.
    filters:
      - type: ingress
        Cidr: "0.0.0.0/0"
        NotPort: [80, 443]
    actions:
      - type: remove-permissions
        ingress: matched
```

### 6. Tag Untagged Resources

```yaml
policies:
  - name: tag-untagged-ec2
    resource: aws.ec2
    description: |
      Tags any EC2 instance missing the 'Environment' tag with 'Unidentified'.
    filters:
      - "tag:Environment": absent
    actions:
      - type: tag
        key: Environment
        value: Unidentified
```

### 7. Enforce RDS Instance Encryption

```yaml
policies:
  - name: rds-enforce-encryption
    resource: aws.rds
    description: |
      Terminate unencrypted RDS instances (with snapshot backup).
      Uses cloudtrail mode for real-time enforcement on CreateDBInstance events.
    mode:
      type: cloudtrail
      role: arn:aws:iam::123456789012:role/CustodianRole
      events:
        - CreateDBInstance
    filters:
      - StorageEncrypted: false
    actions:
      - type: snapshot
      - delete
```

### 8. Enforce S3 Bucket Versioning

```yaml
policies:
  - name: s3-enable-versioning
    resource: aws.s3
    description: |
      Enables versioning on all S3 buckets that do not have it enabled.
    filters:
      - type: bucket-versioning
        state: false
    actions:
      - type: toggle-versioning
        enabled: true
```

### 9. Remove Stale EC2 Classic Load Balancers

```yaml
policies:
  - name: elb-cleanup-stale
    resource: aws.elb
    description: |
      Delete classic load balancers with no attached instances.
    filters:
      - type: value
        key: Instances
        value: []
    actions:
      - type: delete
```

### 10. Enforce Lambda Runtime Version

```yaml
policies:
  - name: lambda-enforce-runtime
    resource: aws.lambda
    description: |
      Flag Lambda functions using deprecated Python 3.8 runtime.
    filters:
      - type: value
        key: Runtime
        op: in
        value:
          - python3.8
          - python3.9
          - nodejs14.x
          - nodejs16.x
    actions:
      - type: notify
        subject: "Deprecated Lambda Runtime Detected"
        to:
          - security@example.com
        transport:
          type: sqs
          queue: https://sqs.us-east-1.amazonaws.com/123456789012/security-notifications
```

## Dryrun vs Enforce Mode

**Always run `--dryrun` first in production accounts:**

```bash
# DRYRUN — see what WOULD happen (no actions executed)
custodian run --dryrun -s output policy.yml

# ENFORCE — actually execute actions
custodian run -s output policy.yml
```

The `--dryrun` flag prints matched resources but does **not** execute any `actions` block. This is critical for:

- Validating filter logic before destructive operations
- Estimating blast radius of a new policy
- Tuning tag-based exclusions

**Best practice pipeline:**

```bash
# Step 1: Validate YAML syntax
custodian validate policy.yml

# Step 2: Dryrun
custodian run --dryrun -s ./output policy.yml

# Step 3: Review output in ./output/<policy-name>/resources.json

# Step 4: If satisfied, run without --dryrun
custodian run -s ./output policy.yml
```

## Mode Types

| Mode | Trigger | Use Case |
|---|---|---|
| `pull` | Periodic (configurable interval) | Compliance checks, cleanup jobs |
| `cloudtrail` | CloudTrail API events | Real-time enforcement on specific API calls |
| `ec2-instance-state` | EC2 instance state transitions | React to instance starts/stops/terminations |
| `asg-instance-state` | ASG instance lifecycle events | Auto-scaling group management |
| `phd` | AWS Personal Health Dashboard events | React to AWS service health events |

## Sources

- Cloud Custodian GitHub: [https://github.com/cloud-custodian/cloud-custodian](https://github.com/cloud-custodian/cloud-custodian)
- Cloud Custodian Docs: [https://cloudcustodian.io/docs/index.html](https://cloudcustodian.io/docs/index.html)
- AWS Getting Started: [https://cloudcustodian.io/docs/aws/gettingstarted.html](https://cloudcustodian.io/docs/aws/gettingstarted.html)
- c7n-org (multi-account): [https://cloudcustodian.io/docs/tools/c7n-org.html](https://cloudcustodian.io/docs/tools/c7n-org.html)
