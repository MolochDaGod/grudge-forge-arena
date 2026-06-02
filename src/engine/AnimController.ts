/**
 * AnimController.ts
 * Unified Three.js animation controller for Grudge Warlords characters.
 *
 * Mirrors the grudgeRPG (BabylonJS) AnimController API but uses
 * THREE.AnimationMixer / AnimationAction for playback and blending.
 *
 * Features:
 *   - Map-based registry (key → AnimationClip)
 *   - Smooth cross-fade via fadeIn / fadeOut / crossFadeTo
 *   - Single currentAction tracking (no overlapping blend leaks)
 *   - register / unregister / registerAll / play / stopAll / dispose
 */

import * as THREE from "three";

export interface PlayOptions {
  /** Loop the animation (default: true). */
  loop?: boolean;
  /** Cross-fade duration in seconds (0 = hard cut, default: 0.15). */
  blendTime?: number;
  /** Playback speed multiplier (default: 1.0). */
  speed?: number;
  /** Clamp on last frame when done (default: true for one-shots). */
  clampWhenFinished?: boolean;
}

export class AnimController {
  private _mixer: THREE.AnimationMixer;
  private _registry = new Map<string, THREE.AnimationClip>();
  private _actions = new Map<string, THREE.AnimationAction>();
  private _current: THREE.AnimationAction | null = null;
  private _currentKey: string | null = null;

  constructor(mixer: THREE.AnimationMixer) {
    this._mixer = mixer;
  }

  // ── Registry ───────────────────────────────────────────────────────────────

  /** Register a named AnimationClip. Overwrites existing entry for same key. */
  register(key: string, clip: THREE.AnimationClip): void {
    this._registry.set(key, clip);
    // Invalidate cached action so next play() rebuilds it
    this._actions.delete(key);
  }

  /** Bulk-register from a Record<string, AnimationClip>. */
  registerAll(clips: Record<string, THREE.AnimationClip>): void {
    for (const [key, clip] of Object.entries(clips)) {
      this.register(key, clip);
    }
  }

  /** Whether a key exists in the registry. */
  has(key: string): boolean {
    return this._registry.has(key);
  }

  /** Remove and optionally stop+uncache a clip. */
  unregister(key: string, dispose = true): void {
    if (this._currentKey === key) {
      this._current?.stop();
      this._current = null;
      this._currentKey = null;
    }
    if (dispose) {
      const action = this._actions.get(key);
      if (action) {
        action.stop();
        this._mixer.uncacheAction(action.getClip());
      }
    }
    this._registry.delete(key);
    this._actions.delete(key);
  }

  // ── Playback ───────────────────────────────────────────────────────────────

  /** Whether the given key is the currently active animation. */
  isPlaying(key: string): boolean {
    return this._currentKey === key && !!this._current?.isRunning();
  }

  /** The key of the currently-playing animation, or null. */
  get currentKey(): string | null {
    return this._currentKey;
  }

  /**
   * Play an animation by key with optional smooth cross-fade.
   *
   * @returns true if the animation started, false if key not found or already playing.
   */
  play(key: string, opts: PlayOptions = {}): boolean {
    const clip = this._registry.get(key);
    if (!clip) {
      console.warn(`[AnimController] Unknown key: "${key}"`);
      return false;
    }

    const {
      loop = true,
      blendTime = 0.15,
      speed = 1.0,
      clampWhenFinished,
    } = opts;

    // Get or create the action
    let action = this._actions.get(key);
    if (!action) {
      action = this._mixer.clipAction(clip);
      this._actions.set(key, action);
    }

    // Already playing this exact action — no-op
    if (action === this._current && action.isRunning()) return true;

    // Configure loop mode
    if (loop) {
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.clampWhenFinished = false;
    } else {
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = clampWhenFinished !== false;
    }
    action.timeScale = speed;

    // Cross-fade or hard cut
    const prev = this._current;
    if (prev && prev !== action && blendTime > 0) {
      prev.fadeOut(blendTime);
      action.reset().fadeIn(blendTime).play();
    } else {
      if (prev && prev !== action) prev.stop();
      action.reset().play();
    }

    this._current = action;
    this._currentKey = key;
    return true;
  }

  /** Stop all animations immediately. */
  stopAll(): void {
    this._mixer.stopAllAction();
    this._current = null;
    this._currentKey = null;
  }

  /** Dispose all cached actions and clear the registry. */
  dispose(): void {
    this.stopAll();
    for (const action of this._actions.values()) {
      this._mixer.uncacheAction(action.getClip());
    }
    this._actions.clear();
    this._registry.clear();
  }

  /** Get the underlying mixer (for update(delta) calls in the render loop). */
  get mixer(): THREE.AnimationMixer {
    return this._mixer;
  }
}
