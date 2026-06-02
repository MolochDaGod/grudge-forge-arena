/**
 * NavGrid.ts
 * Grid-based A* pathfinder for AI navigation on procedural island terrain.
 *
 * Samples the terrain heightfield into a walkability grid, then runs A*
 * to produce waypoint paths that avoid steep slopes, water, and obstacles.
 *
 * This is the lightweight alternative to a full navmesh — suitable for
 * the Forge testing ground where the terrain is generated at runtime.
 */

import * as THREE from "three";
import { sampleTerrainHeight } from "./IslandTerrain";

// ── Grid configuration ──

export interface NavGridConfig {
  /** World size of the area to grid (centered at origin). */
  worldSize: number;
  /** Number of cells per axis. Total cells = resolution². */
  resolution: number;
  /** Max walkable slope (height delta per cell). */
  maxSlope: number;
  /** Min walkable height (below = water). */
  minHeight: number;
}

const DEFAULT_CONFIG: NavGridConfig = {
  worldSize: 80,
  resolution: 64,
  maxSlope: 2.0,
  minHeight: 0.2,
};

// ── A* node ──

interface AStarNode {
  x: number;
  z: number;
  g: number;
  h: number;
  f: number;
  parent: AStarNode | null;
}

// ── NavGrid class ──

export class NavGrid {
  private cfg: NavGridConfig;
  private cellSize: number;
  private halfWorld: number;
  /** Walkability grid: true = walkable. Index = z * resolution + x. */
  private walkable: boolean[];
  /** Height at each grid cell center. */
  private heights: Float32Array;

  constructor(terrainMesh: THREE.Mesh, config?: Partial<NavGridConfig>) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.cellSize = this.cfg.worldSize / this.cfg.resolution;
    this.halfWorld = this.cfg.worldSize / 2;

    const n = this.cfg.resolution;
    this.walkable = new Array(n * n).fill(false);
    this.heights = new Float32Array(n * n);

    // Sample terrain heights
    for (let gz = 0; gz < n; gz++) {
      for (let gx = 0; gx < n; gx++) {
        const wx = (gx + 0.5) * this.cellSize - this.halfWorld;
        const wz = (gz + 0.5) * this.cellSize - this.halfWorld;
        const h = sampleTerrainHeight(terrainMesh, wx, wz);
        const idx = gz * n + gx;
        this.heights[idx] = h;
      }
    }

    // Compute walkability: above water + not too steep compared to neighbors
    for (let gz = 0; gz < n; gz++) {
      for (let gx = 0; gx < n; gx++) {
        const idx = gz * n + gx;
        const h = this.heights[idx];

        if (h < this.cfg.minHeight) continue; // water

        // Check slope against all 8 neighbors
        let tooSteep = false;
        for (let dz = -1; dz <= 1 && !tooSteep; dz++) {
          for (let dx = -1; dx <= 1 && !tooSteep; dx++) {
            if (dx === 0 && dz === 0) continue;
            const nx = gx + dx, nz = gz + dz;
            if (nx < 0 || nx >= n || nz < 0 || nz >= n) { tooSteep = true; continue; }
            const nh = this.heights[nz * n + nx];
            if (Math.abs(h - nh) > this.cfg.maxSlope) tooSteep = true;
          }
        }
        if (!tooSteep) this.walkable[idx] = true;
      }
    }
  }

  // ── World ↔ Grid conversion ──

  private worldToGrid(wx: number, wz: number): [number, number] {
    const gx = Math.floor((wx + this.halfWorld) / this.cellSize);
    const gz = Math.floor((wz + this.halfWorld) / this.cellSize);
    const n = this.cfg.resolution;
    return [Math.max(0, Math.min(n - 1, gx)), Math.max(0, Math.min(n - 1, gz))];
  }

  private gridToWorld(gx: number, gz: number): THREE.Vector3 {
    const wx = (gx + 0.5) * this.cellSize - this.halfWorld;
    const wz = (gz + 0.5) * this.cellSize - this.halfWorld;
    const h = this.heights[gz * this.cfg.resolution + gx];
    return new THREE.Vector3(wx, h, wz);
  }

  // ── A* pathfinding ──

  /**
   * Find a path from `start` to `goal` in world coordinates.
   * Returns an array of world-space waypoints, or null if no path exists.
   * The first waypoint is the next step (start is omitted).
   */
  findPath(start: THREE.Vector3, goal: THREE.Vector3): THREE.Vector3[] | null {
    const [sx, sz] = this.worldToGrid(start.x, start.z);
    const [gx, gz] = this.worldToGrid(goal.x, goal.z);
    const n = this.cfg.resolution;

    // If goal is unwalkable, find nearest walkable cell
    let goalX = gx, goalZ = gz;
    if (!this.walkable[goalZ * n + goalX]) {
      const nearest = this.nearestWalkable(goalX, goalZ);
      if (!nearest) return null;
      [goalX, goalZ] = nearest;
    }

    // If start is unwalkable, find nearest walkable
    let startX = sx, startZ = sz;
    if (!this.walkable[startZ * n + startX]) {
      const nearest = this.nearestWalkable(startX, startZ);
      if (!nearest) return null;
      [startX, startZ] = nearest;
    }

    // Already at goal
    if (startX === goalX && startZ === goalZ) return [];

    // A* with 8-directional movement
    const open = new Map<number, AStarNode>();
    const closed = new Set<number>();

    const heuristic = (x: number, z: number) =>
      Math.sqrt((x - goalX) ** 2 + (z - goalZ) ** 2);

    const startNode: AStarNode = {
      x: startX, z: startZ,
      g: 0, h: heuristic(startX, startZ), f: 0, parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    open.set(startZ * n + startX, startNode);

    const DIRS = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    const COSTS = [1, 1, 1, 1, 1.414, 1.414, 1.414, 1.414];

    let iterations = 0;
    const MAX_ITERATIONS = 2000;

    while (open.size > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      // Pop lowest f from open
      let best: AStarNode | null = null;
      let bestKey = -1;
      for (const [key, node] of open) {
        if (!best || node.f < best.f) { best = node; bestKey = key; }
      }
      if (!best) break;
      open.delete(bestKey);
      closed.add(bestKey);

      // Goal reached
      if (best.x === goalX && best.z === goalZ) {
        return this.reconstructPath(best);
      }

      // Expand neighbors
      for (let d = 0; d < 8; d++) {
        const nx = best.x + DIRS[d][0];
        const nz = best.z + DIRS[d][1];
        if (nx < 0 || nx >= n || nz < 0 || nz >= n) continue;

        const nKey = nz * n + nx;
        if (closed.has(nKey)) continue;
        if (!this.walkable[nKey]) continue;

        // Height-aware cost: steeper = more expensive
        const hDiff = Math.abs(
          this.heights[best.z * n + best.x] - this.heights[nz * n + nx]
        );
        const slopePenalty = 1 + hDiff * 0.5;
        const tentG = best.g + COSTS[d] * slopePenalty;

        const existing = open.get(nKey);
        if (existing && tentG >= existing.g) continue;

        const node: AStarNode = {
          x: nx, z: nz,
          g: tentG, h: heuristic(nx, nz),
          f: tentG + heuristic(nx, nz),
          parent: best,
        };
        open.set(nKey, node);
      }
    }

    return null; // no path
  }

  private reconstructPath(node: AStarNode): THREE.Vector3[] {
    const raw: THREE.Vector3[] = [];
    let curr: AStarNode | null = node;
    while (curr) {
      raw.unshift(this.gridToWorld(curr.x, curr.z));
      curr = curr.parent;
    }
    // Remove start position, keep only waypoints ahead
    if (raw.length > 1) raw.shift();

    // Simplify: skip waypoints that are in a straight line
    if (raw.length <= 2) return raw;
    const simplified: THREE.Vector3[] = [raw[0]];
    for (let i = 1; i < raw.length - 1; i++) {
      const prev = raw[i - 1], curr = raw[i], next = raw[i + 1];
      const d1x = curr.x - prev.x, d1z = curr.z - prev.z;
      const d2x = next.x - curr.x, d2z = next.z - curr.z;
      // If direction changes significantly, keep this waypoint
      const cross = Math.abs(d1x * d2z - d1z * d2x);
      if (cross > 0.01) simplified.push(curr);
    }
    simplified.push(raw[raw.length - 1]);
    return simplified;
  }

  private nearestWalkable(gx: number, gz: number): [number, number] | null {
    const n = this.cfg.resolution;
    for (let r = 1; r < 10; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const nx = gx + dx, nz = gz + dz;
          if (nx >= 0 && nx < n && nz >= 0 && nz < n && this.walkable[nz * n + nx]) {
            return [nx, nz];
          }
        }
      }
    }
    return null;
  }

  /**
   * Generate random walkable patrol waypoints near a position.
   */
  patrolPoints(center: THREE.Vector3, radius: number, count: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const [cx, cz] = this.worldToGrid(center.x, center.z);
    const cellRadius = Math.ceil(radius / this.cellSize);
    const n = this.cfg.resolution;
    const candidates: [number, number][] = [];

    for (let dz = -cellRadius; dz <= cellRadius; dz++) {
      for (let dx = -cellRadius; dx <= cellRadius; dx++) {
        if (dx * dx + dz * dz > cellRadius * cellRadius) continue;
        const gx = cx + dx, gz = cz + dz;
        if (gx >= 0 && gx < n && gz >= 0 && gz < n && this.walkable[gz * n + gx]) {
          candidates.push([gx, gz]);
        }
      }
    }

    // Pick `count` random from candidates
    for (let i = 0; i < count && candidates.length > 0; i++) {
      const idx = Math.floor(Math.random() * candidates.length);
      const [gx, gz] = candidates.splice(idx, 1)[0];
      points.push(this.gridToWorld(gx, gz));
    }
    return points;
  }
}
