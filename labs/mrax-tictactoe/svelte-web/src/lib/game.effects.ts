/**
 * MRX EFFECTS - Web Side Effects
 * ===============================
 * All impure operations: sounds, animations, haptics.
 */

// ============================================================
// SOUND EFFECTS - Web Audio API
// ============================================================
class SoundEffects {
  private audioContext: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Play a simple tone
   */
  playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available, silently ignore
    }
  }

  /**
   * Sound for placing a marker
   */
  playPlaceSound(): void {
    this.playTone(440, 0.1, 'sine');
  }

  /**
   * Sound for invalid move
   */
  playErrorSound(): void {
    this.playTone(200, 0.15, 'sawtooth');
  }

  /**
   * Sound for victory
   */
  playVictorySound(): void {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // Play a simple victory melody
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine'), i * 150);
    });
  }

  /**
   * Sound for draw
   */
  playDrawSound(): void {
    this.playTone(330, 0.3, 'triangle');
  }

  /**
   * Sound for reset
   */
  playResetSound(): void {
    this.playTone(660, 0.1, 'sine');
    setTimeout(() => this.playTone(440, 0.1, 'sine'), 100);
  }
}

// ============================================================
// ANIMATION EFFECTS - CSS Animation triggers
// ============================================================
class AnimationEffects {
  /**
   * Trigger a CSS animation on an element
   */
  triggerAnimation(element: HTMLElement, animationClass: string): void {
    element.classList.remove(animationClass);
    // Force reflow to restart animation
    void element.offsetWidth;
    element.classList.add(animationClass);
  }

  /**
   * Animate a cell being placed
   */
  animatePlace(element: HTMLElement): void {
    this.triggerAnimation(element, 'animate-place');
  }

  /**
   * Animate winning cells
   */
  animateWin(elements: HTMLElement[]): void {
    elements.forEach((el, i) => {
      setTimeout(() => {
        this.triggerAnimation(el, 'animate-win');
      }, i * 100);
    });
  }

  /**
   * Animate board shake (invalid move)
   */
  animateShake(element: HTMLElement): void {
    this.triggerAnimation(element, 'animate-shake');
  }

  /**
   * Animate board reset
   */
  animateReset(element: HTMLElement): void {
    this.triggerAnimation(element, 'animate-reset');
  }
}

// ============================================================
// HAPTIC EFFECTS - Vibration API (mobile)
// ============================================================
class HapticEffects {
  private supported = 'vibrate' in navigator;

  /**
   * Short tap feedback
   */
  tap(): void {
    if (this.supported) {
      navigator.vibrate(10);
    }
  }

  /**
   * Error feedback
   */
  error(): void {
    if (this.supported) {
      navigator.vibrate([50, 30, 50]);
    }
  }

  /**
   * Victory feedback
   */
  victory(): void {
    if (this.supported) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }
}

// ============================================================
// EFFECTS FACADE - Unified interface
// ============================================================
export class GameEffects {
  private sound = new SoundEffects();
  private animation = new AnimationEffects();
  private haptic = new HapticEffects();

  /**
   * Effect: Marker placed successfully
   */
  onMarkerPlaced(cellElement: HTMLElement): void {
    this.sound.playPlaceSound();
    this.animation.animatePlace(cellElement);
    this.haptic.tap();
  }

  /**
   * Effect: Invalid move attempted
   */
  onInvalidMove(boardElement: HTMLElement): void {
    this.sound.playErrorSound();
    this.animation.animateShake(boardElement);
    this.haptic.error();
  }

  /**
   * Effect: Game won
   */
  onVictory(winningCellElements: HTMLElement[]): void {
    this.sound.playVictorySound();
    this.animation.animateWin(winningCellElements);
    this.haptic.victory();
  }

  /**
   * Effect: Game draw
   */
  onDraw(): void {
    this.sound.playDrawSound();
  }

  /**
   * Effect: Game reset
   */
  onReset(boardElement: HTMLElement): void {
    this.sound.playResetSound();
    this.animation.animateReset(boardElement);
    this.haptic.tap();
  }
}

// Singleton export
export const gameEffects = new GameEffects();
