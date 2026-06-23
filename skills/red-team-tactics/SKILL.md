---
name: red-team-tactics
description: Red team tactics including TTPs, kill chain stages, adversary emulation, MITRE ATT&CK mapping, and offensive security methodology.
trigger: "when the user asks about red team TTPs, kill chain stages, adversary emulation, MITRE ATT&CK mapping, or offensive security methodology"
scope: offensive-security
version: "1.0"
sources:
  - https://github.com/mantvydasb/RedTeam-Tactics-and-Techniques
  - https://github.com/redcanaryco/atomic-red-team
  - https://github.com/yeyintminthuhtut/Awesome-Red-Teaming
---

# Red Team Tactics Skill

## Purpose

This skill provides authoritative reference material for red team operations, adversary emulation, and offensive security methodology. It maps real-world techniques to the MITRE ATT&CK framework and documents the full kill chain from reconnaissance to exfiltration.

Use this skill when you need to:

- Identify relevant TTPs for a given adversarial objective
- Map offensive techniques to MITRE ATT&CK IDs
- Plan adversary emulation scenarios
- Build detection test cases based on Atomic Red Team tests
- Reference kill chain stages with real technique examples

## How to Use

1. **Kill chain mapping** — Open `references/kill-chain-stages.md` to understand each stage (Recon → Weaponization → Delivery → Exploitation → Installation → C2 → Actions on Objectives) with definitions, common tools, detection indicators, and examples from [ired.team](https://ired.team).

2. **TTP lookup** — Open `references/ttp-catalog.md` for a curated list of the top 30 most commonly used TTPs cross-referenced against both Atomic Red Team and RedTeam-Tactics repos. Each entry includes TTP ID, name, phase, atomic test command, and detection evasion notes.

3. **MITRE ATT&CK matrix** — Open `references/mitre-attack-matrix.md` for the full tactic-to-technique mapping table derived from the Atomic Red Team matrix, showing which techniques have atomic tests available.

4. **Engagement reporting** — Open `assets/engagement-report-template.md` to generate structured red team assessment reports with executive summary, scope, findings by severity, TTP-to-MITRE mapping, and remediation tables.

## What Each Reference File Contains

| File | Source | Content |
|------|--------|---------|
| `references/mitre-attack-matrix.md` | atomic-red-team | Tactic → Technique ID → Technique Name → Atomic Test available |
| `references/kill-chain-stages.md` | ired.team / RedTeam-Tactics | Kill chain breakdown by stage with tools, indicators, examples |
| `references/ttp-catalog.md` | Both repos | Top 30 TTPs cross-referenced with atomic commands and evasion notes |
| `assets/engagement-report-template.md` | Template | Blank engagement report with findings table and remediation matrix |

## Gotchas

- **Atomic tests are live** — The atomic-red-team repo receives frequent updates. Always check the [upstream matrix](https://github.com/redcanaryco/atomic-red-team/blob/master/atomics/Indexes/Matrices/matrix.md) for the latest TTP coverage.
- **TTP IDs change** — MITRE ATT&CK versions occasionally renumber techniques. Cross-reference with [attack.mitre.org](https://attack.mitre.org) for the current IDs.
- **ired.team focuses on Windows** — The RedTeam-Tactics repo is heavily Windows/Active Directory focused. For Linux or cloud TTPs, supplement with platform-specific references.
- **Detection indicators are not exhaustive** — Indicators listed are common artifacts; real-world ops may produce different telemetry depending on environment configuration.
- **Use in controlled environments only** — The techniques documented here are for authorized testing. Unauthorized use is illegal.

## Sources

- [Atomic Red Team — redcanaryco/atomic-red-team](https://github.com/redcanaryco/atomic-red-team)
- [RedTeam Tactics and Techniques — mantvydasb/RedTeam-Tactics-and-Techniques](https://github.com/mantvydasb/RedTeam-Tactics-and-Techniques) (ired.team)
- [Awesome Red Teaming — yeyintminthuhtut/Awesome-Red-Teaming](https://github.com/yeyintminthuhtut/Awesome-Red-Teaming)
- [MITRE ATT&CK](https://attack.mitre.org)
