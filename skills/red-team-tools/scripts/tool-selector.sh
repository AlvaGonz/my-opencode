#!/usr/bin/env bash
# ==============================================================================
# tool-selector.sh — Red Team Phase Tool Recommender
#
# Derives tool recommendations from:
#   https://github.com/toniblyx/my-arsenal-of-aws-security-tools
#
# Usage:
#   ./tool-selector.sh --phase <phase>
#
# Phases: recon|initial-access|persistence|lateral-movement|exfil|c2
# ==============================================================================
set -euo pipefail

usage() {
    echo "Usage: $0 --phase <phase>"
    echo "Phases: recon, initial-access, persistence, lateral-movement, exfil, c2"
    exit 1
}

# --- Parse arguments ---
if [ $# -ne 2 ] || [ "$1" != "--phase" ]; then
    usage
fi

PHASE="${2,,}"  # lowercase

case "$PHASE" in
    recon)
        cat <<'TOOLS'
=== Reconnaissance ===
Recommended Tool: nmap
  Install:       sudo apt-get install -y nmap  (or brew install nmap)
  Primary Use:   Port scanning, service detection, OS fingerprinting
  Aliases:       masscan (high-speed), rustscan (Rust), zmap (internet-wide)

Recommended Tool: prowler
  Install:       pip install prowler
  Primary Use:   AWS cloud security assessment, CIS benchmark checks

Recommended Tool: cloudsplaining
  Install:       pip install cloudsplaining
  Primary Use:   IAM least-privilege auditing for AWS

Recommended Tool: amass
  Install:       sudo snap install amass  (or brew install amass)
  Primary Use:   Subdomain enumeration, OSINT, DNS recon

Recommended Tool: holehe
  Install:       pip install holehe
  Primary Use:   Email-to-account OSINT correlation
TOOLS
        ;;
    initial-access)
        cat <<'TOOLS'
=== Initial Access ===
Recommended Tool: sliver
  Install:       curl https://sliver.sh/install | sudo bash
  Primary Use:   Phishing payload generation, staged/stageless implants

Recommended Tool: evilginx2
  Install:       git clone https://github.com/kgretzky/evilginx2.git && cd evilginx2 && go build
  Primary Use:   Reverse proxy phishing framework (MFA bypass)

Recommended Tool: set (Social Engineering Toolkit)
  Install:       sudo apt-get install -y set
  Primary Use:   Credential harvesting, spear-phishing campaigns
TOOLS
        ;;
    persistence)
        cat <<'TOOLS'
=== Persistence ===
Recommended Tool: sliver (persist extension)
  Install:       sliver > extensions install persist
  Primary Use:   Service install, scheduled tasks, WMI persistence on implants

Recommended Tool: chisel
  Install:       go install github.com/jpillora/chisel@latest
  Primary Use:   Persistence tunnel over HTTP/SSH for re-access

Recommended Tool: empire
  Install:       git clone https://github.com/BC-SECURITY/Empire.git && cd Empire && ./setup/install.sh
  Primary Use:   PowerShell/post-exploitation agent persistence modules
TOOLS
        ;;
    lateral-movement)
        cat <<'TOOLS'
=== Lateral Movement ===
Recommended Tool: crackmapexec
  Install:       pip install crackmapexec
  Primary Use:   SMB/SSH/WINRM lateral movement, credential spraying

Recommended Tool: impacket
  Install:       pip install impacket
  Primary Use:   psexec, wmiexec, dcomexec — protocol-level lateral movement

Recommended Tool: sliver (pivot)
  Install:       sliver (built-in) > pivots
  Primary Use:   TCP / named-pipe pivoting through existing implants

Recommended Tool: bloodhound-python
  Install:       pip install bloodhound
  Primary Use:   AD relationship mapping to find lateral movement paths
TOOLS
        ;;
    exfil)
        cat <<'TOOLS'
=== Exfiltration ===
Recommended Tool: sliver (socks5 / portfwd)
  Install:       Built into sliver — use `socks5` or `portfwd` commands
  Primary Use:   Proxied exfiltration over mTLS/WireGuard C2 channel

Recommended Tool: rclone
  Install:       sudo apt-get install -y rclone
  Primary Use:   Cloud storage sync (S3, GCS, Azure Blob) for bulk exfil

Recommended Tool: pyminizip
  Install:       pip install pyminizip
  Primary Use:   Password-protected compressed archives before exfil
TOOLS
        ;;
    c2)
        cat <<'TOOLS'
=== C2 Framework ===
Recommended Tool: sliver
  Install:       curl https://sliver.sh/install | sudo bash
  Primary Use:   Multiplayer C2, mTLS/WireGuard/HTTP/DNS, dynamic implants

  Alternative:   Havoc (C++/Qt, Nim implants)
  Install:       git clone https://github.com/HavocFramework/Havoc.git && cd Havoc && make
  Primary Use:   Modern C2 with sleep obfuscation, indirect syscalls

  Alternative:   Covenant (C#, ASP.NET)
  Install:       git clone https://github.com/cobbr/Covenant && cd Covenant && dotnet run
  Primary Use:   .NET-native C2, profile-based staging

  Alternative:   Metasploit (Ruby)
  Install:       curl https://raw.githubusercontent.com/rapid7/metasploit-omnibus/master/config/templates/metasploit-framework-wrappers/msfupdate.erb > msfinstall && chmod +x msfinstall && ./msfinstall
  Primary Use:   Broad exploit ecosystem, staging, post-exploitation
TOOLS
        ;;
    *)
        echo "Error: Unknown phase '$PHASE'"
        usage
        ;;
esac
