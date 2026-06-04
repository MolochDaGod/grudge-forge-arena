/**
 * ColliderSystem.ts
 * BVH-accelerated collision for the arena.
 *
 * Industry best practices:
 * 1. Merge all static geometry into ONE collider mesh (StaticGeometryGenerator)
 * 2. Build BVH with SAH strategy (best query perf, slower build — done once at load)
 * 3. Cache raycaster (reuse instead of allocating per frame)
 * 4. firstHitOnly = true for terrain height queries
 * 5. Capsule shapecast for character collision response
 *
 * Usage:
 *   const collider = new ColliderSystem();
 *   collider.buildFromMeshes([terrainMesh, ...buildingMeshes]);
 *   const y = collider.heightAt(x, z);
 *   const { position, onGround } = collider.capsuleCollide(pos, radius, height);
 */

import * as THREE from "three";
import {
  MeshBVH,
  StaticGeometryGenerator,
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";

// Patch Three.js prototypes once for accelerated raycasting everywhere
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// ── Reusable temporaries (avoid per-frame allocation) ──
const _ray = new THREE.Raycaster();
_ray.firstHitOnly = true;
const _downDir = new THREE.Vector3(0, -1, 0);
const _origin = new THREE.Vector3();
const _tempVec = new THREE.Vector3();
const _tempVec2 = new THREE.Vector3();
const _tempBox = new THREE.Box3();
const _tempMat = new THREE.Matrix4();
const _tempSeg = new THREE.Line3();

export class ColliderSystem {
  /** The merged collision mesh with BVH. */
  mesh: THREE.Mesh | null = null;
  private bvh: MeshBVH | null = null;

  /**
   * Build the merged BVH collider from an array of static meshes.
   * Call once during loading — typically with [terrainMesh, ...buildingMeshes].
   */
  buildFromMeshes(meshes: THREE.Mesh[]): void {
    // Create a temporary group containing all meshes
    const group = new THREE.Group();
    for (const m of meshes) {
      // Clone to avoid modifying originals
      const clone = m.clone();
      clone.updateMatrixWorld(true);
      group.add(clone);
    }
    group.updateMatrixWorld(true);

    // Merge into single geometry (position-only for collision)
    const generator = new StaticGeometryGenerator(group);
    generator.attributes = ["position"];
    const mergedGeo = generator.generate();

    // Build BVH with SAH (best query performance)
    this.bvh = new MeshBVH(mergedGeo, {
      strategy: 0, // SAH
      maxDepth: 40,
      maxLeafSize: 10,
    });
    mergedGeo.boundsTree = this.bvh;

    this.mesh = new THREE.Mesh(mergedGeo);
    this.mesh.visible = false; // collision only, not rendered
  }

  /**
   * Build BVH on a single mesh (e.g., terrain only).
   * Faster than merging if buildings aren't ready yet.
   */
  buildFromSingleMesh(terrainMesh: THREE.Mesh): void {
    const geo = terrainMesh.geometry;
    if (!geo.boundsTree) {
      geo.boundsTree = new MeshBVH(geo, {
        strategy: 0,
        maxDepth: 40,
        maxLeafSize: 10,
      });
    }
    this.bvh = geo.boundsTree as MeshBVH;
    this.mesh = terrainMesh;
  }

  /**
   * Sample terrain height at (x, z) using cached downward raycast.
   * Returns height Y, or 0 if no hit.
   */
  heightAt(x: number, z: number): number {
    if (!this.mesh) return 0;
    _origin.set(x, 200, z);
    _ray.set(_origin, _downDir);
    const hits = _ray.intersectObject(this.mesh);
    return hits.length > 0 ? hits[0].point.y : 0;
  }

  /**
   * Capsule collision against the merged BVH.
   * Returns adjusted position and whether the capsule is on the ground.
   *
   * @param position  Current world position (center of capsule base)
   * @param radius    Capsule radius
   * @param height    Capsule segment height (total capsule = height + 2*radius)
   * @param velocity  Current velocity (modified in-place for ground clamping)
   */
  capsuleCollide(
    position: THREE.Vector3,
    radius: number,
    height: number,
    velocity: THREE.Vector3,
  ): { onGround: boolean } {
    if (!this.bvh || !this.mesh) return { onGround: false };

    // Build capsule segment in world space
    _tempSeg.start.copy(position);
    _tempSeg.end.copy(position).y += height;

    // Transform to collider local space
    _tempMat.copy(this.mesh.matrixWorld).invert();
    _tempSeg.start.applyMatrix4(_tempMat);
    _tempSeg.end.applyMatrix4(_tempMat);

    // Expand AABB by capsule bounds
    _tempBox.makeEmpty();
    _tempBox.expandByPoint(_tempSeg.start);
    _tempBox.expandByPoint(_tempSeg.end);
    _tempBox.min.addScalar(-radius);
    _tempBox.max.addScalar(radius);

    // Shapecast — push capsule out of triangles
    this.bvh.shapecast({
      intersectsBounds: (box: THREE.Box3) => box.intersectsBox(_tempBox),
      intersectsTriangle: (tri: any) => {
        const triPoint = _tempVec;
        const capsulePoint = _tempVec2;
        const distance = tri.closestPointToSegment(
          _tempSeg, triPoint, capsulePoint,
        );
        if (distance < radius) {
          const depth = radius - distance;
          const dir = capsulePoint.sub(triPoint).normalize();
          _tempSeg.start.addScaledVector(dir, depth);
          _tempSeg.end.addScaledVector(dir, depth);
        }
        return false; // continue
      },
    });

    // Transform back to world space
    const newPos = _tempVec.copy(_tempSeg.start).applyMatrix4(this.mesh.matrixWorld);
    const delta = _tempVec2.subVectors(newPos, position);

    // Ground detection: collision pushed us upward
    const onGround = delta.y > Math.abs(velocity.y * 0.016 * 0.25);

    // Apply correction
    const offset = Math.max(0, delta.length() - 1e-5);
    delta.normalize().multiplyScalar(offset);
    position.add(delta);

    // Kill velocity component into collision surface
    if (onGround) {
      velocity.y = Math.max(0, velocity.y);
    }

    return { onGround };
  }

  /** Dispose BVH and release memory. */
  dispose(): void {
    if (this.mesh?.geometry) {
      (this.mesh.geometry as any).disposeBoundsTree?.();
    }
    this.mesh = null;
    this.bvh = null;
  }
}
