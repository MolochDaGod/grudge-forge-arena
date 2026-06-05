/**
 * ProjectileManager.ts
 *
 * Spline-based projectile system for arena combat.
 * Each projectile follows a CatmullRomCurve3 from spawn to target with
 * configurable arc height, speed, element-colored trail, and hit callback.
 *
 * Usage:
 *   import { projectileManager } from './ProjectileManager';
 *   // in scene setup:
 *   scene.add(projectileManager.root);
 *   // spawn:
 *   projectileManager.spawn(origin, target, { speed: 18, arcHeight: 3, color: '#ff6b35', onHit });
 *   // per-frame:
 *   projectileManager.update(dt);
 */

import * as THREE from "three";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProjectileOpts {
  speed?: number;         // units per second (default 18)
  arcHeight?: number;     // peak height offset (default 2)
  color?: string;         // hex color string (default '#cc44ff')
  radius?: number;        // head mesh radius (default 0.15)
  trailLength?: number;   // how many past points the trail samples (default 12)
  lifetime?: number;      // max seconds before auto-dispose (default 5)
  hitRadius?: number;     // proximity to trigger hit (default 1.0)
  onHit?: (pos: THREE.Vector3) => void;
}

interface Projectile {
  id: number;
  curve: THREE.CatmullRomCurve3;
  head: THREE.Mesh;
  trail: THREE.Line;
  trailGeo: THREE.BufferGeometry;
  glow: THREE.PointLight;
  progress: number;       // 0-1 along curve
  speed: number;
  curveLength: number;
  lifetime: number;
  age: number;
  hitRadius: number;
  color: THREE.Color;
  onHit?: (pos: THREE.Vector3) => void;
  disposed: boolean;
}

// ── Shared geometry / material templates ──────────────────────────────────────

const SPHERE_GEO = new THREE.SphereGeometry(1, 8, 6);

// ── Manager ──────────────────────────────────────────────────────────────────

class ProjectileManager {
  root = new THREE.Group();
  private pool: Projectile[] = [];
  private nextId = 0;

  /** Spawn a new spline projectile from origin toward target. */
  spawn(origin: THREE.Vector3, target: THREE.Vector3, opts: ProjectileOpts = {}): number {
    const {
      speed = 18,
      arcHeight = 2,
      color = "#cc44ff",
      radius = 0.15,
      trailLength = 12,
      lifetime = 5,
      hitRadius = 1.0,
      onHit,
    } = opts;

    const id = this.nextId++;
    const col = new THREE.Color(color);

    // Build spline: origin → mid-arc → target
    const mid = new THREE.Vector3().lerpVectors(origin, target, 0.5);
    mid.y += arcHeight + origin.distanceTo(target) * 0.1;
    // Add slight asymmetry for visual interest
    const q1 = new THREE.Vector3().lerpVectors(origin, mid, 0.5);
    q1.y += arcHeight * 0.6;
    const q2 = new THREE.Vector3().lerpVectors(mid, target, 0.5);
    q2.y += arcHeight * 0.4;
    const curve = new THREE.CatmullRomCurve3([origin.clone(), q1, mid, q2, target.clone()]);

    // Head mesh (small glowing sphere)
    const headMat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95 });
    const head = new THREE.Mesh(SPHERE_GEO, headMat);
    head.scale.setScalar(radius);
    head.position.copy(origin);

    // Trail (line following behind the head)
    const trailPositions = new Float32Array(trailLength * 3);
    for (let i = 0; i < trailLength; i++) {
      trailPositions[i * 3] = origin.x;
      trailPositions[i * 3 + 1] = origin.y;
      trailPositions[i * 3 + 2] = origin.z;
    }
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute("position", new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = new THREE.LineBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.6,
      linewidth: 2,
    });
    const trail = new THREE.Line(trailGeo, trailMat);

    // Small point light for glow
    const glow = new THREE.PointLight(col.getHex(), 1.5, 4);
    glow.position.copy(origin);

    this.root.add(head, trail, glow);

    const proj: Projectile = {
      id, curve, head, trail, trailGeo, glow,
      progress: 0,
      speed,
      curveLength: curve.getLength(),
      lifetime,
      age: 0,
      hitRadius,
      color: col,
      onHit,
      disposed: false,
    };
    this.pool.push(proj);
    return id;
  }

  /** Advance all active projectiles. Call once per frame. */
  update(dt: number, enemyPositions?: THREE.Vector3[]): void {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      if (p.disposed) continue;

      p.age += dt;
      if (p.age > p.lifetime) { this.dispose(p); continue; }

      // Advance along curve
      const distPerSec = p.speed;
      p.progress += (distPerSec * dt) / p.curveLength;

      if (p.progress >= 1) {
        // Arrived at target
        const hitPos = p.curve.getPoint(1);
        p.onHit?.(hitPos);
        this.dispose(p);
        continue;
      }

      const pos = p.curve.getPoint(p.progress);
      p.head.position.copy(pos);
      p.glow.position.copy(pos);

      // Update trail: shift positions back, set [0] to current
      const attr = p.trailGeo.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      const len = attr.count;
      // shift all trail points one slot back
      for (let j = (len - 1) * 3; j >= 3; j -= 3) {
        arr[j] = arr[j - 3];
        arr[j + 1] = arr[j - 2];
        arr[j + 2] = arr[j - 1];
      }
      arr[0] = pos.x;
      arr[1] = pos.y;
      arr[2] = pos.z;
      attr.needsUpdate = true;

      // Collision check against enemy positions
      if (enemyPositions) {
        for (const ep of enemyPositions) {
          if (pos.distanceTo(ep) < p.hitRadius) {
            p.onHit?.(pos);
            this.dispose(p);
            break;
          }
        }
      }
    }
  }

  private dispose(p: Projectile): void {
    if (p.disposed) return;
    p.disposed = true;
    this.root.remove(p.head, p.trail, p.glow);
    (p.head.material as THREE.Material).dispose();
    p.trailGeo.dispose();
    (p.trail.material as THREE.Material).dispose();
    const idx = this.pool.indexOf(p);
    if (idx >= 0) this.pool.splice(idx, 1);
  }

  /** Remove all active projectiles. */
  clear(): void {
    for (const p of [...this.pool]) this.dispose(p);
  }

  get activeCount(): number { return this.pool.length; }
}

// Module-level singleton
export const projectileManager = new ProjectileManager();
