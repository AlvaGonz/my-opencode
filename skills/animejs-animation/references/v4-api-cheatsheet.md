# anime.js v4 API Cheatsheet

Full API reference for anime.js v4 (sources: [github](https://github.com/juliangarnier/anime), [documentation](https://animejs.com/documentation)).

## Table of Contents

- [Module Exports](#module-exports)
- [`waapi.animate()`](#waapianimate)
- [`animate()` (JS Engine)](#animate-js-engine)
- [`createTimeline()`](#createtimeline)
- [`stagger()`](#stagger)
- [`createScope()`](#createscope)
- [`createDraggable()`](#createdraggable)
- [`spring()`](#spring)
- [ScrollObserver](#scrollobserver)
- [SVG Utilities](#svg-utilities)
- [Text Utilities](#text-utilities)
- [Engine Configuration](#engine-configuration)

---

## Module Exports

```ts
// Main entry
import {
  animate,          // JS engine animation
  waapi,            // WAAPI (hardware-accelerated) animations
  createTimeline,   // Timeline orchestration
  createScope,      // Scoped animation context
  createDraggable,  // Draggable interaction
  ScrollObserver,   // Scroll-triggered events
  stagger,          // Staggered delay/value function
  splitText,        // Text splitting for animations
  scrambleText,     // Text scrambling effect
  spring,           // Spring easing factory
  cubicBezier,      // Cubic bezier easing
  morphTo,          // SVG path morphing
  createDrawable,   // SVG line drawing
  createMotionPath, // SVG motion path following
  utils,            // Utility functions ($, get, set, random, math)
  svg,              // SVG utilities namespace
  text,             // Text utilities namespace
  easings,          // Easing functions namespace
  engine,           // Global engine config
  globals,          // Global defaults
} from 'animejs';

// Subpath imports (tree-shaking friendly)
import { animate }        from 'animejs/animation';
import { createTimeline } from 'animejs/timeline';
import { stagger }        from 'animejs/utils';
import { splitText }      from 'animejs/text';
import { waapi }          from 'animejs/waapi';
```

---

## `waapi.animate()`

Hardware-accelerated wrapper around the Web Animations API. **Preferred for most CSS animations.** (3KB bundle size vs 10KB for JS engine.)

### Signature

```ts
waapi.animate(targets: DOMTargetsParam, params: WAAPIAnimationParams): WAAPIAnimation
```

### Key Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `targets` | `string \| Element \| NodeList \| Array` | — | CSS selector, DOM element(s), or array |
| `duration` | `number` | `globals.defaults.duration` | Duration in ms |
| `delay` | `number` | `0` | Delay in ms |
| `ease` | `string \| Spring \| Function` | `'linear'` | Easing function |
| `loop` | `boolean \| number` | `1` | `true` = Infinity, `n` = n iterations |
| `alternate` | `boolean` | `false` | Alternate direction on loop |
| `reversed` | `boolean` | `false` | Play in reverse |
| `autoplay` | `boolean` | `true` | Auto-start animation |
| `playbackRate` | `number` | `1` | Speed multiplier |
| `persist` | `boolean` | `false` | Keep final state after cancel |
| `composition` | `string` | `'replace'` | WAAPI composite operation |

### Animatable Properties

| Category | Properties |
|----------|------------|
| Transforms (individual) | `translateX`, `translateY`, `translateZ`, `rotate`, `rotateX`, `rotateY`, `scale`, `scaleX`, `scaleY`, `skew`, `skewX`, `skewY` |
| Transforms (shorthand) | `x`, `y`, `z` (maps to translateX/Y/Z) |
| CSS properties | `opacity`, `width`, `height`, `margin`, `padding`, `top`, `right`, `bottom`, `left`, `borderRadius`, `fontSize`, `backgroundColor`, `color`, `perspective` |
| CSS variables | Any `--custom-property` |
| Color functions | `color-mix()`, `oklch()`, `hsl()` etc. |

### Value Types

```ts
// Absolute value
waapi.animate('.el', { translateX: 200 });

// With units
waapi.animate('.el', { width: '100%' });

// From-to array
waapi.animate('.el', { opacity: [0, 1] });

// Relative values
waapi.animate('.el', { translateY: '+=50' }); // += and -= syntax

// Function-based (per target)
waapi.animate('.el', {
  scale: (el, index) => 1 + index * 0.1,
  delay: (el, index) => index * 100,
});

// Per-property overrides
waapi.animate('.el', {
  translateX: {
    to: 200,
    from: 0,
    duration: 1000,  // Overrides top-level duration
    ease: 'outBack',
    delay: 100,
  },
});
```

### Methods

| Method | Description |
|--------|-------------|
| `.play()` | Start/resume animation |
| `.pause()` | Pause animation |
| `.reverse()` | Reverse direction |
| `.restart()` | Seek to 0 and play |
| `.seek(time)` | Jump to specific time (ms) |
| `.complete()` | Jump to end |
| `.cancel()` | Stop and reset |
| `.revert()` | Revert to original styles |
| `.resume()` | Resume from paused state |
| `.alternate()` | Toggle direction |
| `.stretch(newDuration)` | Change duration |
| `.commitStyles()` | Commit current styles (WAAPI) |
| `.then(callback)` | Promise on complete |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `.currentTime` | `number` | Current playback time (ms) |
| `.duration` | `number` | Total duration (ms) |
| `.progress` | `number` | Progress 0–1 (get/set) |
| `.speed` | `number` | Playback rate (get/set) |
| `.completed` | `boolean` | Whether animation finished |
| `.paused` | `boolean` | Whether paused |
| `.reversed` | `boolean` | Whether in reverse |

### Minimal Example

```ts
import { waapi } from 'animejs';

waapi.animate('.box', {
  translateX: 300,
  rotate: '1turn',
  duration: 1000,
  ease: 'outExpo',
});
```

---

## `animate()` (JS Engine)

Full-featured JS engine animation. Required when WAAPI cannot handle the target (JS objects, SVG `d` attribute, 500+ targets, complex callbacks).

### Signature

```ts
animate(targets: TargetsParam, params: AnimationParams): JSAnimation
```

### When to Use

| Use `animate()` | Reason |
|----------------|--------|
| SVG `d` attribute morphing | Not supported by WAAPI |
| JS Object properties | WAAPI only works with DOM |
| 500+ simultaneous targets | JS engine handles batching |
| `onRender` callback | Per-frame render hook |
| `onBeforeUpdate` callback | Pre-update hook |
| `modifier` function | Value modification |
| `round` property | Round output values |

### Additional Parameters (vs WAAPI)

| Param | Type | Description |
|-------|------|-------------|
| `round` | `number` | Round output to N decimals |
| `modifier` | `(val) => val` | Modify each tween value |
| `onRender` | `(anim) => void` | Called every render frame |
| `onBeforeUpdate` | `(anim) => void` | Called before each update |
| `playbackEase` | `string \| Function` | Ease the overall playback progress |

### Minimal Example

```ts
import { animate } from 'animejs';

// JS Object animation
const obj = { value: 0 };
animate(obj, {
  value: 100,
  duration: 1000,
  onUpdate: () => console.log(obj.value),
});

// SVG morphing
animate('#path', {
  d: 'M10 10 L100 100 L50 200 Z',
  duration: 800,
  ease: 'inOutQuad',
});
```

---

## `createTimeline()`

Orchestrate multiple animations in sequence or overlapping.

### Signature

```ts
createTimeline(params?: TimelineParams): Timeline
```

### Timeline Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `defaults` | `AnimationParams` | `{}` | Default params for all children |
| `loop` | `boolean \| number` | `1` | Loop the entire timeline |
| `alternate` | `boolean` | `false` | Alternate on loop |
| `autoplay` | `boolean` | `true` | Auto-start |
| `playbackEase` | `string` | — | Ease the timeline playback |
| `composition` | `boolean` | `true` | Enable composition rendering |

### Timeline Methods

| Method | Description |
|--------|-------------|
| `.add(targets, params, position)` | Add animation at position |
| `.set(targets, params, position)` | Instant set at position |
| `.call(callback, position)` | Call function at position |
| `.label(name, position)` | Create named label |
| `.sync(animation, position)` | Sync external animation |
| `.remove(targets, property?)` | Remove targets |
| `.play()` | Start/resume |
| `.pause()` | Pause |
| `.reverse()` | Reverse |
| `.restart()` | Restart |
| `.seek(time)` | Seek to time |
| `.complete()` | Complete |
| `.stretch(newDuration)` | Scale duration |
| `.refresh()` | Refresh computed values |
| `.revert()` | Revert all children |
| `.then(callback)` | Promise on complete |

### Time Positioning (3rd arg of `.add()`)

| Syntax | Meaning |
|--------|---------|
| *(omitted)* | Start after previous ends |
| `'-=400'` | Start 400ms before previous ends |
| `'+=200'` | Start 200ms after previous ends |
| `500` | Absolute time from timeline start (ms) |
| `'labelName'` | Start at label position |
| `'labelName+=300'` | Start 300ms after label |
| `stagger(100)` | Stagger position per target |

### Timeline Properties

| Property | Type | Description |
|----------|------|-------------|
| `.duration` | `number` | Total duration |
| `.currentTime` | `number` | Current time |
| `.progress` | `number` | Progress 0–1 |
| `.iterationDuration` | `number` | Duration of one iteration |
| `.labels` | `Record<string, number>` | Named label positions |
| `.defaults` | `DefaultsParams` | Default child params |

### Minimal Example

```ts
import { createTimeline } from 'animejs';

const tl = createTimeline({
  defaults: { duration: 600, ease: 'outExpo' },
});

tl.add('.box-1', { translateX: 200 })
  .add('.box-2', { translateX: 200 }, '-=400')
  .add('.box-3', { scale: 1.5 }, '+=200');

tl.play();
```

---

## `stagger()`

Creates staggered delays or values across multiple targets.

### Signature

```ts
stagger(val: number | string | [number, number], params?: StaggerParams): StaggerFunction
```

### Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `val` | `number \| string \| [number,number]` | — | Stagger increment or range |
| `start` | `number` | `0` | Starting offset |
| `from` | `'first' \| 'center' \| 'last' \| 'random' \| number` | `'first'` | Starting position |
| `reversed` | `boolean` | `false` | Reverse stagger order |
| `ease` | `string` | — | Ease the stagger progression |
| `grid` | `[cols, rows] \| true` | — | 2D grid staggering |
| `axis` | `'x' \| 'y' \| 'z'` | — | Restrict to axis |
| `modifier` | `(val) => val` | — | Modify each stagger value |
| `total` | `number` | — | Override total target count |
| `use` | `string \| Function` | — | Use custom index from property |
| `jitter` | `number \| [number, number]` | — | Add random jitter |

### Usage Patterns

```ts
// Time staggering (delay)
waapi.animate('.item', {
  opacity: [0, 1],
  delay: stagger(80),  // 80ms between each
});

// Value staggering (JS engine only)
animate('.bar', {
  height: stagger([20, 100]),  // Values from 20 to 100
});

// Grid stagger
waapi.animate('.cell', {
  scale: [0, 1],
  delay: stagger(50, {
    grid: [5, 5],
    from: 'center',
    axis: 'y',
  }),
});

// Eased stagger
stagger(100, { ease: 'outQuad' });

// With jitter
stagger(80, { jitter: 20 });  // 80ms ±20ms

// Using in timelines
tl.add('.item', { opacity: 0 }, stagger(50, { from: 'center' }));
```

---

## `createScope()`

Creates a scoped animation environment with automatic cleanup, media query handling, and method registration.

### Signature

```ts
createScope(params?: ScopeParams): Scope
```

### Parameters

| Param | Type | Description |
|-------|------|-------------|
| `root` | `Element \| ReactRef` | Root element for scoped selectors |
| `defaults` | `DefaultsParams` | Default animation params |
| `mediaQueries` | `Record<string, string>` | Media query map (`{ mobile: '(max-width:768px)' }`) |

### Methods

| Method | Description |
|--------|-------------|
| `.add(constructorFn)` | Register constructor function (runs immediately) |
| `.add(name, methodFn)` | Register named method |
| `.addOnce(constructorFn)` | Register constructor that runs only once |
| `.refresh()` | Re-run all constructors |
| `.revert()` | Revert all registered animations |
| `.keepTime(callback)` | Create time-keeping animation |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `.root` | `Element` | Scoped root element |
| `.defaults` | `DefaultsParams` | Default animation params |
| `.matches` | `Record<string, boolean>` | Current media query matches |
| `.methods` | `Record<string, Function>` | Registered methods |
| `.data` | `Record<string, any>` | Custom data store |

### Minimal Example

```ts
import { createScope } from 'animejs';

const scope = createScope({
  root: '#app',
  defaults: { duration: 600, ease: 'outExpo' },
  mediaQueries: { isMobile: '(max-width: 768px)' },
});

scope.add('animateCards', () => {
  waapi.animate('.card', {
    opacity: [0, 1],
    translateY: [20, 0],
  });
});

// Trigger on mobile
if (scope.matches.isMobile) {
  scope.methods.animateCards();
}

// Cleanup
scope.revert();
```

---

## `createDraggable()`

Makes elements draggable with physics-based release.

### Signature

```ts
createDraggable(targets: DOMTargetsParam, params?: DraggableParams): Draggable
```

### Key Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `x` | `boolean \| string \| number` | `true` | Enable X axis, set range |
| `y` | `boolean \| string \| number` | `false` | Enable Y axis |
| `snap` | `number \| Array` | — | Snap to grid |
| `trigger` | `Element` | — | Drag handle element |
| `container` | `Element` | — | Containment boundary |
| `containerFriction` | `number` | — | Friction at container edge |
| `releaseStiffness` | `number` | `100` | Spring stiffness on release |
| `releaseDamping` | `number` | `20` | Spring damping on release |
| `releaseMass` | `number` | `1` | Spring mass on release |
| `dragSpeed` | `number` | `1` | Drag speed multiplier |
| `cursor` | `string` | `'grab'` | Cursor style |

### Methods

| Method | Description |
|--------|-------------|
| `.enable()` | Enable dragging |
| `.disable()` | Disable dragging |
| `.setX(val)` | Programmatic X position |
| `.setY(val)` | Programmatic Y position |
| `.reset()` | Reset to initial position |
| `.revert()` | Revert and destroy |
| `.stop()` | Stop inertia animation |

### Minimal Example

```ts
import { createDraggable } from 'animejs';

createDraggable('.card', {
  x: true,
  y: true,
  snap: 20,
  releaseStiffness: 200,
  releaseDamping: 25,
});
```

---

## `spring()`

Creates a spring easing configuration object.

### Signature

```ts
spring(params?: SpringParams): Spring
```

### Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `stiffness` | `number` | `100` | Spring stiffness |
| `damping` | `number` | `20` | Spring damping |
| `mass` | `number` | `1` | Spring mass |
| `bounce` | `number` | `0.25` | Bounciness 0–1 |
| `velocity` | `number` | `0` | Initial velocity |
| `duration` | `number` | — | Settling duration override |

### Minimal Example

```ts
import { animate, spring } from 'animejs';

animate('.box', {
  translateX: 300,
  ease: spring({ bounce: 0.4, duration: 800 }),
});
```

---

## ScrollObserver

Scroll-triggered event system. Integrates with animations for scroll-based playback.

### Signature

```ts
new ScrollObserver(targets: DOMTargetsParam, params: ScrollObserverParams): ScrollObserver
```

### Key Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `container` | `Element` | scroll container | Scroll container |
| `target` | `Element` | container | Target for position calc |
| `axis` | `'y' \| 'x'` | `'y'` | Scroll axis |
| `repeat` | `boolean` | `false` | Repeat on scroll back |
| `debug` | `boolean` | `false` | Show debug indicators |
| `sync` | `Animation \| Timeline` | — | Sync animation to scroll |

### Thresholds

```ts
// Numeric — 0 to 1 as element enters viewport
threshold: 0.5

// Position shorthands
threshold: 'start'      // 0
threshold: 'center'     // 0.5
threshold: 'end'        // 1

// Relative to viewport
threshold: ['start', 'end']  // Full scroll range
threshold: ['start', 'center']  // First half

// Min/max
threshold: { min: 0.2, max: 0.8 }
```

### Callbacks

| Callback | Trigger |
|----------|---------|
| `onEnter(elements)` | Element enters threshold |
| `onEnterForward(elements)` | Enters while scrolling down |
| `onEnterBackward(elements)` | Enters while scrolling up |
| `onLeave(elements)` | Element leaves threshold |
| `onLeaveForward(elements)` | Leaves while scrolling down |
| `onLeaveBackward(elements)` | Leaves while scrolling up |
| `onUpdate(elements, progress)` | Every scroll update (0-1) |
| `onSyncComplete(anim)` | Linked animation completes |

### Methods

| Method | Description |
|--------|-------------|
| `.link(animation)` | Link animation to scroll sync |
| `.refresh()` | Recalculate positions |
| `.revert()` | Destroy observer |

### Minimal Example

```ts
import { ScrollObserver, animate } from 'animejs';

new ScrollObserver('.section', {
  onEnter: (els) => {
    animate(els, { opacity: [0, 1], duration: 600 });
  },
});

// Progress-linked animation
const anim = animate('.box', {
  translateX: [0, 300],
  autoplay: false,
});

new ScrollObserver('.trigger', {
  sync: anim,  // Animation follows scroll
});
```

---

## SVG Utilities

### `morphTo()`

Morph an SVG path's `d` attribute to a new value.

```ts
morphTo(target: string | SVGPathElement, toPath: string): JSAnimation
```

```ts
animate('#path', { d: 'M0 0 L200 0 L100 200 Z' });
// OR
import { morphTo } from 'animejs';
morphTo('#path', 'M0 0 L200 0 L100 200 Z');
```

### `createDrawable()`

Creates a drawable path that can animate its stroke-dashoffset.

```ts
import { createDrawable } from 'animejs';

const drawable = createDrawable('#path');
animate(drawable, { draw: 1, duration: 2000 });
```

### `createMotionPath()`

Makes an element follow an SVG path.

```ts
import { createMotionPath } from 'animejs';

animate('.follow-me', {
  motionPath: '#path',
  duration: 3000,
});
```

---

## Text Utilities

### `splitText()`

Splits text into character, word, and line elements for animation. Handles accessibility.

```ts
splitText(target: string | Element, params?: SplitTextParams): SplitTextResult
```

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `chars` | `boolean \| object` | `false` | Split into characters |
| `words` | `boolean \| object` | `false` | Split into words |
| `lines` | `boolean \| object` | `false` | Split into lines |
| `accessible` | `boolean` | `true` | Preserve screen reader text |
| `includeSpaces` | `boolean` | `false` | Include whitespace elements |
| `debug` | `boolean` | `false` | Visual debug mode |

Returns `{ chars, words, lines, original }`.

```ts
import { splitText, waapi, stagger } from 'animejs';

const { chars } = splitText('.title', {
  chars: true,
  accessible: true,
});

waapi.animate(chars, {
  translateY: [-20, 0],
  opacity: [0, 1],
  delay: stagger(40),
  duration: 600,
  ease: 'outExpo',
});
```

### `scrambleText()`

Creates a text scrambling/decrypting effect.

```ts
scrambleText(target, params): JSAnimation
```

| Param | Type | Description |
|-------|------|-------------|
| `text` | `string` | Target text |
| `chars` | `string` | Character set |
| `revealRate` | `number` | Character reveal speed |
| `revealDelay` | `number` | Delay before reveal |
| `settleRate` | `number` | Settling speed |
| `settleDuration` | `number` | Settle animation duration |
| `perturbation` | `number` | Scramble intensity |
| `ease` | `string` | Easing |
| `cursor` | `string` | Cursor character |

---

## Engine Configuration

Configure global animation defaults.

```ts
import { globals, engine } from 'animejs';

// Change global defaults
globals.defaults.duration = 1000;
globals.defaults.ease = 'outExpo';

// Engine settings
engine.update({ speed: 2 });    // 2x speed
engine.pause();                 // Pause all animations
engine.resume();                // Resume all

// Per-config
engine.update({
  timeUnit: 'ms',         // 'ms' or 's'
  speed: 1,               // Global speed multiplier
  fps: 60,                // Frame rate cap
  precision: 0.1,         // Precision for equality checks
  pauseOnDocumentHidden: true,
});
```

---

## Easings

### Built-in String Easings

```
inQuad    outQuad    inOutQuad    outInQuad
inCubic   outCubic   inOutCubic  outInCubic
inQuart   outQuart   inOutQuart  outInQuart
inQuint   outQuint   inOutQuint  outInQuint
inSine    outSine    inOutSine   outInSine
inExpo    outExpo    inOutExpo   outInExpo
inCirc    outCirc    inOutCirc   outInCirc
inBack    outBack    inOutBack   outInBack
inElastic outElastic inOutElastic outInElastic
inBounce  outBounce  inOutBounce outInBounce
linear
```

### Special Easings

```ts
// Cubic bezier
ease: cubicBezier(0.25, 0.1, 0.25, 1)

// Spring physics
ease: spring({ bounce: 0.25, duration: 800 })

// Steps
ease: 'steps(5)'

// Irregular (CSS linear())
ease: 'irregular-light'
ease: 'irregular-heavy'
```

---

## Sources

- [juliangarnier/anime](https://github.com/juliangarnier/anime) — source code v4.5.0
- [animejs.com/documentation](https://animejs.com/documentation) — official documentation
- [davidosemwegie/animejs-best-practices](https://github.com/davidosemwegie/animejs-best-practices) — best practices skill
- [animejs.com/easing-editor](https://animejs.com/easing-editor) — easing function reference
