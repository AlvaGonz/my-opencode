# Timeline Patterns

6 common timeline orchestration patterns for anime.js v4.

Sources: [github/juliangarnier/anime](https://github.com/juliangarnier/anime), [animejs.com/documentation](https://animejs.com/documentation), [davidosemwegie/animejs-best-practices](https://github.com/davidosemwegie/animejs-best-practices/examples/timeline-sequence.js).

---

## 1. Sequential Timeline

**When to use**: Animations that must play one after another in strict order (page entrance sequences, step-by-step tutorials).

### Code Example

```ts
import { createTimeline } from 'animejs';

const tl = createTimeline({
  defaults: { duration: 600, ease: 'outExpo' },
});

tl.add('.header',   { translateY: [-50, 0], opacity: [0, 1] })
  .add('.content',  { translateY: [30, 0],  opacity: [0, 1] })
  .add('.footer',   { opacity: [0, 1] });
```

| Child | Offset | Absolute Start |
|-------|--------|----------------|
| `.header` | `0` | 0ms |
| `.content` | end of `.header` | 600ms |
| `.footer` | end of `.content` | 1200ms |

### Common Mistake

```ts
// BAD: Forgetting that omission = after previous ends, not at same time
tl.add('.a', { ... })  // starts at 0
  .add('.b', { ... })  // starts at end of .a
  .add('.c', { ... }); // starts at end of .b

// If you want them all at once, use relative position "0"
tl.add('.a', { ... })
  .add('.b', { ... }, 0)
  .add('.c', { ... }, 0);
```

---

## 2. Parallel Timeline

**When to use**: Multiple elements animating simultaneously (confetti burst, hero section entrance where all parts appear together).

### Code Example

```ts
import { createTimeline } from 'animejs';

const tl = createTimeline({
  defaults: { duration: 800, ease: 'outExpo' },
});

// All three start at same time (position 0)
tl.add('.bg',    { scale: [1.2, 1] }, 0)
  .add('.title', { translateY: [30, 0], opacity: [0, 1] }, 0)
  .add('.cta',   { scale: [0.8, 1], opacity: [0, 1] }, 0);
```

| Child | Offset | Start |
|-------|--------|-------|
| `.bg` | `0` | 0ms |
| `.title` | `0` | 0ms |
| `.cta` | `0` | 0ms |

### Common Mistake

```ts
// BAD: Timeline duration doesn't auto-expand correctly if using position "0"
// when animations have different durations — use `.defaults` to standardize or
// set per-animation duration in params
tl.add('.slow', { translateX: 200, duration: 2000 }, 0)
  .add('.fast', { translateX: 200, duration: 200 }, 0);
// .fast finishes at 200ms, .slow at 2000ms — timeline waits for .slow
```

---

## 3. Overlapping Timeline

**When to use**: Cascading reveals where animations start before the previous one finishes (card stacks, layered UI transitions, list reveals with overlap).

### Code Example

```ts
import { createTimeline } from 'animejs';

const tl = createTimeline({
  defaults: { duration: 800, ease: 'outExpo' },
});

// Each starts 400ms before the previous ends
tl.add('.box-1', { translateX: 200 })
  .add('.box-2', { translateX: 200 }, '-=400')
  .add('.box-3', { translateX: 200 }, '-=400')
  .add('.box-4', { translateX: 200 }, '-=400');
```

| Child | Offset | Start | End |
|-------|--------|-------|-----|
| `.box-1` | `0` | 0ms | 800ms |
| `.box-2` | `-=400` | 400ms | 1200ms |
| `.box-3` | `-=400` | 800ms | 1600ms |
| `.box-4` | `-=400` | 1200ms | 2000ms |

### Common Mistake

```ts
// BAD: Overlapping too much creates a pile-up
// `-=700` with 800ms duration leaves only 100ms gap — elements barely move
// before the next starts. Keep overlap within 30-50% of duration.
tl.add('.a', { duration: 800 }, '-=700');  // Only 100ms of solo time
```

---

## 4. Looping Timeline

**When to use**: Continuous animations (loading spinners, pulsing notifications, marquee text, ambient motion).

### Code Example

```ts
import { createTimeline } from 'animejs';

// Infinite spinner
const tl = createTimeline({
  loop: true,
  defaults: { ease: 'linear' },
});

tl.add('.dot-1', { scale: [1, 1.5, 1], duration: 600 })
  .add('.dot-2', { scale: [1, 1.5, 1], duration: 600 })
  .add('.dot-3', { scale: [1, 1.5, 1], duration: 600 });

// With alternate
const pulse = createTimeline({
  loop: true,
  alternate: true,
  defaults: { duration: 1000, ease: 'inOutQuad' },
});

pulse.add('.pulse-ring', { scale: [1, 1.2], opacity: [0.8, 0.4] });
```

### Common Mistake

```ts
// BAD: Forgetting alternate means it snaps back
createTimeline({
  loop: true,
  // Missing alternate: true — the element will jump back to start each loop
});

// BAD: loopDelay with loop — if you want a pause between loops
createTimeline({
  loop: true,
  // loopDelay is a timeline-level setting
  // But it only applies at the TIMELINE level, not per-child
});
```

---

## 5. Reversible Timeline

**When to use**: UI that needs to play forward and backward (accordion panels, expand/collapse, modal open/close, hamburger menu transitions).

### Code Example

```ts
import { createTimeline } from 'animejs';

function createToggleTimeline() {
  const tl = createTimeline({
    autoplay: false,   // Don't auto-play
    defaults: { duration: 400, ease: 'outExpo' },
  });

  tl.add('.menu-panel', { translateX: [-300, 0], opacity: [0, 1] })
    .add('.menu-item', {
      translateX: [-20, 0],
      opacity: [0, 1],
      delay: stagger(50),
    }, '-=200');

  return {
    open: () => { tl.reversed = false; tl.play(); },
    close: () => { tl.reversed = true; tl.play(); },
    toggle: () => { tl.reversed ? tl.play() : tl.reverse(); },
  };
}

const menu = createToggleTimeline();
menu.open();   // Plays forward
menu.close();  // Plays reverse
```

### Common Mistake

```ts
// BAD: Calling .reverse() on a completed timeline does nothing
// .reverse() reverses playback direction but if already at end,
// it stays at end. Always check state or use .seek(0) first.
if (tl.completed) tl.seek(tl.duration);
tl.reverse();
tl.play();

// BAD: Not setting autoplay: false for controlled toggles
const tl = createTimeline({ /* autoplay: true by default */ });
// Timeline starts immediately. Then .reverse() doesn't work as expected.
```

---

## 6. Chained / Staggered Timeline

**When to use**: Complex multi-phase entrances with stagger within phases (page load sequences, feature reveals, step-by-step highlighting).

### Code Example

```ts
import { createTimeline, stagger } from 'animejs';

const tl = createTimeline({
  defaults: { duration: 500, ease: 'outQuad' },
  autoplay: false,
});

// Phase 1: Section title
tl.add('.section-title', {
  translateY: [30, 0],
  opacity: [0, 1],
})
// Phase 2: Cards stagger in (overlap with phase 1 end)
.label('cardsStart')
.add('.card', {
  translateY: [40, 0],
  opacity: [0, 1],
  delay: stagger(80),
}, 'cardsStart')
// Phase 3: Button appears after cards
.label('ctaPhase')
.add('.cta-button', {
  scale: [0.8, 1],
  opacity: [0, 1],
}, 'ctaPhase+=200');

// Usage
await tl.play();

// Or chain with promises
await tl.then(() => console.log('Phase 1 complete'));
```

| Phase | Label | Start | Duration |
|-------|-------|-------|----------|
| Title | auto | 0ms | 500ms |
| Cards | `cardsStart` | 500ms | 500ms + stagger(80) × N |
| CTA | `ctaPhase` | ~1300ms | 500ms |

### Common Mistake

```ts
// BAD: stagger() works differently in timelines vs standalone
// In timeline .add(), stagger() controls POSITION staggering,
// not delay staggering.
tl.add('.item', {
  opacity: [0, 1],
  // delay: stagger(50) — this does NOT stagger in timeline context
  // The stagger(50) in the 3rd arg of .add() controls position
});

// CORRECT: stagger position in timeline
tl.add('.item', { opacity: [0, 1] }, stagger(50, { from: 'center' }));

// STANDALONE: stagger delay
waapi.animate('.item', {
  opacity: [0, 1],
  delay: stagger(50),  // This IS correct for standalone
});
```

---

## Quick Reference: `.add()` Position Values

| Position | Effect |
|----------|--------|
| *(omitted)* | Start after previous animation ends |
| `0` | Start at timeline start |
| `500` | Start at absolute 500ms |
| `'-=300'` | Start 300ms before previous ends |
| `'+=200'` | Start 200ms after previous ends |
| `'labelName'` | Start at label position |
| `'labelName-=100'` | Start 100ms before label |
| `'labelName+=300'` | Start 300ms after label |
| `stagger(100)` | Each child starts 100ms after previous |
| `stagger(50, { from: 'center' })` | Stagger out from center index |

## Common Mistakes Summary

| Mistake | Fix |
|---------|-----|
| Forgetting `autoplay: false` on controlled timelines | Add `autoplay: false` to constructor |
| Overlapping >50% of duration | Keep `-=N` within 30-50% of child duration |
| Using `delay: stagger()` in timeline `.add()` | Use stagger as 3rd position arg instead |
| Calling `.reverse()` when at end | Seek to end first: `tl.seek(tl.duration)` then `.reverse()` |
| Not using labels for complex timing | Use `.label()` to create named checkpoints |
| Mismatched `defaults` across children | Set `defaults` in constructor for consistency |
