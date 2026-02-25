/**
 * Mobile Detection - Reactive viewport detection using Svelte 5 runes.
 *
 * Provides a reactive `isMobile` signal that components can use to
 * adapt behavior (e.g., open windows fullscreen, disable drag/resize).
 * CSS media queries handle purely visual changes.
 */

const MOBILE_BREAKPOINT = 768;

class MobileDetector {
  isMobile = $state(false);
  viewportWidth = $state(0);
  viewportHeight = $state(0);

  constructor() {
    if (typeof window !== 'undefined') {
      this.update();
      window.addEventListener('resize', () => this.update());
    }
  }

  private update() {
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    this.isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  }
}

export const mobile = new MobileDetector();
