/**
 * Animation helpers for the Welcome wizard
 */

export type EasingFunction = (t: number) => number;

// Easing functions
export const easings = {
  // Smooth ease-out for entering elements
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),

  // Bouncy ease-out for playful animations
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },

  // Smooth ease-in-out for transitions
  easeInOutCubic: (t: number): number => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Elastic bounce for attention-grabbing
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
};

/**
 * Typewriter effect configuration
 */
export interface TypewriterConfig {
  text: string;
  speed?: number; // ms per character
  delay?: number; // initial delay before starting
  onComplete?: () => void;
}

/**
 * Creates a typewriter effect that yields characters progressively
 */
export function createTypewriter(config: TypewriterConfig): {
  start: () => void;
  stop: () => void;
  reset: () => void;
  subscribe: (callback: (text: string) => void) => () => void;
} {
  const { text, speed = 50, delay = 0, onComplete } = config;
  let currentIndex = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let subscribers: ((text: string) => void)[] = [];

  const notify = () => {
    const currentText = text.slice(0, currentIndex);
    subscribers.forEach(cb => cb(currentText));
  };

  const tick = () => {
    if (currentIndex < text.length) {
      currentIndex++;
      notify();
      timeoutId = setTimeout(tick, speed);
    } else {
      onComplete?.();
    }
  };

  return {
    start: () => {
      if (delay > 0) {
        timeoutId = setTimeout(tick, delay);
      } else {
        tick();
      }
    },
    stop: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    reset: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      currentIndex = 0;
      notify();
    },
    subscribe: (callback: (text: string) => void) => {
      subscribers.push(callback);
      return () => {
        subscribers = subscribers.filter(cb => cb !== callback);
      };
    }
  };
}

/**
 * Particle configuration for background effects
 */
export interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

/**
 * Creates floating particles for background animation
 */
export function createParticles(count: number, width: number, height: number): Particle[] {
  const colors = [
    'rgba(99, 102, 241, 0.6)',   // Indigo
    'rgba(139, 92, 246, 0.6)',   // Violet
    'rgba(168, 85, 247, 0.5)',   // Purple
    'rgba(59, 130, 246, 0.5)',   // Blue
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 4 + 2,
    speedX: (Math.random() - 0.5) * 0.5,
    speedY: (Math.random() - 0.5) * 0.5,
    opacity: Math.random() * 0.5 + 0.3,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
}

/**
 * Updates particle positions with boundary wrapping
 */
export function updateParticles(
  particles: Particle[],
  width: number,
  height: number
): Particle[] {
  return particles.map(p => {
    let newX = p.x + p.speedX;
    let newY = p.y + p.speedY;

    // Wrap around boundaries
    if (newX < 0) newX = width;
    if (newX > width) newX = 0;
    if (newY < 0) newY = height;
    if (newY > height) newY = 0;

    return { ...p, x: newX, y: newY };
  });
}

/**
 * Step transition configuration
 */
export interface StepTransition {
  direction: 'forward' | 'backward';
  duration: number;
}

/**
 * Calculate CSS transform for step transitions
 */
export function getStepTransform(
  progress: number,
  direction: 'forward' | 'backward',
  entering: boolean
): { transform: string; opacity: number } {
  const ease = easings.easeOutCubic(progress);

  if (entering) {
    // Entering from the appropriate side
    const startX = direction === 'forward' ? 50 : -50;
    const currentX = startX * (1 - ease);
    return {
      transform: `translateX(${currentX}px)`,
      opacity: ease
    };
  } else {
    // Exiting to the opposite side
    const endX = direction === 'forward' ? -50 : 50;
    const currentX = endX * ease;
    return {
      transform: `translateX(${currentX}px)`,
      opacity: 1 - ease
    };
  }
}

/**
 * Staggered animation delay calculator
 */
export function getStaggerDelay(index: number, baseDelay: number = 100): number {
  return index * baseDelay;
}

/**
 * CSS keyframe animation helper
 */
export function createKeyframeAnimation(
  name: string,
  keyframes: Record<string, Record<string, string>>
): string {
  const frames = Object.entries(keyframes)
    .map(([percent, props]) => {
      const cssProps = Object.entries(props)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');
      return `${percent} { ${cssProps} }`;
    })
    .join('\n');

  return `@keyframes ${name} {\n${frames}\n}`;
}

/**
 * Pulse animation for attention-grabbing elements
 */
export function pulseAnimation(element: HTMLElement, duration: number = 1000): () => void {
  let animationId: number;
  let startTime: number;

  const animate = (timestamp: number) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = (elapsed % duration) / duration;

    const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.05;
    element.style.transform = `scale(${scale})`;

    animationId = requestAnimationFrame(animate);
  };

  animationId = requestAnimationFrame(animate);

  return () => {
    cancelAnimationFrame(animationId);
    element.style.transform = '';
  };
}

/**
 * Shimmer effect for loading states or highlights
 */
export function shimmerEffect(element: HTMLElement): () => void {
  const style = document.createElement('style');
  const animationName = `shimmer-${Math.random().toString(36).slice(2, 9)}`;

  style.textContent = `
    @keyframes ${animationName} {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);

  element.style.background = `linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  )`;
  element.style.backgroundSize = '200% 100%';
  element.style.animation = `${animationName} 2s infinite`;

  return () => {
    element.style.background = '';
    element.style.backgroundSize = '';
    element.style.animation = '';
    style.remove();
  };
}
