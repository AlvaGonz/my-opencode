# Recon Tools Reference

> Sources:
> - [toniblyx/my-arsenal-of-aws-security-tools](https://github.com/toniblyx/my-arsenal-of-aws-security-tools)
> - [hackertarget.com Nmap Tutorial](https://hackertarget.com/nmap-tutorial/) (— maintained alternative for the 404'd `hackertarget/nmap-tutorials` repo)
> - [hackertarget.com Nmap Cheat Sheet](https://hackertarget.com/nmap-cheatsheet-a-quick-reference-guide/)

## Network Scanning

### Nmap

```bash
# Host discovery (ping sweep)
nmap -sn 192.168.1.0/24

# Full TCP port scan
nmap -p- -T4 192.168.1.100

# Service/version detection
nmap -sV -sC -O 192.168.1.100

# Aggressive scan with NSE vuln scripts
nmap -A --script vuln 192.168.1.100

# Export to all formats
nmap -oA scan_result 192.168.1.100
```

| Flag | What It Reveals | Detection Risk |
|------|----------------|----------------|
| `-sn` | Live hosts on subnet | Low — ICMP echo only |
| `-p-` | All 65,535 TCP ports | High — full connect scan logged |
| `-sV` | Service banners + versions | Medium — service probe |
| `-O` | OS fingerprint (TTL, TCP stack) | Medium — passive OK; active triggers NIDS |
| `-sC` | Default NSE scripts | Medium — multiple script probes |
| `--script vuln` | CVE-matched vulnerabilities | High — aggressive, logged by WAF/IPS |
| `-A` | OS + version + scripts + traceroute | High — all of the above combined |

### Masscan

```bash
# Internet-wide TCP/443 scan
sudo masscan 0.0.0.0/0 -p443 --rate=10000 -oJ masscan.json
```

| Feature | Masscan | Nmap |
|---------|---------|------|
| Scan Rate | Up to 10M pkts/sec | ~1K pkts/sec (default) |
| Best For | Internet-wide | Targeted deep scans |
| Output | Binary, JSON, grepable | XML, JSON, grepable, normal |
| Payload | Custom TCP stack | Full TCP/IP stack |

### RustScan

```bash
# Fast port discovery piped into Nmap
rustscan -a 192.168.1.100 -- -sV -sC
```

## OSINT

### Amass

```bash
# Subdomain enumeration
amass enum -d example.com

# Passive mode (no direct DNS queries)
amass enum -passive -d example.com

# With API keys for data sources
amass enum -d example.com -config config.ini

# Visualize results
amass viz -d example.com -o graph.html
```

| Data Source | What It Reveals | Detection Risk |
|-------------|----------------|----------------|
| DNS brute-force | Subdomains via wordlist | Low — normal DNS queries |
| Certificate Transparency | Subdomains from CT logs | None — public logs (crt.sh) |
| Reverse WHOIS | Related domains, registrant info | None — public data |
| Search engines (cached) | Exposed endpoints, documents | None — public index |

### Holehe

```bash
# Check if email registered on services
holehe target@example.com
```

## Subdomain Enumeration

### Subfinder

```bash
subfinder -d example.com -o subdomains.txt
```

### assetfinder

```bash
assetfinder --subs-only example.com
```

### DNSX

```bash
# Resolve and probe subdomains
subfinder -d example.com | dnsx -a -resp-only
```

| Tool | Methodology | Rate Limit Concern |
|------|-------------|-------------------|
| Amass | CT logs + brute + APIs | Passive API calls safe; brute triggers DNS rate limits |
| Subfinder | 30+ passive sources | Minimal — passive only |
| Assetfinder | Cert streams + DNS | Minimal |
| DNSX | Concurrent resolver | Configurable: `-rl 100` |

## Cloud Enumeration

### Prowler (AWS/Azure/GCP)

```bash
# Full security assessment
prowler aws -M csv json html

# Check specific CIS control
prowler aws --checks s3_bucket_public_access

# Multi-account
prowler aws --role-arn arn:aws:iam::123456789012:role/ProwlerRole
```

### ScoutSuite (AWS/Azure/GCP)

```bash
# Run ScoutSuite against an AWS account
Scout --aws --report-dir ./report

# Azure
Scout --azure --report-dir ./report
```

### Cloudsplaining (AWS IAM)

```bash
# Scan an IAM policy
cloudsplaining scan --policy-file policy.json

# Scan an entire account
cloudsplaining download --profile default
cloudsplaining scan --input-file default.json
```

### PMapper (AWS IAM)

```bash
# Graph IAM relationships
pmapper --account 123456789012 graph
pmapper --account 123456789012 query "who-can-assume *"
```

### CloudMapper (AWS)

```bash
# Network visualization
python cloudmapper.py collect --account myaccount
python cloudmapper.py report --account myaccount
python cloudmapper.py webserver
```

| Tool | What It Reveals | Detection Risk |
|------|----------------|----------------|
| **Prowler** | CIS/NIST/PCI compliance gaps, public S3, open security groups | **HIGH** — aggressive API calls logged in CloudTrail |
| **ScoutSuite** | Cloud security posture, identity, network, storage | **MEDIUM** — read-only API calls |
| **Cloudsplaining** | Over-privileged IAM roles/users | **LOW** — read-only IAM policy analysis |
| **PMapper** | IAM privilege escalation paths | **LOW** — local graph computation after API dump |
| **CloudMapper** | AWS network topology, security group visualisation | **MEDIUM** — Describe* API calls logged |

## Recon Detection Risk Matrix

| Activity | CloudTrail Logged | NIDS/NPS Signature | Risk Level |
|----------|-------------------|--------------------|------------|
| DNS subdomain brute | ❌ | ⚠️ (DNS query volume) | 🟢 Low |
| CT log query (crt.sh) | ❌ | ❌ | 🟢 None |
| Nmap TCP connect scan | ❌ (not cloud) | ✅ (SYN flood) | 🟡 Medium |
| Masscan internet sweep | ❌ | ✅ (volume/packet) | 🔴 High |
| Prowler API calls | ✅ | ❌ (normal API) | 🔴 High |
| ScoutSuite API calls | ✅ | ❌ | 🟡 Medium |
| Amass passive API | ❌ | ❌ | 🟢 Low |

## Sources

- [toniblyx/my-arsenal-of-aws-security-tools](https://github.com/toniblyx/my-arsenal-of-aws-security-tools)
- [hackertarget.com Nmap Tutorial](https://hackertarget.com/nmap-tutorial/) (2026 edition)
- [hackertarget.com Nmap Cheat Sheet](https://hackertarget.com/nmap-cheatsheet-a-quick-reference-guide/) (Feb 2026)
- [Prowler](https://github.com/toniblyx/prowler)
- [ScoutSuite](https://github.com/nccgroup/ScoutSuite)
- [Cloudsplaining](https://github.com/salesforce/cloudsplaining)
- [OWASP Amass](https://github.com/owasp-amass/amass)
