# MITRE ATT&CK Matrix — Atomic Test Coverage

> Source: [Atomic Red Team matrix.md](https://github.com/redcanaryco/atomic-red-team/blob/master/atomics/Indexes/Matrices/matrix.md)
> Fetched: 2026-06-23

## Legend

| Column | Meaning |
|--------|---------|
| **Tactic** | MITRE ATT&CK tactic category |
| **Technique ID** | MITRE ATT&CK technique identifier |
| **Technique Name** | Human-readable technique name |
| **Atomic Test** | Has one or more atomic tests available (Yes / No) |
| **Sub-technique** | Parent → Child technique relationship |

---

## Initial Access

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1133 | External Remote Services | Yes |
| T1566.002 | Phishing: Spearphishing Link | Yes |
| T1566.001 | Phishing: Spearphishing Attachment | Yes |
| T1091 | Replication Through Removable Media | Yes |
| T1195 | Supply Chain Compromise | CONTRIBUTE |
| T1659 | Content Injection | Yes |
| T1078.001 | Valid Accounts: Default Accounts | Yes |
| T1195.002 | Compromise Software Supply Chain | CONTRIBUTE |
| T1078.004 | Valid Accounts: Cloud Accounts | CONTRIBUTE |
| T1078.003 | Valid Accounts: Local Accounts | Yes |

## Execution

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1053.005 | Scheduled Task/Job: Scheduled Task | Yes |
| T1047 | Windows Management Instrumentation | Yes |
| T1129 | Server Software Component | Yes |
| T1059.007 | Command and Scripting Interpreter: JavaScript | Yes |
| T1053.007 | Kubernetes Cronjob | Yes |
| T1574.011 | Hijack Execution Flow: Services Registry Permissions Weakness | Yes |
| T1559.002 | Inter-Process Communication: Dynamic Data Exchange | Yes |
| T1204.002 | User Execution: Malicious File | Yes |
| T1053.003 | Scheduled Task/Job: Cron | Yes |
| T1574.001 | Hijack Execution Flow: DLL | Yes |
| T1106 | Native API | Yes |
| T1059.010 | Command and Scripting Interpreter: AutoHotKey & AutoIT | Yes |
| T1569.003 | System Services: Systemctl | Yes |
| T1610 | Deploy a container | Yes |
| T1574.008 | Hijack Execution Flow: Path Interception by Search Order Hijacking | Yes |
| T1574.006 | Hijack Execution Flow: LD_PRELOAD | Yes |
| T1059 | Command and Scripting Interpreter | Yes |
| T1609 | Kubernetes Exec Into Container | Yes |
| T1569.001 | System Services: Launchctl | Yes |
| T1072 | Software Deployment Tools | Yes |
| T1059.001 | Command and Scripting Interpreter: PowerShell | Yes |
| T1053.006 | Scheduled Task/Job: Systemd Timers | Yes |
| T1059.004 | Command and Scripting Interpreter: Bash | Yes |
| T1559 | Inter-Process Communication | Yes |

## Persistence

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1053.005 | Scheduled Task/Job: Scheduled Task | Yes |
| T1556.003 | Modify Authentication Process: Pluggable Authentication Modules | Yes |
| T1546.013 | Event Triggered Execution: PowerShell Profile | Yes |
| T1053.007 | Kubernetes Cronjob | Yes |
| T1133 | External Remote Services | Yes |
| T1542.001 | Pre-OS Boot: System Firmware | Yes |
| T1547 | Boot or Logon Autostart Execution | Yes |
| T1547.014 | Active Setup | Yes |
| T1543.003 | Create or Modify System Process: Windows Service | Yes |
| T1053.003 | Scheduled Task/Job: Cron | Yes |
| T1137 | Office Application Startup | Yes |
| T1098.003 | Account Manipulation: Additional Cloud Roles | Yes |
| T1547.012 | Boot or Logon Autostart Execution: Print Processors | Yes |
| T1137.006 | Office Application Startup: Add-ins | Yes |
| T1505.002 | Server Software Component: Transport Agent | Yes |
| T1547.010 | Boot or Logon Autostart Execution: Port Monitors | Yes |
| T1037.002 | Boot or Logon Initialization Scripts: Logon Script (Mac) | Yes |
| T1556.002 | Modify Authentication Process: Password Filter DLL | Yes |
| T1505.003 | Server Software Component: Web Shell | Yes |
| T1078.001 | Valid Accounts: Default Accounts | Yes |
| T1547.003 | Time Providers | Yes |
| T1546.005 | Event Triggered Execution: Trap | Yes |
| T1547.009 | Boot or Logon Autostart Execution: Shortcut Modification | Yes |
| T1547.005 | Boot or Logon Autostart Execution: Security Support Provider | Yes |
| T1543.004 | Create or Modify System Process: Launch Daemon | Yes |
| T1547.004 | Boot or Logon Autostart Execution: Winlogon Helper DLL | Yes |
| T1546.011 | Event Triggered Execution: Application Shimming | Yes |
| T1112 | Modify Registry | Yes |
| T1546.012 | Event Triggered Execution: Image File Execution Options Injection | Yes |
| T1546.008 | Event Triggered Execution: Accessibility Features | Yes |
| T1546.009 | Event Triggered Execution: AppCert DLLs | Yes |
| T1137.005 | Office Application Startup: Outlook Rules | Yes |
| T1176 | Browser Extensions | Yes |
| T1197 | BITS Jobs | Yes |
| T1122 | COM Hijacking | Yes |
| T1138 | Application Shimming | Yes |
| T1209 | Hijacking Time Providers | Yes |
| T1130 | Install Root Certificate | Yes |

## Privilege Escalation

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1055.011 | Process Injection: Extra Window Memory Injection | Yes |
| T1053.005 | Scheduled Task/Job: Scheduled Task | Yes |
| T1546.013 | Event Triggered Execution: PowerShell Profile | Yes |
| T1548.002 | Abuse Elevation Control Mechanism: Bypass User Account Control | Yes |
| T1548.003 | Abuse Elevation Control Mechanism: Sudo and Sudo Caching | Yes |
| T1547 | Boot or Logon Autostart Execution | Yes |
| T1484.002 | Domain Trust Modification | Yes |
| T1543.003 | Create or Modify System Process: Windows Service | Yes |
| T1547.014 | Active Setup | Yes |
| T1053.003 | Scheduled Task/Job: Cron | Yes |
| T1098.003 | Account Manipulation: Additional Cloud Roles | Yes |
| T1547.012 | Boot or Logon Autostart Execution: Print Processors | Yes |
| T1543.004 | Create or Modify System Process: Launch Daemon | Yes |
| T1484.001 | Domain Policy Modification: Group Policy Modification | Yes |
| T1078.001 | Valid Accounts: Default Accounts | Yes |
| T1547.003 | Time Providers | Yes |
| T1546.005 | Event Triggered Execution: Trap | Yes |
| T1547.009 | Boot or Logon Autostart Execution: Shortcut Modification | Yes |
| T1547.005 | Boot or Logon Autostart Execution: Security Support Provider | Yes |
| T1543.004 | Create or Modify System Process: Launch Daemon | Yes |
| T1547.004 | Boot or Logon Autostart Execution: Winlogon Helper DLL | Yes |
| T1134.002 | Create Process with Token | Yes |
| T1548.001 | Abuse Elevation Control Mechanism: Setuid and Setgid | Yes |
| T1055 | Process Injection | Yes |
| T1611 | Escape to Host | Yes |
| T1055.004 | Process Injection: Asynchronous Procedure Call | Yes |
| T1055.003 | Thread Execution Hijacking | Yes |
| T1546.011 | Event Triggered Execution: Application Shimming | Yes |
| T1546.012 | Event Triggered Execution: Image File Execution Options Injection | Yes |
| T1546.008 | Event Triggered Execution: Accessibility Features | Yes |
| T1546.009 | Event Triggered Execution: AppCert DLLs | Yes |
| T1547.010 | Boot or Logon Autostart Execution: Port Monitors | Yes |
| T1037.002 | Boot or Logon Initialization Scripts: Logon Script (Mac) | Yes |

## Defense Evasion

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1055.011 | Process Injection: Extra Window Memory Injection | Yes |
| T1218.011 | Signed Binary Proxy Execution: Rundll32 | Yes |
| T1216.001 | Signed Script Proxy Execution: Pubprn | Yes |
| T1006 | Direct Volume Access | Yes |
| T1564.008 | Hide Artifacts: Email Hiding Rules | Yes |
| T1027.013 | Obfuscated Files or Information: Encrypted/Encoded File | Yes |
| T1014 | Rootkit | Yes |
| T1036.007 | Masquerading: Double File Extension | Yes |
| T1542.001 | Pre-OS Boot: System Firmware | Yes |
| T1574.011 | Hijack Execution Flow: Services Registry Permissions Weakness | Yes |
| T1036.005 | Masquerading: Match Legitimate Name or Location | Yes |
| T1564 | Hide Artifacts | Yes |
| T1574.001 | Hijack Execution Flow: DLL | Yes |
| T1218.004 | Signed Binary Proxy Execution: InstallUtil | Yes |
| T1140 | Deobfuscate/Decode Files or Information | Yes |
| T1055.003 | Thread Execution Hijacking | Yes |
| T1036 | Masquerading | Yes |
| T1055 | Process Injection | Yes |
| T1620 | Reflective Code Loading | Yes |
| T1070.006 | Indicator Removal on Host: Timestomp | Yes |
| T1070.003 | Indicator Removal on Host: Clear Command History | Yes |
| T1202 | Indirect Command Execution | Yes |
| T1218 | Signed Binary Proxy Execution | Yes |
| T1218.007 | Signed Binary Proxy Execution: Msiexec | Yes |
| T1112 | Modify Registry | Yes |
| T1070.008 | Email Collection: Mailbox Manipulation | Yes |

## Credential Access

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1556.003 | Modify Authentication Process: Pluggable Authentication Modules | Yes |
| T1056.001 | Input Capture: Keylogging | Yes |
| T1003 | OS Credential Dumping | Yes |
| T1539 | Steal Web Session Cookie | Yes |
| T1003.002 | OS Credential Dumping: Security Account Manager | Yes |
| T1552.005 | Unsecured Credentials: Cloud Instance Metadata API | Yes |
| T1110.001 | Brute Force: Password Guessing | Yes |
| T1110.002 | Brute Force: Password Cracking | Yes |
| T1555.001 | Credentials from Password Stores: Keychain | Yes |
| T1003.004 | OS Credential Dumping: LSA Secrets | Yes |
| T1606.002 | Forge Web Credentials: SAML token | Yes |
| T1003.007 | OS Credential Dumping: Proc Filesystem | Yes |
| T1040 | Network Sniffing | Yes |
| T1552.002 | Unsecured Credentials: Credentials in Registry | Yes |
| T1556.002 | Modify Authentication Process: Password Filter DLL | Yes |
| T1558.004 | Steal or Forge Kerberos Tickets: AS-REP Roasting | Yes |
| T1555 | Credentials from Password Stores | Yes |
| T1552 | Unsecured Credentials | Yes |
| T1555.003 | Credentials from Password Stores: Credentials from Web Browsers | Yes |
| T1552.004 | Unsecured Credentials: Private Keys | Yes |
| T1557.001 | Adversary-in-the-Middle: LLMNR/NBT-NS Poisoning and SMB Relay | Yes |
| T1003.001 | OS Credential Dumping: LSASS Memory | Yes |
| T1110.003 | Brute Force: Password Spraying | Yes |
| T1003.005 | OS Credential Dumping: Cached Domain Credentials | Yes |
| T1558.001 | Steal or Forge Kerberos Tickets: Golden Ticket | Yes |
| T1649 | Steal or Forge Authentication Certificates | Yes |
| T1552.003 | Unsecured Credentials: Bash History | Yes |
| T1552.001 | Unsecured Credentials: Credentials In Files | Yes |
| T1528 | Steal Application Access Token | Yes |
| T1552.006 | Unsecured Credentials: Group Policy Preferences | Yes |

## Discovery

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1033 | System Owner/User Discovery | Yes |
| T1613 | Container and Resource Discovery | Yes |
| T1016.001 | System Network Configuration Discovery: Internet Connection Discovery | Yes |
| T1615 | Group Policy Discovery | Yes |
| T1652 | Device Driver Discovery | Yes |
| T1087.002 | Account Discovery: Domain Account | Yes |
| T1087.001 | Account Discovery: Local Account | Yes |
| T1497.001 | Virtualization/Sandbox Evasion: System Checks | Yes |
| T1069.002 | Permission Groups Discovery: Domain Groups | Yes |
| T1007 | System Service Discovery | Yes |
| T1040 | Network Sniffing | Yes |
| T1135 | Network Share Discovery | Yes |
| T1120 | Peripheral Device Discovery | Yes |
| T1082 | System Information Discovery | Yes |
| T1016.002 | System Network Configuration Discovery: Wi-Fi Discovery | Yes |
| T1010 | Application Window Discovery | Yes |
| T1580 | Cloud Infrastructure Discovery | Yes |
| T1217 | Browser Bookmark Discovery | Yes |
| T1016 | System Network Configuration Discovery | Yes |
| T1482 | Domain Trust Discovery | Yes |
| T1083 | File and Directory Discovery | Yes |
| T1049 | System Network Connections Discovery | Yes |
| T1057 | Process Discovery | Yes |
| T1069.001 | Permission Groups Discovery: Local Groups | Yes |
| T1201 | Password Policy Discovery | Yes |
| T1614.001 | System Location Discovery: System Language Discovery | Yes |
| T1012 | Query Registry | Yes |
| T1614 | System Location Discovery | Yes |
| T1518.001 | Software Discovery: Security Software Discovery | Yes |
| T1526 | Cloud Service Discovery | Yes |
| T1018 | Remote System Discovery | Yes |

## Lateral Movement

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1021.005 | Remote Services: VNC | Yes |
| T1021.004 | Remote Services: SSH | Yes |
| T1091 | Replication Through Removable Media | Yes |
| T1021.002 | Remote Services: SMB/Windows Admin Shares | Yes |
| T1021.006 | Remote Services: Windows Remote Management | Yes |
| T1021.003 | Remote Services: Distributed Component Object Model | Yes |
| T1550.003 | Use Alternate Authentication Material: Pass the Ticket | Yes |
| T1570 | Lateral Tool Transfer | Yes |
| T1563.002 | Remote Service Session Hijacking: RDP Hijacking | Yes |
| T1550.002 | Use Alternate Authentication Material: Pass the Hash | Yes |
| T1021.001 | Remote Services: Remote Desktop Protocol | Yes |
| T1072 | Software Deployment Tools | Yes |

## Collection

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1560.001 | Archive Collected Data: Archive via Utility | Yes |
| T1113 | Screen Capture | Yes |
| T1056.001 | Input Capture: Keylogging | Yes |
| T1123 | Audio Capture | Yes |
| T1114.001 | Email Collection: Local Email Collection | Yes |
| T1119 | Automated Collection | Yes |
| T1115 | Clipboard Data | Yes |
| T1530 | Data from Cloud Storage Object | Yes |
| T1005 | Data from Local System | Yes |
| T1560.002 | Archive Collected Data: Archive via Library | Yes |
| T1025 | Data from Removable Media | Yes |
| T1074.001 | Data Staged: Local Data Staging | Yes |
| T1114.003 | Email Collection: Email Forwarding Rule | Yes |
| T1039 | Data from Network Shared Drive | Yes |
| T1114.002 | Email Collection: Remote Email Collection | Yes |
| T1125 | Video Capture | Yes |
| T1056.004 | Input Capture: Credential API Hooking | Yes |
| T1056.002 | Input Capture: GUI Input Capture | Yes |
| T1557.001 | Adversary-in-the-Middle: LLMNR/NBT-NS Poisoning and SMB Relay | Yes |

## Command and Control

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1568.002 | Dynamic Resolution: Domain Generation Algorithms | Yes |
| T1071.004 | Application Layer Protocol: DNS | Yes |
| T1071 | Application Layer Protocol | Yes |
| T1219 | Remote Access Software | Yes |
| T1659 | Content Injection | Yes |
| T1572 | Protocol Tunneling | Yes |
| T1102.002 | Web Service: Bidirectional Communication | Yes |
| T1573 | Encrypted Channel | Yes |
| T1095 | Non-Application Layer Protocol | Yes |
| T1571 | Non-Standard Port | Yes |
| T1105 | Ingress Tool Transfer | Yes |
| T1071.001 | Application Layer Protocol: Web Protocols | Yes |
| T1132.001 | Data Encoding: Standard Encoding | Yes |
| T1090.003 | Proxy: Multi-hop Proxy | Yes |
| T1090.001 | Proxy: Internal Proxy | Yes |
| T1001.002 | Data Obfuscation via Steganography | Yes |

## Exfiltration

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1020 | Automated Exfiltration | Yes |
| T1048.002 | Exfiltration Over Alternative Protocol - Exfiltration Over Asymmetric Encrypted Non-C2 Protocol | Yes |
| T1041 | Exfiltration Over C2 Channel | Yes |
| T1048 | Exfiltration Over Alternative Protocol | Yes |
| T1567.003 | Exfiltration Over Web Service: Exfiltration to Text Storage Sites | Yes |
| T1567.002 | Exfiltration Over Web Service: Exfiltration to Cloud Storage | Yes |
| T1030 | Data Transfer Size Limits | Yes |
| T1048.003 | Exfiltration Over Alternative Protocol: Exfiltration Over Unencrypted/Obfuscated Non-C2 Protocol | Yes |

## Impact

| Technique ID | Technique Name | Atomic Test |
|---|---|---|
| T1489 | Service Stop | Yes |
| T1491.001 | Defacement: Internal Defacement | Yes |
| T1486 | Data Encrypted for Impact | Yes |
| T1531 | Account Access Removal | Yes |
| T1496 | Resource Hijacking | Yes |
| T1485 | Data Destruction | Yes |
| T1490 | Inhibit System Recovery | Yes |
| T1529 | System Shutdown/Reboot | Yes |

---

## Source

This table was derived from the [Atomic Red Team matrix.md](https://github.com/redcanaryco/atomic-red-team/blob/master/atomics/Indexes/Matrices/matrix.md). "CONTRIBUTE" indicates the technique is listed in the ATT&CK framework but does not yet have an atomic test contributed.

- Repo: [redcanaryco/atomic-red-team](https://github.com/redcanaryco/atomic-red-team)
- Wiki: [Getting Started](https://github.com/redcanaryco/atomic-red-team/wiki/Getting-Started)
- Website: [atomicredteam.io](https://atomicredteam.io)
- MITRE ATT&CK: [attack.mitre.org](https://attack.mitre.org)
