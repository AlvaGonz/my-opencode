# Scroll-Triggered Animations

Scroll-driven animations using anime.js v4's `ScrollObserver` + `IntersectionObserver`.

Sources: [animejs.com/documentation/events/onscroll](https://animejs.com/documentation/events/onscroll), [davidosemwegie/animejs-best-practices](https://github.com/davidosemwegie/animejs-best-practices), [juliangarnier/anime](https://github.com/juliangarnier/anime).

---

## Table of Contents

1. [ScrollObserver API](#scrollobserver-api)
2. [Fade-in-Up on Scroll](#1-fade-in-up-on-scroll)
3. [Staggered Card Reveal](#2-staggered-card-reveal)
4. [Parallax Background](#3-parallax-background)
5. [Progress-Based Scrubbing](#4-progress-based-scrubbing)
6. [Direction-Aware Reveal](#5-direction-aware-reveal)
7. [Horizontal Scroll Section](#6-horizontal-scroll-section)
8. [Timeline Synced to Scroll](#7-timeline-synced-to-scroll)

---

## ScrollObserver API

### Signature

```ts
new ScrollObserver(targets: DOMTargetsParam, params: ScrollObserverParams): ScrollObserver
```

### Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `Element` | scroll container | Scroll container element |
| `target` | `Element` | container | Element for position calculations |
| `axis` | `'y' \| 'x'` | `'y'` | Scroll axis |
| `repeat` | `boolean` | `false` | Re-trigger on scroll direction change |
| `debug` | `boolean` | `false` | Visual debug indicators |
| `sync` | `Animation \| Timeline` | — | Link animation progress to scroll |

### Thresholds

| Type | Example | Description |
|------|---------|-------------|
| Numeric | `0.5` | Trigger when 50% visible |
| Array | `[0, 0.5, 1]` | Multiple thresholds |
| Position shorthand | `'start'`, `'center'`, `'end'` | Named positions |
| Relative pair | `['start', 'end']` | Full scroll range |
| Object | `{ min: 0.2, max: 0.8 }` | Min/max range |

### Callbacks

| Callback | Signature | Trigger |
|----------|-----------|---------|
| `onEnter` | `(elements, entry) => void` | Element enters viewport |
| `onEnterForward` | `(elements, entry) => void` | Enter while scrolling down |
| `onEnterBackward` | `(elements, entry) => void` | Enter while scrolling up |
| `onLeave` | `(elements, entry) => void` | Element leaves viewport |
| `onLeaveForward` | `(elements, entry) => void` | Leave while scrolling down |
| `onLeaveBackward` | `(elements, entry) => void` | Leave while scrolling up |
| `onUpdate` | `(elements, progress) => void` | Every scroll frame (0–1) |
| `onSyncComplete` | `(animation) => void` | Linked animation finishes |

### Methods

| Method | Description |
|--------|-------------|
| `.link(animation)` | Link animation to scroll sync |
| `.refresh()` | Recalculate element positions |
| `.revert()` | Destroy observer |

---

## 1. Fade-in-Up on Scroll

**Pattern**: Elements start invisible and slightly below, then fade+slide up when scrolled into view.

### ScrollObserver Approach (Recommended)

```ts
import { ScrollObserver, waapi } from 'animejs';

new ScrollObserver('.reveal', {
  onEnter: (elements) => {
    waapi.animate(elements, {
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      ease: 'outExpo',
    });
  },
});
```

### IntersectionObserver Fallback

```ts
import { waapi } from 'animejs';

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      waapi.animate(entry.target, {
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        ease: 'outExpo',
      });
      observer.unobserve(entry.target); // Fire once
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
```

### Key Points

| Aspect | Detail |
|--------|--------|
| Initial state | Set via from-to array `[0, 1]` — no need for manual CSS |
| Trigger once | Default `repeat: false` in ScrollObserver, or call `.revert()` |
| Duration | 600–800ms recommended for entrance animations |
| Easing | `outExpo` gives a natural deceleration feel |

---

## 2. Staggered Card Reveal

**Pattern**: A container of cards that stagger-reveals each card when scrolled into view.

```ts
import { ScrollObserver, waapi, stagger } from 'animejs';

new ScrollObserver('.card-grid', {
  onEnter: () => {
    waapi.animate('.card', {
      opacity: [0, 1],
      translateY: [40, 0],
      delay: stagger(75, { from: 'first' }),
      duration: 600,
      ease: 'outQuad',
    });
  },
});
```

### Grid Stagger Variant

```ts
new ScrollObserver('.masonry-grid', {
  onEnter: () => {
    waapi.animate('.grid-item', {
      scale: [0.8, 1],
      opacity: [0, 1],
      delay: stagger(50, {
        grid: [4, 3],
        from: 'center',
      }),
      duration: 500,
      ease: 'outBack',
    });
  },
});
```

### Key Points

| Aspect | Detail |
|--------|--------|
| Stagger delay | 50–100ms typical — lower for subtle, higher for dramatic |
| `from: 'center'` | Reveal from middle of grid outward |
| `from: 'first'` | Reveal left-to-right, top-to-bottom |
| Duration per item | 400–600ms |

---

## 3. Parallax Background

**Pattern**: Background moves at a slower rate than scroll, creating depth.

### Manual onUpdate Approach

```ts
import { ScrollObserver } from 'animejs';

new ScrollObserver('.parallax-section', {
  onUpdate: (elements, progress) => {
    // progress: 0 (not visible) → 0.5 (center) → 1 (fully past)
    const offset = (progress - 0.5) * 200; // -100px to +100px
    elements.forEach((el) => {
      (el as HTMLElement).style.transform = `translateY(${offset}px)`;
    });
  },
});
```

### Speed-Based Parallax

```ts
function createParallax(selector: string, speed: number = 0.3) {
  return new ScrollObserver(selector, {
    onUpdate: (elements, progress) => {
      const offset = (progress - 0.5) * 200 * speed;
      elements.forEach((el) => {
        (el as HTMLElement).style.transform = `translateY(${offset}px)`;
      });
    },
  });
}

// Usage
createParallax('.hero-bg', 0.3);    // Slow — background
createParallax('.mid-layer', 0.6);  // Medium — midground
createParallax('.foreground', 1.0); // Full — foreground
```

### Key Points

| Aspect | Detail |
|--------|--------|
| Transform, not margin | Use `transform: translateY()` for GPU acceleration |
| Speed range | 0.1 (barely moves) to 1.0 (normal scroll) |
| Progress range | 0 to 1 across the entire scroll through section |

---

## 4. Progress-Based Scrubbing

**Pattern**: An animation state is directly tied to scroll progress (0%–100%). Unlike the `sync` approach, this uses `onUpdate` for manual control.

### Progress Bar

```ts
import { ScrollObserver } from 'animejs';

new ScrollObserver('.article-body', {
  onUpdate: (elements, progress) => {
    const bar = document.querySelector('.reading-progress');
    if (bar) {
      (bar as HTMLElement).style.width = `${progress * 100}%`;
    }
  },
});
```

### Opacity/Scale Scrubbing

```ts
new ScrollObserver('.fade-section', {
  onUpdate: (elements, progress) => {
    // Fade in during first 50% of scroll, stay visible
    const opacity = Math.min(1, progress * 2);
    const scale = 0.8 + progress * 0.2;
    elements.forEach((el) => {
      (el as HTMLElement).style.opacity = String(opacity);
      (el as HTMLElement).style.transform = `scale(${scale})`;
    });
  },
});
```

### Image Reveal (Clip Mask)

```ts
new ScrollObserver('.image-reveal', {
  onUpdate: (elements, progress) => {
    elements.forEach((el) => {
      (el as HTMLElement).style.clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
    });
  },
});
```

### Key Points

| Aspect | Detail |
|--------|--------|
| `progress` | Always 0–1 based on element position in viewport |
| Performance | Avoid layout-triggering properties (use transforms + opacity) |
| Smoothing | For non-sync mode, values update every scroll frame (60fps) |

---

## 5. Direction-Aware Reveal

**Pattern**: Animation direction depends on scroll direction (up vs down). Uses `repeat: true` for re-triggering.

```ts
import { ScrollObserver, waapi } from 'animejs';

new ScrollObserver('.direction-card', {
  repeat: true, // Re-trigger when scrolling back

  onEnterForward: (elements) => {
    // Scrolling down — slide up
    waapi.animate(elements, {
      opacity: [0, 1],
      translateY: [50, 0],
      duration: 600,
      ease: 'outExpo',
    });
  },

  onEnterBackward: (elements) => {
    // Scrolling up — slide down
    waapi.animate(elements, {
      opacity: [0, 1],
      translateY: [-50, 0],
      duration: 600,
      ease: 'outExpo',
    });
  },

  onLeaveForward: (elements) => {
    // Exiting down — slide up out
    waapi.animate(elements, {
      opacity: [1, 0],
      translateY: [0, -30],
      duration: 400,
      ease: 'inQuad',
    });
  },

  onLeaveBackward: (elements) => {
    // Exiting up — slide down out
    waapi.animate(elements, {
      opacity: [1, 0],
      translateY: [0, 30],
      duration: 400,
      ease: 'inQuad',
    });
  },
});
```

### Key Points

| Aspect | Detail |
|--------|--------|
| `repeat: true` | Required for multiple triggers in both directions |
| Directional callbacks | Use `onEnterForward` / `onEnterBackward` for direction-aware enter |
| Exit animations | Use `onLeaveForward` / `onLeaveBackward` for exit effects |

---

## 6. Horizontal Scroll Section

**Pattern**: A section that scrolls horizontally as the user scrolls vertically.

```ts
import { ScrollObserver } from 'animejs';

function createHorizontalScroll(
  sectionSelector: string,
  contentSelector: string
) {
  const section = document.querySelector(sectionSelector) as HTMLElement;
  const content = document.querySelector(contentSelector) as HTMLElement;

  return new ScrollObserver(section, {
    onUpdate: (elements, progress) => {
      const maxScroll = content.scrollWidth - section.clientWidth;
      content.style.transform = `translateX(-${progress * maxScroll}px)`;
    },
  });
}

// Usage
createHorizontalScroll('.horizontal-section', '.horizontal-content');
```

### Key Points

| Aspect | Detail |
|--------|--------|
| Container | Needs `overflow: hidden` and a fixed height for scroll activation |
| Content | Should be wider than container (`width: max-content` or flex + nowrap) |
| Progress | 0 = start, 1 = fully scrolled horizontally |

---

## 7. Timeline Synced to Scroll

**Pattern**: A full timeline is linked to scroll progress using `sync`. The timeline plays forward/backward as the user scrolls.

### Basic Synced Timeline

```ts
import { createTimeline, ScrollObserver } from 'animejs';

// Create a timeline that does NOT autoplay
const tl = createTimeline({
  autoplay: false,
  defaults: { duration: 500, ease: 'outQuad' },
});

tl.add('.step-1', { opacity: [0, 1], translateY: [30, 0] })
  .add('.step-2', { opacity: [0, 1], translateX: [-30, 0] })
  .add('.step-3', { opacity: [0, 1], scale: [0.9, 1] });

// Sync timeline to scroll
new ScrollObserver('.scroll-story', {
  sync: tl,  // Timeline progress = scroll progress
});
```

### With Smooth Easing

```ts
const anim = waapi.animate('.animated-element', {
  translateX: [0, 300],
  rotate: [0, 360],
  autoplay: false,
});

new ScrollObserver('.trigger-zone', {
  sync: {
    animation: anim,
    smooth: 0.1,      // Smoothing factor (0–1, lower = smoother)
    ease: 'outQuad',  // Easing for the scroll->animation mapping
  },
});
```

### Method-Based Sync

```ts
const anim = waapi.animate('.box', {
  translateX: [0, 500],
  autoplay: false,
});

new ScrollObserver('.scroll-area', {
  // Use method names for sync mode
  sync: 'playbackProgress',  // Default — maps scroll 0-1 to animation 0-1
  // sync: 'methodName' — other sync modes available
});
```

### Sync Modes

| Mode | Behavior |
|------|----------|
| `'playbackProgress'` | Scroll progress maps to animation progress (default) |
| `'smoothScroll'` | Animation smooth-follows scroll with easing |
| `'easedScroll'` | Animation follows scroll with custom easing |

### Linked Animation with `link()`

```ts
const observer = new ScrollObserver('.section');
const anim = waapi.animate('.box', {
  translateX: [0, 400],
  autoplay: false,
});

observer.link(anim); // Alternative to `sync` in constructor
```

### Key Points

| Aspect | Detail |
|--------|--------|
| `autoplay: false` | Required on the animation/timeline when syncing |
| `persist: true` | WAAPI animations need persist for scroll sync to work |
| Smoothing | Use `smooth: 0.1` for buttery scroll-linked animations |
| Cleanup | Call `observer.revert()` and `anim.cancel()` on unmount |

---

## Comparison: ScrollObserver vs IntersectionObserver

| Feature | ScrollObserver (anime.js) | IntersectionObserver (native) |
|---------|---------------------------|-------------------------------|
| Bundle cost | Included in anime.js | Zero (native browser API) |
| Progress callback | `onUpdate(elements, progress)` with 0–1 | Not available — only boolean isIntersecting |
| Direction awareness | `onEnterForward`, `onEnterBackward` | Manual tracking needed |
| Animation sync | `sync: animation` built-in | Manual progress calculation |
| Repeat | `repeat: true` parameter | `rootMargin` hacks needed |
| Dependencies | Requires anime.js | No dependencies |

### When to Use Each

```ts
// Use ScrollObserver when:
// - Need scroll progress (0–1) values
// - Syncing animations to scroll
// - Direction-aware reveals
// - Already using anime.js in project

// Use IntersectionObserver when:
// - Simple one-shot reveals only
// - Zero-dependency requirement
// - Need broader browser support (older browsers)
// - Animating with CSS transitions, not JS
```

---

## Complete Example: Scroll-Activated Page

```ts
import { ScrollObserver, waapi, stagger, createTimeline } from 'animejs';

// 1. Hero parallax
createScrollAnimation('.hero-bg', {
  onUpdate: (els, p) => {
    els.forEach(el => (el as HTMLElement).style.transform = `translateY(${(p - 0.5) * 100}px)`);
  },
});

// 2. Fade-in sections
document.querySelectorAll('.fade-section').forEach((section) => {
  new ScrollObserver(section as HTMLElement, {
    onEnter: (els) => {
      waapi.animate(els, { opacity: [0, 1], translateY: [30, 0], duration: 800, ease: 'outExpo' });
    },
  });
});

// 3. Staggered card reveal
new ScrollObserver('.card-grid', {
  onEnter: () => {
    waapi.animate('.card', {
      opacity: [0, 1],
      translateY: [30, 0],
      delay: stagger(60),
      duration: 500,
      ease: 'outQuad',
    });
  },
});

// 4. Reading progress bar
new ScrollObserver('article', {
  onUpdate: (_, p) => {
    document.querySelector('.progress-bar')!.style.width = `${p * 100}%`;
  },
});

// 5. Synced timeline
const tl = createTimeline({ autoplay: false, defaults: { duration: 600, ease: 'outExpo' } });
tl.add('.chart-bar-1', { height: ['0%', '80%'] })
  .add('.chart-bar-2', { height: ['0%', '60%'] }, '-=400')
  .add('.chart-bar-3', { height: ['0%', '90%'] }, '-=400');

new ScrollObserver('.chart-section', { sync: tl });
```
