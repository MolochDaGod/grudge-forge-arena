/**
 * VFXManager.ts
 *
 * Particle VFX system for arena combat using instanced meshes.
 *
 * Three effect types:
 *   Splash  — hit impact: small cubes burst outward, float up, fade
 *   Blink   — charge/swing flash: cross-planes with additive blending
 *   Pop     — AoE knockback: expanding ring sphere
 *
 * Usage:
 *   import { vfxManager } from './VFXManager';
 *   scene.add(vfxManager.root);
 *   vfxManager.spawnSplash(pos, '#ff6b35');
 *   vfxManager.update(dt);
 */

import * as THREE from "three";

// ── Constants ────────────────────────────────────────────────────────────────

const SPLASH_COUNT   = 10;   // particles per splash
const SPLASH_LIFE    = 0.6;  // seconds
const BLINK_LIFE     = 0.2;  // seconds (very fast flash)
const POP_LIFE       = 0.5;  // seconds

// ── Shared geometries ────────────────────────────────────────────────────────

const CUBE_GEO    = new THREE.BoxGeometry(0.08, 0.08, 0.08);
const PLANE_GEO   = new THREE.PlaneGeometry(1.2, 1.2);
const RING_GEO    = new THREE.RingGeometry(0.8, 1.0, 24);

// ── Particle base ────────────────────────────────────────────────────────────

interface BaseEffect {
  id: number;
  age: number;
  lifetime: number;
  disposed: boolean;
}

interface SplashEffect extends BaseEffect {
  type: "splash";
  meshes: THREE.Mesh[];
  velocities: THREE.Vector3[];
}

interface BlinkEffect extends BaseEffect {
  type: "blink";
  meshes: THREE.Mesh[];
}

interface PopEffect extends BaseEffect {
  type: "pop";
  mesh: THREE.Mesh;
  maxRadius: number;
}

type Effect = SplashEffect | BlinkEffect | PopEffect;

// ── Manager ──────────────────────────────────────────────────────────────────

class VFXManager {
  root = new THREE.Group();
  private effects: Effect[] = [];
  private nextId = 0;

  // ─── Splash (hit impact) ─────────────────────────────────────────────

  spawnSplash(position: THREE.Vector3, color: string = "#ff6b35"): void {
    const id = this.nextId++;
    const col = new THREE.Color(color);
    const meshes: THREE.Mesh[] = [];
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < SPLASH_COUNT; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const m = new THREE.Mesh(CUBE_GEO, mat);
      m.position.copy(position);
      // random offset so they don't all start at exact same point
      m.position.x += (Math.random() - 0.5) * 0.3;
      m.position.y += Math.random() * 0.3;
      m.position.z += (Math.random() - 0.5) * 0.3;
      // random outward + upward velocity
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        1.5 + Math.random() * 2,
        (Math.random() - 0.5) * 3,
      );
      meshes.push(m);
      velocities.push(v);
      this.root.add(m);
    }

    this.effects.push({
      type: "splash", id, age: 0, lifetime: SPLASH_LIFE,
      disposed: false, meshes, velocities,
    });
  }

  // ─── Blink (charge/swing flash) ──────────────────────────────────────

  spawnBlink(position: THREE.Vector3, color: string = "#ffffff"): void {
    const id = this.nextId++;
    const col = new THREE.Color(color);
    const meshes: THREE.Mesh[] = [];

    // Two cross-planes (X and Z facing)
    for (let i = 0; i < 2; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const m = new THREE.Mesh(PLANE_GEO, mat);
      m.position.copy(position);
      m.position.y += 0.8; // center on character body
      if (i === 1) m.rotation.y = Math.PI / 2;
      m.scale.setScalar(0.3); // start small, scale up
      meshes.push(m);
      this.root.add(m);
    }

    this.effects.push({
      type: "blink", id, age: 0, lifetime: BLINK_LIFE,
      disposed: false, meshes,
    });
  }

  // ─── Pop (AoE knockback ring) ────────────────────────────────────────

  spawnPop(position: THREE.Vector3, color: string = "#cc44ff", maxRadius: number = 4): void {
    const id = this.nextId++;
    const col = new THREE.Color(color);

    const mat = new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(RING_GEO, mat);
    mesh.position.copy(position);
    mesh.position.y += 0.1; // just above ground
    mesh.rotation.x = -Math.PI / 2; // lay flat
    mesh.scale.setScalar(0.1);

    this.root.add(mesh);

    this.effects.push({
      type: "pop", id, age: 0, lifetime: POP_LIFE,
      disposed: false, mesh, maxRadius,
    });
  }

  // ─── Update loop ─────────────────────────────────────────────────────

  update(dt: number): void {
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const fx = this.effects[i];
      if (fx.disposed) continue;

      fx.age += dt;
      const t = Math.min(fx.age / fx.lifetime, 1); // 0-1 normalized age

      if (t >= 1) {
        this.disposeEffect(fx);
        continue;
      }

      switch (fx.type) {
        case "splash":
          this.updateSplash(fx, dt, t);
          break;
        case "blink":
          this.updateBlink(fx, t);
          break;
        case "pop":
          this.updatePop(fx, t);
          break;
      }
    }
  }

  private updateSplash(fx: SplashEffect, dt: number, t: number): void {
    const gravity = -6;
    for (let j = 0; j < fx.meshes.length; j++) {
      const m = fx.meshes[j];
      const v = fx.velocities[j];
      // Apply gravity to velocity
      v.y += gravity * dt;
      m.position.addScaledVector(v, dt);
      // Fade out
      (m.material as THREE.MeshBasicMaterial).opacity = 1 - t;
      // Shrink slightly
      const s = 1 - t * 0.5;
      m.scale.setScalar(s);
      // Spin for visual interest
      m.rotation.x += dt * 8;
      m.rotation.z += dt * 5;
    }
  }

  private updateBlink(fx: BlinkEffect, t: number): void {
    // Quick scale up then fade out
    const scale = 0.3 + t * 2.0;   // grows fast
    const opacity = 1 - t * t;      // quadratic fade
    for (const m of fx.meshes) {
      m.scale.setScalar(scale);
      (m.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }

  private updatePop(fx: PopEffect, t: number): void {
    // Expanding ring
    const scale = t * fx.maxRadius;
    fx.mesh.scale.setScalar(scale);
    // Fade out
    (fx.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - t);
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────

  private disposeEffect(fx: Effect): void {
    if (fx.disposed) return;
    fx.disposed = true;

    switch (fx.type) {
      case "splash":
        for (const m of fx.meshes) {
          this.root.remove(m);
          (m.material as THREE.Material).dispose();
        }
        break;
      case "blink":
        for (const m of fx.meshes) {
          this.root.remove(m);
          (m.material as THREE.Material).dispose();
        }
        break;
      case "pop":
        this.root.remove(fx.mesh);
        (fx.mesh.material as THREE.Material).dispose();
        break;
    }

    const idx = this.effects.indexOf(fx);
    if (idx >= 0) this.effects.splice(idx, 1);
  }

  clear(): void {
    for (const fx of [...this.effects]) this.disposeEffect(fx);
  }

  get activeCount(): number { return this.effects.length; }
}

// Module-level singleton
export const vfxManager = new VFXManager();
