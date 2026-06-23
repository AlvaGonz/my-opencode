---
name: animejs-animation
description: Create and manage anime.js animations including timelines, scroll-triggered effects, staggered elements, and SVG path morphing with performance optimization.
trigger: "when the user asks to animate an element, build an animation timeline, add scroll-triggered animations, stagger elements, or morph SVG paths using anime.js"
scope: frontend-animation
version: "1.0"
sources:
  - https://github.com/juliangarnier/anime
  - https://github.com/davidosemwegie/animejs-best-practices
---

# animejs-animation Skill

Anime.js v4 is a fast, multipurpose JavaScript animation engine. This skill provides helpers, easing presets, and reference docs for building animations with anime.js v4.

## Purpose

- Generate correct anime.js v4 code with proper imports, timing (always ms), and API usage
- Provide reusable animation helpers (timelines, stagger, scroll-reveal, SVG morph)
- Document the full v4 API surface including `waapi`, `createTimeline`, `createScope`, `ScrollObserver`, and utilities
- Enforce best practices (WAAPI-first, milliseconds not seconds, accessibility)

## How to Use

1. **Reference files** in `references/` for API signatures, timeline patterns, and scroll animations
2. **Helper functions** in `scripts/animation-helpers.ts` for common patterns
3. **Easing presets** in `assets/easing-presets.json` for all named easing functions
4. Always confirm whether the user needs `waapi.animate()` (hardware-accelerated, lighter) or `animate()` (JS engine, for SVG morphing, JS objects, 500+ targets)

## File Structure

| Path | Description |
|------|-------------|
| `SKILL.md` | This file |
| `scripts/animation-helpers.ts` | TypeScript utilities: `createTimeline`, `staggerElements`, `scrollReveal`, `morphSVG` |
| `assets/easing-presets.json` | Complete map of named easing functions to their CSS representations |
| `references/v4-api-cheatsheet.md` | Full v4 API reference: `animate()`, `timeline()`, `stagger()`, `createScope()`, `createDraggable()`, `createSpring()`, SVG, text |
| `references/timeline-patterns.md` | 6 timeline patterns with code examples and common mistakes |
| `references/scroll-animations.md` | Scroll-triggered animations with `ScrollObserver` + IntersectionObserver |

## Gotchas

| Issue | Detail |
|-------|--------|
| **Time units** | Anime.js v4 uses **milliseconds** everywhere. `duration: 2000` = 2s, not `duration: 2`. A duration of `2` = 2ms (invisible). |
| **WAAPI vs JS engine** | `waapi.animate()` (3KB) is hardware-accelerated but can't animate JS objects, SVG `d` attributes, or 500+ targets. Use `animate()` for those cases. |
| **Individual transforms** | `waapi` uses individual CSS transforms (via `CSS.registerProperty`). Animate `translateX`, `rotate`, `scale` separately — they compose. |
| **Spring easings** | `spring({ bounce: 0.25, duration: 800 })` — spring is NOT a string, it's an object passed to the `ease` property. |
| **stagger() grid** | `stagger(50, { grid: [cols, rows], from: 'center' })` — grid stagger calculates distance from center in 2D space. |
| **scroll sync** | You can sync an animation to scroll progress via `ScrollObserver` with `{ sync: animation }` — the animation progress follows the scroll position. |
| **splitText** | Always use `splitText()` over manual string splitting — it handles accessibility, whitespace, and provides `chars`, `words`, `lines` arrays. |
| **Cleanup** | Call `.cancel()` or `.revert()` on unmount in React/Next.js components to prevent memory leaks. |

## Sources

- [juliangarnier/anime](https://github.com/juliangarnier/anime) — v4.x, MIT license
- [davidosemwegie/animejs-best-practices](https://github.com/davidosemwegie/animejs-best-practices) — best practices skill for AI coding assistants
- [animejs.com/documentation](https://animejs.com/documentation) — official v4 docs
