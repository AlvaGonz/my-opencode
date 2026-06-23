---
name: web-coder
description: "Web platform knowledge reference covering web standards, HTTP protocols, browser APIs, and cross-browser compatibility. Use when the user needs authoritative information about W3C/WHATWG specs, HTTP semantics, web API behavior, browser engine differences, or web terminology. NOT for implementing UI components, styling, accessibility audits, SEO, or backend services — those have separate skills."
---

# Web Platform Knowledge Reference

This skill is a **reference** for web platform internals, standards, and protocols. It does not cover UI implementation, styling, accessibility auditing, SEO optimization, or backend services — those are handled by `frontend-design`, `accessibility`, `seo`, and `backend-dev-guidelines` respectively.

Use this skill when you need to understand or verify:
- W3C and WHATWG specification behavior
- HTTP/HTTPS protocol semantics and headers
- Web API contracts (DOM, Fetch, WebSocket, WebRTC, Storage, etc.)
- Browser engine differences and rendering pipeline
- Web security primitives (CORS, CSP, Same-Origin Policy)
- Data formats, MIME types, and character encoding
- Cross-browser compatibility matrix

## Core Knowledge Areas

### 1. Web Standards & Specifications
- W3C (HTML, CSS, DOM, ARIA, MathML)
- WHATWG (HTML Living Standard, Fetch, Streams, URL, Console)
- ECMA TC39 (ECMAScript specification, proposal stages)
- IETF (HTTP, TLS, WebSocket, QUIC, DNS)
- ISO/IEC (JPEG, MPEG, character encoding standards)

### 2. HTTP & Networking
- HTTP/1.1, HTTP/2, HTTP/3 protocol differences
- Request methods (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)
- Status codes by category (1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error)
- Headers: request, response, entity, and hop-by-hop vs end-to-end
- Caching semantics (Cache-Control, ETag, Last-Modified, Vary)
- Content negotiation (Accept, Content-Type, Accept-Language)
- Connection management (keep-alive, pipelining, multiplexing)

### 3. Web APIs & Platform Features
- DOM API (Node, Element, Document, Event, MutationObserver)
- Fetch API (Request, Response, Headers, AbortController)
- WebSocket API (handshake, frames, close codes)
- WebRTC (signaling, ICE/STUN/TURN, media streams, data channels)
- Storage APIs (localStorage, sessionStorage, IndexedDB, Cache Storage)
- Service Workers (lifecycle, install/activate/fetch events, cache strategies)
- Performance APIs (Navigation Timing, Resource Timing, PerformanceObserver, Long Tasks)
- Web Workers (dedicated, shared, service — scope and communication)
- Canvas 2D and WebGL APIs
- Web Crypto API (SubtleCrypto, key generation, encryption primitives)

### 4. Browser Engines & Rendering
| Engine | Browsers | Rendering Pipeline |
|--------|----------|-------------------|
| Blink | Chrome, Edge 79+, Opera, Brave, Samsung Internet | HTML parse → style → layout → paint → composite |
| Gecko | Firefox, Tor Browser | Similar pipeline, different threading model |
| WebKit | Safari, iOS browsers | Similar pipeline, GPU-accelerated compositing |
| Goanna | Pale Moon, Basilisk | Gecko fork, legacy HTML parser |

Key rendering concepts: DOM/CSSOM trees, render tree, layout/reflow, painting, compositing layers, repaint vs reflow triggers, hardware acceleration.

### 5. Web Security Primitives
- Same-Origin Policy (origin = scheme + host + port)
- Cross-Origin Resource Sharing (preflight, simple requests, credentials)
- Content Security Policy (directives, reporting, nonces/hashes)
- Subresource Integrity (integrity attribute, hash verification)
- Cross-Site Request Forgery (same-site cookies, CSRF tokens, SameSite attribute)
- Cross-Site Scripting prevention (encoding, sanitization, Trusted Types)
- HTTPS/TLS (handshake, certificate validation, HSTS)
- Permissions Policy (feature control via header and iframe allow)

### 6. Data Formats & Encoding
- JSON (parse/stringify, serialization quirks, security considerations)
- Base64 (encoding, URL-safe variant, when to use/not use)
- Character encoding (UTF-8, UTF-16, ASCII, byte order marks)
- MIME types (IANA media types, multipart boundaries, content sniffing prevention)
- URL encoding (percent-encoding, punycode for IDN, URL canonicalization)

## Common Terminology Map

| Colloquial Term | Technical Equivalent | Spec Reference |
|----------------|---------------------|----------------|
| "AJAX call" | Fetch API or XMLHttpRequest | Fetch Standard |
| "Same origin" | scheme + host + port match | HTML Standard §7.5 |
| "The cloud" | Remote server accessed via HTTPS | — |
| "SSL certificate" | TLS certificate (SSL is deprecated) | RFC 8446 |
| "Back button" | Joint session history | HTML Standard §7.7 |
| "DOM ready" | DOMContentLoaded event | HTML Standard §8.1.2 |
| "Hashbang URL" | SPA route with `#!` | URL Standard §4.3 |

## Browser Compatibility Quick Reference

### Safe to Use (all modern browsers)
- Fetch API (with AbortController)
- ES Modules (`<script type="module">`)
- CSS Grid and Flexbox
- CSS Custom Properties
- Web Animations API
- IntersectionObserver
- ResizeObserver
- `loading="lazy"` for images/iframes

### Check Compatibility First
- WebGPU (Chrome 113+, Firefox nightly, Safari experimental)
- Declarative Shadow DOM (Chrome 111+, Safari 16.4+)
- View Transitions API (Chrome 111+, Safari not yet)
- CSS `:has()` selector (Firefox 121+, all others supported)
- Import maps (Chrome 89+, Firefox 108+, Safari 16.4+)

### Deprecated / Removed
- `XMLHttpRequest.withCredentials` (still works but Fetch is preferred)
- `HTMLImports` (removed, use ES modules)
- `KeyboardEvent.keyCode` (deprecated, use `.key` or `.code`)
- `SVGElement.offset*` properties (removed from SVG)
- `window.showModalDialog()` (removed from all browsers)

## Troubleshooting Web Platform Issues

| Problem | Likely Cause | Diagnosis |
|---------|-------------|-----------|
| CORS error in console | Missing `Access-Control-Allow-Origin` header | Check response headers in Network tab |
| Mixed content warning | HTTP resource on HTTPS page | Use `https://` or protocol-relative URLs |
| `SameSite=None` cookie blocked | Missing `Secure` flag | Add `Secure` to cookie when using `SameSite=None` |
| Preflight OPTIONS request fails | CORS preflight rejected | Check server CORS config for allowed methods |
| Service Worker not activating | Waiting for existing tabs to close | Call `self.skipWaiting()` and `clients.claim()` |
| `localStorage` quota exceeded | Store is full (typically 5-10MB) | Use IndexedDB for larger data |
| WebSocket connection drops | Idle timeout or proxy disconnection | Implement reconnection with backoff |
| iframe content not loading | `X-Frame-Options: DENY` or `frame-ancestors` | Check response headers from embedded content |

## Sources
- [HTML Living Standard](https://html.spec.whatwg.org/) — WHATWG
- [Fetch Living Standard](https://fetch.spec.whatwg.org/) — WHATWG
- [URL Living Standard](https://url.spec.whatwg.org/) — WHATWG
- [HTTP Semantics](https://httpwg.org/specs/rfc9110.html) — IETF
- [Content Security Policy](https://w3c.github.io/webappsec-csp/) — W3C
- [CORS Protocol](https://fetch.spec.whatwg.org/#http-cors-protocol) — WHATWG
- [Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) — MDN
- [Can I Use](https://caniuse.com/) — Browser compatibility tables
