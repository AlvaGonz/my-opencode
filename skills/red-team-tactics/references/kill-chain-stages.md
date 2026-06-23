# Kill Chain Stages

> Sources:
> - [RedTeam-Tactics-and-Techniques](https://github.com/mantvydasb/RedTeam-Tactics-and-Techniques) (ired.team)
> - MITRE ATT&CK framework mapping

The traditional cyber kill chain describes the 7 stages of a targeted attack. Below each stage is broken down with definitions, common tools, detection indicators, and real technique examples drawn from the RedTeam-Tactics repo.

---

## Stage 1: Reconnaissance

**Definition:** Target selection, research, and identification of vulnerabilities. The adversary gathers information about the target environment before committing to an attack.

**Common Tools:** Maltego, theHarvester, Spiderfoot, Shodan, Nmap, Recon-ng, DNS enumeration tools

**Detection Indicators:**
- Spike in DNS lookups from external IPs
- Directory brute-force attempts on web servers
- Social media scraping patterns
- Shodan/Censys scans against public IP ranges

**Technique Examples:**
1. **Spiderfoot OSINT Automation** — Automated collection of email addresses, subdomains, and technical contacts via Spiderfoot 101 with Kali using Docker
2. **OWA Password Spraying** — Password spraying Outlook Web Access without triggering account lockouts
3. **Active Scanning** — Port/service enumeration using Nmap to identify attack surface

---

## Stage 2: Resource Development

**Definition:** Adversary builds or acquires infrastructure, tools, and capabilities needed for the operation. This includes domains, VPS, C2 servers, malware, and weaponized documents.

**Common Tools:** Terraform (infrastructure automation), Cobalt Strike team server, DigitalOcean/AWS/VPS, Let's Encrypt, Cloudflare

**Detection Indicators:**
- Registration of domains resembling target brands
- New SSL certificates issued for suspicious domains
- Infrastructure hosted on known VPS ranges
- DNS TXT records with C2 staging info

**Technique Examples:**
1. **Automated Red Team Infrastructure with Terraform** — Using Terraform to deploy redirectors, phishing servers, and C2 infrastructure programmatically
2. **Cobalt Strike Team Server Setup** — Deployment of C2 infrastructure with Malleable C2 profiles
3. **SMTP Forwarders/Relays** — Setting up email relays for phishing campaigns

---

## Stage 3: Initial Access

**Definition:** Entry into the target network. The adversary delivers the initial payload or exploits a vulnerability to gain a foothold.

**Common Tools:** GoPhish, Empire, Cobalt Strike, MS Office macros, DDE, LNK files, USB drops

**Detection Indicators:**
- Process tree: WINWORD.EXE → cmd.exe → powershell.exe
- Office applications spawning child processes
- DCOM/ActiveX object instantiation from Office
- Files downloaded from remote templates
- SMB named pipe connections to admin shares

**Technique Examples:**
1. **Phishing with MS Office VBA Macros (T1137)** — Malicious macro in Office document delivers Empire or Cobalt Strike payload
2. **Phishing: DDE (T1173)** — Dynamic Data Exchange field codes execute commands without macros
3. **Forced Authentication (T1187)** — Stealing NetNTLMv2 hashes via Outlook by referencing UNC paths in HTML email

---

## Stage 4: Execution

**Definition:** Running malicious code on the target system. Encompasses various techniques for code execution from script interpreters to binary exploitation.

**Common Tools:** PowerShell, mshta, regsvr32, MSBuild, WMIC, installutil, certutil

**Detection Indicators:**
- `regsvr32.exe` loading remote .sct files
- `mshta.exe` executing JavaScript from URLs
- `MSBuild.exe` compiling and executing inline tasks
- `wmic.exe` with XSL transforms
- `powershell.exe` with encoded commands (`-EncodedCommand`)

**Technique Examples:**
1. **T1117: regsvr32 (Squiblydoo)** — regsvr32.exe loads a COM scriptlet from a remote server to bypass AppLocker
2. **T1170: MSHTA Code Execution** — mshta.exe executes JavaScript/HTML application to run shellcode
3. **Using MSBuild to Execute Shellcode in C#** — MSBuild.exe compiles and runs inline C# that executes shellcode in memory

---

## Stage 5: Persistence

**Definition:** Maintaining access across reboots and credential changes. The adversary installs backdoors, creates accounts, or modifies system mechanisms to retain access.

**Common Tools:** Scheduled tasks, WMI event subscriptions, registry run keys, service DLLs, COM hijacking, stiky keys

**Detection Indicators:**
- New scheduled tasks created with short notice intervals
- Suspicious service DLLs in `svchost.exe`
- Debugger keys in `Image File Execution Options`
- New user accounts created in non-standard OUs
- Registry modifications to `Run`, `RunOnce`, `Active Setup`

**Technique Examples:**
1. **T1053: Schtask Persistence** — Creating scheduled tasks that execute payload at logon or on interval
2. **T1015: Sticky Keys (sethc.exe)** — Replacing sethc.exe with cmd.exe for SYSTEM-level access via RDP
3. **T1197: BITS Jobs** — Using Background Intelligent Transfer Service for persistent command execution

---

## Stage 6: Privilege Escalation

**Definition:** Gaining higher-level permissions on the system or domain. The adversary moves from a limited user to Administrator or SYSTEM.

**Common Tools:** UAC bypass techniques, Token manipulation, MS16-032, Hot Potato, Juicy Potato, PrintNightmare

**Detection Indicators:**
- `eventvwr.exe` or `sdclt.exe` spawning shells without user interaction
- Token manipulation API calls (DuplicateToken, ImpersonateLoggedOnUser)
- Named pipe connections for impersonation
- DLL loaded from user-writable paths by SYSTEM services

**Technique Examples:**
1. **T1548.002: Bypass User Account Control** — UAC bypass via eventvwr.exe registry hijacking
2. **T1134: Access Token Manipulation** — Primary token manipulation for privilege escalation using Windows APIs
3. **Windows Named Pipes Privilege Escalation** — Abusing named pipe impersonation to escalate privileges

---

## Stage 7: Defense Evasion

**Definition:** Avoiding detection by security controls. The adversary employs techniques to bypass AV, EDR, application whitelisting, and logging.

**Common Tools:** Veil, Shellter, Arcane, AMSI bypasses, syscall direct invocation, DLL unhooking

**Detection Indicators:**
- PowerShell with `-NoProfile`, `-WindowStyle Hidden`, or `-EncodedCommand`
- Unhooking of ntdll.dll in process memory
- Direct syscall instructions (`syscall` in assembly)
- Process injection (CreateRemoteThread, NtCreateThreadEx)
- Disabled ETW or AMSI patching

**Technique Examples:**
1. **Direct Syscalls from Visual Studio** — Calling system calls directly to bypass userland API hooks
2. **T1027: Obfuscated PowerShell Invocations** — Base64-encoded, compressed, or split commands
3. **Full DLL Unhooking with C++** — Restoring ntdll.dll from disk to remove EDR hooks

---

## Stage 8: Credential Access

**Definition:** Stealing credentials for lateral movement or persistence. The adversary dumps password hashes, extracts Kerberos tickets, or intercepts plaintext credentials.

**Common Tools:** Mimikatz, Rubeus, SharpKatz, ProcDump, SafetyKatz, LaZagne

**Detection Indicators:**
- LSASS process handle requests (PROCESS_VM_READ, PROCESS_QUERY_INFORMATION)
- `mimikatz` or `Invoke-Mimikatz` in process memory
- Volume Shadow Copy creation for ntds.dit harvesting
- `sekurlsa::logonpasswords` or `lsadump::dcsync` artifact strings
- Unusual access to SAM and SYSTEM registry hives

**Technique Examples:**
1. **T1003.001: LSASS Memory Dumping** — Dumping credentials from lsass.exe process memory using Mimikatz
2. **DCSync** — Replicating domain controller data to obtain krbtgt hash and all domain credentials
3. **T1558.001: Golden Ticket** — Forging Kerberos TGT with krbtgt hash for domain-wide persistence

---

## Stage 9: Discovery

**Definition:** Learning about the environment. The adversary enumerates users, groups, computers, network shares, trust relationships, and security controls.

**Common Tools:** PowerView, BloodHound, SharpHound, AdFind, native Windows commands (net, whoami, nltest)

**Detection Indicators:**
- Repeated `net group /domain`, `net user /domain` commands
- LDAP queries performing broad searches against domain controllers
- SharpHound collector.exe data transfer
- `nltest /domain_trusts` enumeration
- DCOM object creation for remote WMI queries

**Technique Examples:**
1. **PowerView: Active Directory Enumeration** — Using PowerView's cmdlets to map AD permissions, group memberships, and trust relationships
2. **BloodHound with Kali Linux** — Using BloodHound to visualize attack paths in AD environments
3. **T1087: Account Discovery** — Enumerating user and group accounts via net.exe, WMI, or LDAP

---

## Stage 10: Lateral Movement

**Definition:** Moving across the network from the initial foothold to other systems. The adversary spreads to reach high-value targets.

**Common Tools:** PsExec, WMI, WinRM, DCOM, SMB exec, pass-the-hash, Overpass-the-hash, PsExec

**Detection Indicators:**
- Service creation remotely via `sc.exe` or `psexec.exe`
- WMI event subscription creation on remote machines
- WinRM service connection events (5985/5986)
- Schedule tasks created remotely via `schtasks /CREATE`
- Lateral tool transfer via SMB admin shares (ADMIN$)

**Technique Examples:**
1. **T1047: WMI for Lateral Movement** — Executing processes remotely using WMI (wmic /node: "command")
2. **T1028: WinRM for Lateral Movement** — Remote PowerShell sessions over WinRM
3. **T1076: RDP Hijacking** — Hijacking existing RDP sessions using tscon.exe

---

## Stage 11: Collection

**Definition:** Identifying and gathering data of interest. The adversary locates and collects sensitive information including credentials, documents, databases, and emails.

**Common Tools:** Rclone, 7zip, PowerShell archiving, built-in archive utilities

**Detection Indicators:**
- Archive utilities (rar, zip, 7z, tar) compressing large file sets
- Access to SharePoint or file shares outside normal business hours
- PowerShell downloading files from internal repositories
- Screen capture API calls
- Clipboard monitoring API calls

**Technique Examples:**
1. **T1113: Screen Capture** — Programmatically capturing screen contents via GDI or DirectX
2. **T1123: Audio Capture** — Recording audio from microphone using Windows APIs
3. **Archive Collected Data via Utility** — Compressing stolen files with `compress-archive` or 7-Zip

---

## Stage 12: Command & Control

**Definition:** Establishing an encrypted or obfuscated channel to the target environment. The adversary communicates with implants to issue commands and exfiltrate data.

**Common Tools:** Cobalt Strike, Empire, Metasploit, Covenant, Sliver, Merlin, PoshC2

**Detection Indicators:**
- Beacons with jittered sleep intervals
- DNS TXT queries returning base64-encoded payload
- HTTPS to unusual domains or with unusual JA3 fingerprints
- WebSocket connections to unknown endpoints
- C2 traffic on non-standard ports

**Technique Examples:**
1. **C2 over DNS** — Data exfiltration and command execution via DNS queries and TXT records
2. **C2 over HTTPS/Web** — Beacons using HTTPS with custom headers to blend with legitimate traffic
3. **Domain Fronting** — Using CDN fronting to hide true C2 destination behind legitimate services

---

## Stage 13: Exfiltration

**Definition:** Extracting data from the target environment. The adversary compresses, encrypts, and transfers stolen data out through C2 channels or alternative protocols.

**Common Tools:** Rclone, DNSExfiltrator, DET framework, custom encrypted archives

**Detection Indicators:**
- Large outbound data transfers during off-hours
- DNS TXT queries with large base64 responses
- Unusual SMTP traffic with attached archives
- Cloud storage API calls (S3, Google Drive, Dropbox) from non-browser user agents
- FTP/SCP transfers from non-standard source systems

**Technique Examples:**
1. **DNS Data Exfiltration** — Encoding data as subdomain DNS queries in small chunks
2. **Exfiltration Over Web Service** — Uploading archives to cloud storage (S3, Dropbox, Google Drive)
3. **Data Encrypted for Impact (T1486)** — Ransomware-style encryption to cover exfiltration

---

## Sources

- [RedTeam-Tactics-and-Techniques — ired.team](https://github.com/mantvydasb/RedTeam-Tactics-and-Techniques)
- MITRE ATT&CK Techniques: [attack.mitre.org](https://attack.mitre.org)
- [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team)
- [Awesome Red Teaming — resource list](https://github.com/yeyintminthuhtut/Awesome-Red-Teaming)
