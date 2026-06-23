---
name: red-team-tools
description: Tool selection guidance for red team operations including recon, C2 frameworks, lateral movement, privilege escalation, and post-exploitation.
trigger: "when the user asks which tool to use for recon, C2 framework selection, lateral movement, privilege escalation, or post-exploitation"
scope: offensive-security-tooling
version: "1.0"
sources:
  - https://github.com/toniblyx/my-arsenal-of-aws-security-tools
  - https://github.com/BishopFox/sliver
  - https://github.com/joaoviictorti/RustRedOps
  - https://github.com/hackertarget/nmap-tutorials
  - https://hackertarget.com/nmap-tutorial/
  - https://hackertarget.com/nmap-cheatsheet-a-quick-reference-guide/
---

# Red Team Tools Skill

## Purpose

Guide selection of offensive security tools across the full red-team lifecycle. Covers **reconnaissance**, **initial access**, **C2 frameworks**, **lateral movement**, **privilege escalation**, **persistence**, **exfiltration**, and **post-exploitation** — with an emphasis on cloud-native environments and Rust-based evasion tooling.

## How to Use

1. Determine the **phase** of your engagement (recon, initial-access, persistence, lateral-movement, exfil, c2).
2. Run `scripts/tool-selector.sh --phase <phase>` for tool recommendations.
3. Consult `references/c2-frameworks.md` for C2 selection (Sliver vs Metasploit vs Covenant vs Havoc).
4. Consult `references/recon-tools.md` for network scanning, OSINT, subdomain enumeration, and cloud enumeration.
5. Consult `references/post-exploitation.md` for RustRedOps modules and AV-evasion guidance.

## What Reference Files Contain

| File | Content |
|------|---------|
| `config.json` | Default configuration (OS, target, C2, language preference) |
| `scripts/tool-selector.sh` | Bash script that outputs tool per phase |
| `references/c2-frameworks.md` | Sliver architecture, install, comparison table |
| `references/recon-tools.md` | Recon tools by category with commands |
| `references/post-exploitation.md` | RustRedOps modules, AV evasion, quickstarts |

## Gotchas

- **Sliver** is Go-based; implants cross-compile easily but generate larger binaries than Nim-based alternatives.
- **RustRedOps** targets Windows only. Modules use Windows API directly — test on target OS version.
- Cloud enumeration tools (Prowler, ScoutSuite, Cloudsplaining) require valid AWS credentials; logs are recorded in CloudTrail.
- The `hackertarget/nmap-tutorials` GitHub repo is **404** — the maintained resource is the blog post at `https://hackertarget.com/nmap-tutorial/`. Use that instead.
- All tool installation commands assume **Debian/Ubuntu** or **macOS Homebrew**. Adjust for RHEL.

## Sources

- [my-arsenal-of-aws-security-tools](https://github.com/toniblyx/my-arsenal-of-aws-security-tools) — 9.5k stars, AWS tool curation
- [BishopFox/sliver](https://github.com/BishopFox/sliver) — 11.4k stars, adversary emulation framework
- [joaoviictorti/RustRedOps](https://github.com/joaoviictorti/RustRedOps) — 1.9k stars, Rust red team techniques
- [hackertarget/nmap-tutorials](https://github.com/hackertarget/nmap-tutorials) — 404 (unreachable)
- [hackertarget.com Nmap Tutorial](https://hackertarget.com/nmap-tutorial/) — maintained alternative
