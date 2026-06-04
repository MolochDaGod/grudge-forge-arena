/**
 * GLBMap.tsx
 * Loads a GLB model as the arena map floor.
 * Builds BVH collider from all meshes for terrain height queries.
 */

import { useRef, useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three-stdlib";
import { ColliderSystem } from "./ColliderSystem";
import type { MapDef } from "./MapDefinitions";

const gltfLoader = new GLTFLoader();

interface GLBMapProps {
  mapDef: MapDef;
  collider: ColliderSystem;
  onReady: (meshes: THREE.Mesh[]) => void;
}

export function GLBMap({ mapDef, collider, onReady }: GLBMapProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!mapDef.modelUrl) return;
    let cancelled = false;

    async function load() {
      try {
        const gltf = await gltfLoader.loadAsync(mapDef.modelUrl!);
        if (cancelled) return;

        const scene = gltf.scene;
        scene.scale.setScalar(mapDef.scale ?? 1);
        scene.updateMatrixWorld(true);

        // Collect all meshes for collider
        const meshes: THREE.Mesh[] = [];
        scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            meshes.push(child);
          }
        });

        // Build BVH collider from all map meshes
        if (meshes.length > 0) {
          collider.buildFromMeshes(meshes);
        }

        // Mount into scene
        if (groupRef.current) {
          while (groupRef.current.children.length > 0) {
            groupRef.current.remove(groupRef.current.children[0]);
          }
          groupRef.current.add(scene);
        }

        setLoaded(true);
        onReady(meshes);
      } catch (err) {
        console.error("[GLBMap] Failed to load:", mapDef.modelUrl, err);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [mapDef.modelUrl, mapDef.scale, collider, onReady]);

  return (
    <group ref={groupRef}>
      {/* GLB scene is added programmatically above */}
      {/* Cave/underground ambient lighting */}
      {mapDef.sky === "cave" && (
        <>
          <pointLight position={[0, 8, 0]} intensity={2} distance={40} color="#ff9944" />
          <pointLight position={[15, 6, 15]} intensity={1.5} distance={30} color="#6688cc" />
          <pointLight position={[-15, 6, -10]} intensity={1.5} distance={30} color="#cc8866" />
          <pointLight position={[0, 4, -20]} intensity={1} distance={25} color="#88aacc" />
        </>
      )}
    </group>
  );
}
