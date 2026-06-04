/**
 * IslandTerrain.ts
 * Procedural island heightfield terrain — Grudge Studio Forge pattern.
 *
 * Based on the Grudge Warlords HomeIslandTerrainGen:
 * - SimplexNoise FBM for organic height variation
 * - Circular edge falloff for natural island shape
 * - Biome-driven height profiles
 * - BVH-ready geometry for collision
 *
 * This is a simplified version suitable for the Forge testing ground.
 */

import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";

// Simple 2D simplex noise implementation (seedable)
class SimplexNoise2D {
  private perm: Uint8Array;
  constructor(seed = 42) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates seeded shuffle
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807 + 0) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255];
  }

  noise(x: number, y: number): number {
    // Simplified gradient noise — returns -1..1
    const F2 = 0.5 * (Math.sqrt(3) - 1);
    const G2 = (3 - Math.sqrt(3)) / 6;
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = x - X0, y0 = y - Y0;
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    const g0 = this.grad(this.perm[ii + this.perm[jj]], x0, y0);
    const g1 = this.grad(this.perm[ii + i1 + this.perm[jj + j1]], x1, y1);
    const g2 = this.grad(this.perm[ii + 1 + this.perm[jj + 1]], x2, y2);
    let n0 = 0.5 - x0 * x0 - y0 * y0; n0 = n0 < 0 ? 0 : n0 * n0 * n0 * n0 * g0;
    let n1 = 0.5 - x1 * x1 - y1 * y1; n1 = n1 < 0 ? 0 : n1 * n1 * n1 * n1 * g1;
    let n2 = 0.5 - x2 * x2 - y2 * y2; n2 = n2 < 0 ? 0 : n2 * n2 * n2 * n2 * g2;
    return 70 * (n0 + n1 + n2);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y, v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
  }
}

// FBM (fractional Brownian motion)
function fbm(noise: SimplexNoise2D, x: number, y: number, octaves: number, lacunarity: number, gain: number): number {
  let value = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    value += amp * noise.noise(x * freq, y * freq);
    max += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return value / max;
}

export interface IslandConfig {
  size: number;       // world units (default 80)
  resolution: number; // heightfield segments (default 128)
  seed: number;
  maxHeight: number;  // peak height (default 8)
  waterLevel: number; // (default -0.5)
}

const DEFAULT_CONFIG: IslandConfig = {
  size: 160,
  resolution: 192,
  seed: 42,
  maxHeight: 2.5,
  waterLevel: -0.3,
};

/**
 * Generate a procedural island terrain mesh with BVH collider.
 */
export function generateIslandTerrain(cfg?: Partial<IslandConfig>) {
  const c = { ...DEFAULT_CONFIG, ...cfg };
  const noise = new SimplexNoise2D(c.seed);
  const seg = c.resolution;
  const geo = new THREE.PlaneGeometry(c.size, c.size, seg, seg);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const half = c.size / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Circular falloff — distance from center normalized to 0..1
    const dx = x / half, dz = z / half;
    const distSq = dx * dx + dz * dz;
    const falloff = Math.max(0, 1 - distSq * 0.8); // gentler edge — more usable area

    // FBM noise for organic shape
    const nx = x / c.size;
    const nz = z / c.size;
    const h = fbm(noise, nx * 4, nz * 4, 5, 2.0, 0.5);

    // Combine: height = noise * falloff * maxHeight
    const height = h * falloff * falloff * c.maxHeight;

    pos.setY(i, Math.max(height, c.waterLevel));
  }

  geo.computeVertexNormals();

  // Build BVH for capsule collision + raycasting
  geo.boundsTree = new MeshBVH(geo);

  return geo;
}

/**
 * Generate vertex colors for the terrain based on height.
 */
export function colorTerrainByHeight(geo: THREE.BufferGeometry, maxHeight: number) {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  // Color ramp: water → sand → grass → dirt → rock (flatter terrain, lower thresholds)
  const ramp: [number, number, number, number][] = [
    [-1,   0.18, 0.30, 0.45],  // deep water — dark blue
    [-0.1, 0.50, 0.46, 0.34],  // wet sand
    [0.0,  0.58, 0.52, 0.38],  // sand — warm tan
    [0.15, 0.32, 0.48, 0.24],  // grass — muted green
    [0.6,  0.26, 0.42, 0.20],  // deeper grass
    [1.2,  0.38, 0.35, 0.28],  // dirt — brown
    [1.8,  0.45, 0.42, 0.40],  // rock — grey
    [2.5,  0.52, 0.50, 0.48],  // high rock
  ];

  for (let i = 0; i < pos.count; i++) {
    const h = pos.getY(i);
    // Find ramp segment
    let r = ramp[ramp.length - 1][1], g = ramp[ramp.length - 1][2], b = ramp[ramp.length - 1][3];
    for (let j = 0; j < ramp.length - 1; j++) {
      if (h >= ramp[j][0] && h < ramp[j + 1][0]) {
        const t = (h - ramp[j][0]) / (ramp[j + 1][0] - ramp[j][0]);
        r = ramp[j][1] + t * (ramp[j + 1][1] - ramp[j][1]);
        g = ramp[j][2] + t * (ramp[j + 1][2] - ramp[j][2]);
        b = ramp[j][3] + t * (ramp[j + 1][3] - ramp[j][3]);
        break;
      }
    }
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

/**
 * Sample terrain height at a world XZ position using raycasting.
 */
export function sampleTerrainHeight(
  terrainMesh: THREE.Mesh,
  x: number,
  z: number,
): number {
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(x, 100, z),
    new THREE.Vector3(0, -1, 0),
  );
  raycaster.firstHitOnly = true;
  const hits = raycaster.intersectObject(terrainMesh);
  return hits.length > 0 ? hits[0].point.y : 0;
}

/**
 * Generate scatter positions for nature props on the terrain.
 * Returns positions that are above water and on walkable slopes.
 */
export function generateScatterPositions(
  terrainMesh: THREE.Mesh,
  count: number,
  areaSize: number,
  minHeight: number = 0.3,
  seed: number = 123,
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const noise = new SimplexNoise2D(seed);
  let attempts = 0;
  const maxAttempts = count * 5;
  const half = areaSize / 2;

  while (positions.length < count && attempts < maxAttempts) {
    attempts++;
    // Random position within island radius
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * half * 0.85; // stay inside island edge
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = sampleTerrainHeight(terrainMesh, x, z);

    if (y < minHeight) continue; // skip water/beach

    // Density modulation via noise — clusters feel more natural
    const density = (noise.noise(x * 0.1, z * 0.1) + 1) * 0.5;
    if (Math.random() > density * 0.7) continue;

    positions.push(new THREE.Vector3(x, y, z));
  }
  return positions;
}
