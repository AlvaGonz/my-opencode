# Red Team Engagement Report

**Classification:** CONFIDENTIAL — CLIENT PRIVILEGED

---

## 1. Executive Summary

```
[2-3 paragraph summary of the engagement:
- Who was assessed (organization, scope)
- Key findings (what worked, what didn't)
- Overall risk rating (Critical / High / Medium / Low)
- Strategic recommendations (1-3 sentences)]
```

---

## 2. Engagement Scope

| Field | Detail |
|---|---|
| **Client** | [Client Name] |
| **Engagement Dates** | YYYY-MM-DD to YYYY-MM-DD |
| **Assessment Type** | [ ] Adversary Emulation [ ] Penetration Test [ ] Purple Team [ ] Red Team |
| **Methodology** | MITRE ATT&CK v[X] — Kill Chain |
| **ROE Reference** | [Rules of Engagement document link] |
| **Target IPs/Ranges** | [List or CIDR notation] |
| **In-Scope Users** | [User groups / OUs] |
| **Excluded Systems** | [Systems out of scope] |
| **Rules of Engagement** | [ ] No LTEs [ ] No DC destruction [ ] No encryption [ ] Other: |

### Team

| Role | Name |
|---|---|
| Red Team Lead | [Name] |
| Operator 1 | [Name] |
| Operator 2 | [Name] |
| Blue Team Liaison | [Name] |
| Client POC | [Name] |

---

## 3. Methodology

### 3.1 Kill Chain Coverage

| Stage | Executed | Techniques Used |
|---|---|---|
| Reconnaissance | [ ] Yes [ ] No | [TTP IDs] |
| Resource Development | [ ] Yes [ ] No | [TTP IDs] |
| Initial Access | [ ] Yes [ ] No | [TTP IDs] |
| Execution | [ ] Yes [ ] No | [TTP IDs] |
| Persistence | [ ] Yes [ ] No | [TTP IDs] |
| Privilege Escalation | [ ] Yes [ ] No | [TTP IDs] |
| Defense Evasion | [ ] Yes [ ] No | [TTP IDs] |
| Credential Access | [ ] Yes [ ] No | [TTP IDs] |
| Discovery | [ ] Yes [ ] No | [TTP IDs] |
| Lateral Movement | [ ] Yes [ ] No | [TTP IDs] |
| Collection | [ ] Yes [ ] No | [TTP IDs] |
| Command & Control | [ ] Yes [ ] No | [TTP IDs] |
| Exfiltration | [ ] Yes [ ] No | [TTP IDs] |
| Impact | [ ] Yes [ ] No | [TTP IDs] |

---

## 4. Findings Summary

| Severity | Count |
|---|---|
| **Critical** | [#] |
| **High** | [#] |
| **Medium** | [#] |
| **Low** | [#] |
| **Informational** | [#] |

### Findings Table

| ID | Title | Severity | Affected Asset | TTP ID | Status | Detection |
|---|---|---|---|---|---|---|
| F-001 | [Finding title] | Critical | [host/domain] | TXXXX | [Open/Remediated] | [Detection method] |
| F-002 | [Finding title] | High | [host/domain] | TXXXX | [Open/Remediated] | [Detection method] |
| F-003 | [Finding title] | Medium | [host/domain] | TXXXX | [Open/Remediated] | [Detection method] |
| F-004 | [Finding title] | Low | [host/domain] | TXXXX | [Open/Remediated] | [Detection method] |
| F-005 | [Finding title] | Info | [host/domain] | TXXXX | [Open/Remediated] | [Detection method] |

---

## 5. Detailed Findings

### F-001: [Finding Title]

- **Severity:** [Critical / High / Medium / Low]
- **CVE / Reference:** [CVE-XXXX-XXXX or none]
- **Affected Systems:** [List]

**Description:**
```
[What the finding is and how it was achieved]
```

**Impact:**
```
[What an adversary could do with this]
```

**Steps to Reproduce:**
```
1. Step 1
2. Step 2
3. Step 3
```

**Detection Guidance:**
```
[Detection rule, log source, or telemetry pattern to look for]
```

**Remediation:**
```
[Technical fix or configuration change]
```

---

### F-002: [Finding Title]

- **Severity:** [Critical / High / Medium / Low]
- **Affected Systems:** [List]

*(Repeat template for each finding)*

---

## 6. TTP Usage Maps

### MITRE ATT&CK Techniques Used

| Domain | Tactic | Technique ID | Technique Name | Test Reference |
|---|---|---|---|---|
| Enterprise | Initial Access | T1566.001 | Spearphishing Attachment | ART: T1566.001 |
| Enterprise | Execution | T1059.001 | PowerShell | ART: T1059.001 |
| Enterprise | Persistence | T1053.005 | Scheduled Task | ART: T1053.005 |
| Enterprise | Credential Access | T1003.001 | LSASS Memory Dumping | ART: T1003.001 |
| Enterprise | Lateral Movement | T1021.002 | SMB/Windows Admin Shares | ART: T1021.002 |
| Enterprise | Exfiltration | T1041 | Exfiltration Over C2 Channel | ART: T1041 |

*Add rows as needed for each technique used during the engagement.*

### Execution Chain (Temporal)

```
[sequence of operations with timestamps]
```

- `T0+0h` → T1566.001: Phishing email sent
- `T0+1h` → T1059.001: Payload execution via PowerShell
- `T0+2h` → T1003.001: LSASS dump on workstation
- `T0+3h` → T1021.002: Lateral movement to file server
- ...

---

## 7. Remediation Recommendations Table

| Priority | Finding ID | Recommendation | Effort | Owner | Timeline |
|---|---|---|---|---|---|
| P1 | F-001 | [Actionable recommendation] | [Low/Med/High] | [Team] | [30 days] |
| P2 | F-002 | [Actionable recommendation] | [Low/Med/High] | [Team] | [60 days] |
| P3 | F-003 | [Actionable recommendation] | [Low/Med/High] | [Team] | [90 days] |
| P4 | F-004 | [Actionable recommendation] | [Low/Med/High] | [Team] | [120 days] |

### Remediation Priority Guide

| Priority | Definition |
|---|---|
| **P1 — Critical** | Immediate remediation required. Exploitation leads to full domain compromise. |
| **P2 — High** | Remediate within 30-60 days. Exploitable with moderate effort. |
| **P3 — Medium** | Remediate within 90 days. Requires chained exploitation. |
| **P4 — Low** | Remediate within 120 days. Defense-in-depth improvement. |

---

## 8. Detection Gaps Summary

| Detection Area | Status | Notes |
|---|---|---|
| Process Creation Logging (4688) | [ ] Covered [ ] Partial [ ] Missing | |
| PowerShell Script Block Logging (4104) | [ ] Covered [ ] Partial [ ] Missing | |
| LDAP Query Logging | [ ] Covered [ ] Partial [ ] Missing | |
| DNS Query Logging | [ ] Covered [ ] Partial [ ] Missing | |
| Network Flow Logs (NetFlow) | [ ] Covered [ ] Partial [ ] Missing | |
| Windows Event Log Collection | [ ] Covered [ ] Partial [ ] Missing | |
| EDR Coverage | [ ] Covered [ ] Partial [ ] Missing | |
| Sysmon Deployment | [ ] Covered [ ] Partial [ ] Missing | |

---

## 9. Appendix

### A. Tools Used

| Tool | Purpose |
|---|---|
| [Tool name] | [Purpose] |
| [Tool name] | [Purpose] |

### B. Payload Hashes

| File Name | MD5 | SHA256 |
|---|---|---|
| payload.exe | [md5] | [sha256] |

### C. Indicators of Compromise (IOCs)

| Type | Value | Description |
|---|---|---|
| IP | 1.2.3.4 | C2 server |
| Domain | evil.example.com | Phishing domain |
| URL | https://evil.example.com/payload.dll | Payload staging |
| Registry | HKLM\...\Run\Backdoor | Persistence artifact |
| File Path | C:\Users\Public\svchost.exe | Dropped binary |
| YARA Rule | `rule SuspiciousPayload` | Byte pattern |

### D. References

- MITRE ATT&CK: https://attack.mitre.org
- Atomic Red Team: https://github.com/redcanaryco/atomic-red-team
- Red Team Tactics: https://ired.team

---

**Document Classification:** CONFIDENTIAL — CLIENT PRIVILEGED

*This report contains sensitive information about the security posture of [Client Name]. Distribution is limited to authorized personnel.*

---

## Sources

- [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team)
- [RedTeam-Tactics-and-Techniques](https://github.com/mantvydasb/RedTeam-Tactics-and-Techniques)
- [MITRE ATT&CK](https://attack.mitre.org)
- Template structure based on common red team engagement deliverable formats
