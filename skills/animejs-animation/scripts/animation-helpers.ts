/**
 * anime.js v4 Animation Helpers
 *
 * TypeScript utility functions for common animation patterns.
 * All durations are in milliseconds.
 *
 * Sources:
 * - https://github.com/juliangarnier/anime (v4.5.0)
 * - https://github.com/davidosemwegie/animejs-best-practices
 * - https://animejs.com/documentation
 */

import {
  animate,
  waapi,
  createTimeline as animeCreateTimeline,
  stagger,
  type Timeline,
  type WAAPIAnimation,
} from 'animejs';

// ──────────────────────────────────────────────────
// Timeline Helpers
// ──────────────────────────────────────────────────

/**
 * Configuration for creating a timeline with sensible defaults.
 *
 * @example
 * ```ts
 * const tl = createTimeline({ defaults: { duration: 800, ease: 'outExpo' } });
 *
 * tl.add('.box-1', { translateX: 250 })
 *   .add('.box-2', { translateY: 100 }, '-=400')  // overlap
 *   .add('.box-3', { scale: 1.5 }, '+=200');      // gap
 * ```
 */
export interface TimelineConfig {
  /** Default animation params applied to all children */
  defaults?: {
    duration?: number;
    ease?: string;
    delay?: number;
    [key: string]: unknown;
  };
  /** Whether to autoplay the timeline (default: true) */
  autoplay?: boolean;
  /** Number of loops (default: 1, use Infinity for infinite) */
  loop?: number;
  /** Whether to alternate direction on loop */
  alternate?: boolean;
}

/**
 * Wraps `createTimeline()` with sensible defaults and type safety.
 *
 * Creates a timeline pre-configured with common defaults, autoplay behavior,
 * and loop settings. Returns the timeline instance ready for `.add()` calls.
 *
 * @param config - Timeline configuration overrides
 * @returns A fully initialized anime.js Timeline
 *
 * @example
 * ```ts
 * const tl = createTimeline({ defaults: { duration: 600, ease: 'outExpo' } });
 * tl.add('.card', { opacity: [0, 1], translateY: [20, 0] })
 *   .add('.card-image', { scale: [1.1, 1] }, '-=300');
 * ```
 */
export function createTimeline(config: TimelineConfig = {}): Timeline {
  return animeCreateTimeline({
    defaults: {
      duration: 600,
      ease: 'outExpo',
      ...config.defaults,
    },
    autoplay: config.autoplay ?? true,
    loop: config.loop ?? 1,
    alternate: config.alternate ?? false,
  });
}

// ──────────────────────────────────────────────────
// Stagger Helpers
// ──────────────────────────────────────────────────

/**
 * Options for staggering animations across multiple elements.
 */
export interface StaggerOptions {
  /** Delay in ms between each element (default: 50) */
  delay?: number;
  /** Direction of stagger: 'first' | 'center' | 'last' | 'random' | number (default: 'first') */
  from?: 'first' | 'center' | 'last' | 'random' | number;
  /** Easing function for the stagger progression (default: 'outQuad') */
  ease?: string;
  /** Grid dimensions [cols, rows] for 2D stagger */
  grid?: [number, number];
  /** Axis to restrict stagger to: 'x' | 'y' */
  axis?: 'x' | 'y';
  /** Animation duration per element (default: 600) */
  duration?: number;
  /** Easing for each element's animation (default: 'outExpo') */
  animationEase?: string;
  /** Animation property values applied to each element */
  [key: string]: unknown;
}

/**
 * Animates elements with stagger presets using WAAPI (hardware-accelerated).
 *
 * Uses `waapi.animate()` for best performance. Supports grid staggering,
 * directional staggering, and eased stagger progression.
 *
 * @param selector - CSS selector or DOM elements to animate
 * @param options - Stagger animation options
 * @returns The WAAPIAnimation instance
 *
 * @example
 * ```ts
 * // Basic staggered fade-in
 * staggerElements('.list-item', {
 *   delay: 80,
 *   translateY: [20, 0],
 *   opacity: [0, 1],
 * });
 *
 * // Grid stagger from center
 * staggerElements('.grid-cell', {
 *   delay: 50,
 *   grid: [5, 4],
 *   from: 'center',
 *   scale: [0, 1],
 * });
 * ```
 */
export function staggerElements(
  selector: string,
  options: StaggerOptions = {}
): WAAPIAnimation {
  const {
    delay = 50,
    from = 'first',
    ease: staggerEase,
    grid,
    axis,
    duration = 600,
    animationEase = 'outExpo',
    ...animationProps
  } = options;

  // Build stagger params — omit undefined keys
  const staggerParams: Record<string, unknown> = { from };
  if (staggerEase) staggerParams.ease = staggerEase;
  if (grid) staggerParams.grid = grid;
  if (axis) staggerParams.axis = axis;

  return waapi.animate(selector, {
    delay: stagger(delay, staggerParams),
    duration,
    ease: animationEase,
    ...animationProps,
  });
}

// ──────────────────────────────────────────────────
// Scroll Reveal
// ──────────────────────────────────────────────────

/**
 * Configuration for the scroll reveal animation.
 */
export interface ScrollRevealOptions {
  /** Offset from top of viewport in px (default: 0) */
  threshold?: number;
  /** Animation duration in ms (default: 800) */
  duration?: number;
  /** Easing function (default: 'outExpo') */
  ease?: string;
  /** Whether animation should only trigger once (default: true) */
  once?: boolean;
  /** Root margin for IntersectionObserver (default: '0px') */
  rootMargin?: string;
}

/**
 * Sets up a fade-in-up animation triggered by IntersectionObserver.
 *
 * Elements start invisible and translate up; when scrolled into view,
 * they animate to visible and translate to origin. Supports single-fire
 * (default) or repeatable triggers.
 *
 * @param selector - CSS selector for elements to reveal on scroll
 * @param options - Scroll reveal animation options
 * @returns The IntersectionObserver instance (call `.disconnect()` to clean up)
 *
 * @example
 * ```ts
 * // Basic fade-in-up
 * const observer = scrollReveal('.section');
 *
 * // Custom animation
 * scrollReveal('.card', {
 *   threshold: 0.2,
 *   duration: 1000,
 *   ease: 'outBack',
 * });
 * ```
 */
export function scrollReveal(
  selector: string,
  options: ScrollRevealOptions = {}
): IntersectionObserver {
  const {
    threshold = 0,
    duration = 800,
    ease = 'outExpo',
    once = true,
    rootMargin = '0px',
  } = options;

  const elements = document.querySelectorAll(selector);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;

          // Set initial state
          el.style.opacity = '0';
          el.style.transform = 'translateY(30px)';

          // Animate in
          waapi.animate(el, {
            opacity: [0, 1],
            translateY: [30, 0],
            duration,
            ease,
          });

          // If once, stop observing this element
          if (once) {
            observer.unobserve(el);
          }
        } else if (!once) {
          const el = entry.target as HTMLElement;
          // Reset when scrolling back out (for repeatable animations)
          waapi.animate(el, {
            opacity: [1, 0],
            translateY: [0, 30],
            duration: duration / 2,
            ease: 'inQuad',
          });
        }
      });
    },
    { threshold, rootMargin }
  );

  elements.forEach((el) => observer.observe(el));
  return observer;
}

// ──────────────────────────────────────────────────
// SVG Morphing
// ──────────────────────────────────────────────────

/**
 * Animates SVG path morphing between two path definitions.
 *
 * Uses the JS engine `animate()` (required for SVG `d` attribute animation).
 * Both paths must have the same number and type of commands for a smooth morph.
 *
 * @param fromPath - CSS selector for the source SVG path element OR the path element itself
 * @param toPath - The target `d` attribute string (e.g., "M10 10 L100 100")
 * @param duration - Animation duration in ms (default: 1000)
 * @param options - Additional animation parameters
 * @returns The JSAnimation instance
 *
 * @example
 * ```ts
 * // Morph a path to a new shape
 * morphSVG('#my-path', 'M0 0 L200 0 L100 200 Z', 1500, {
 *   ease: 'inOutQuad',
 *   loop: true,
 *   alternate: true,
 * });
 * ```
 */
export function morphSVG(
  fromPath: string | SVGPathElement,
  toPath: string,
  duration: number = 1000,
  options: Record<string, unknown> = {}
) {
  return animate(fromPath, {
    d: toPath,
    duration,
    ease: 'inOutQuad',
    ...options,
  });
}
