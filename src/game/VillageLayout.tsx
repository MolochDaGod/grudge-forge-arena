/**
 * VillageLayout.tsx
 * Procedural medieval village — central plaza, radial streets, buildings, props.
 * Matches the Medieval Village Pack aesthetic from GrudgeBuilder catalog
 * using simple Three.js geometry (no CDN models needed).
 */

import { useMemo } from "react";
import * as THREE from "three";

// ── Building definitions ──

interface BuildingDef {
  name: string;
  w: number; d: number; h: number;    // wall dimensions
  roofH: number;                       // roof peak height above walls
  roofType: "peaked" | "flat" | "canopy";
  wallColor: string;
  roofColor: string;
  trimColor: string;
  pos: [number, number, number];       // world position
  rot: number;                         // Y rotation in radians
}

// Village center at origin, buildings arranged along 4 streets
const BUILDINGS: BuildingDef[] = [
  // ── North street (cottages) ──
  { name: "Small Cottage",    w: 4, d: 3.5, h: 3,   roofH: 1.8, roofType: "peaked", wallColor: "#8b6a4a", roofColor: "#5a3a20", trimColor: "#4a3018", pos: [6, 0, -12], rot: 0 },
  { name: "Farmhouse",        w: 5, d: 4,   h: 3.5, roofH: 2.0, roofType: "peaked", wallColor: "#9a7a58", roofColor: "#4a2a15", trimColor: "#3a2010", pos: [-7, 0, -14], rot: 0.2 },

  // ── East street (stone buildings) ──
  { name: "Stone House",      w: 5, d: 5,   h: 4,   roofH: 1.5, roofType: "flat",   wallColor: "#7a7a78", roofColor: "#5a5a58", trimColor: "#4a4a48", pos: [14, 0, 5], rot: Math.PI / 2 },
  { name: "Guard Tower",      w: 3, d: 3,   h: 7,   roofH: 1.0, roofType: "peaked", wallColor: "#686868", roofColor: "#4a4a48", trimColor: "#3a3a38", pos: [16, 0, -6], rot: Math.PI / 2 },

  // ── South street (commerce) ──
  { name: "Inn & Tavern",     w: 7, d: 5,   h: 4.5, roofH: 2.5, roofType: "peaked", wallColor: "#a08060", roofColor: "#6a3a1a", trimColor: "#4a2a10", pos: [-5, 0, 14], rot: Math.PI },
  { name: "Market Stand",     w: 3, d: 2.5, h: 2.5, roofH: 0.8, roofType: "canopy", wallColor: "#c0a080", roofColor: "#cc4444", trimColor: "#aa3333", pos: [5, 0, 12], rot: Math.PI },
  { name: "Market Stand 2",   w: 3, d: 2.5, h: 2.5, roofH: 0.8, roofType: "canopy", wallColor: "#c0a080", roofColor: "#3366aa", trimColor: "#224488", pos: [10, 0, 13], rot: Math.PI + 0.3 },

  // ── West street (workshops) ──
  { name: "Blacksmith",       w: 5, d: 4,   h: 3.5, roofH: 1.5, roofType: "flat",   wallColor: "#5a5a58", roofColor: "#3a3a38", trimColor: "#2a2a28", pos: [-14, 0, -4], rot: -Math.PI / 2 },
  { name: "Sawmill",          w: 6, d: 4,   h: 3,   roofH: 1.8, roofType: "peaked", wallColor: "#7a5a38", roofColor: "#5a3a20", trimColor: "#4a2a10", pos: [-15, 0, 8], rot: -Math.PI / 2 + 0.2 },

  // ── Near-center extras ──
  { name: "Well House",       w: 2.5, d: 2.5, h: 3, roofH: 1.5, roofType: "peaked", wallColor: "#888888", roofColor: "#555555", trimColor: "#444444", pos: [3, 0, -4], rot: 0.5 },
  { name: "Stable",           w: 6, d: 3.5, h: 3,   roofH: 1.0, roofType: "flat",   wallColor: "#8a6a40", roofColor: "#5a4a30", trimColor: "#4a3a20", pos: [-8, 0, 6], rot: 0.1 },
];

// ── Street segment definitions ──

interface StreetDef {
  from: [number, number];
  to: [number, number];
  width: number;
}

const STREETS: StreetDef[] = [
  // 4 radial streets from center
  { from: [0, 0], to: [0, -22],  width: 3 },   // north
  { from: [0, 0], to: [22, 0],   width: 3 },   // east
  { from: [0, 0], to: [0, 22],   width: 3 },   // south
  { from: [0, 0], to: [-22, 0],  width: 3 },   // west
  // cross streets
  { from: [-10, -12], to: [10, -12], width: 2 },
  { from: [-10, 12],  to: [10, 12],  width: 2 },
];

// ── React components ──

function ProceduralBuilding({ def }: { def: BuildingDef }) {
  const { w, d, h, roofH, roofType, wallColor, roofColor, trimColor, pos, rot } = def;

  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {/* Walls */}
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={wallColor} roughness={0.85} />
      </mesh>

      {/* Window holes (dark rectangles on front face) */}
      <mesh position={[w * 0.25, h * 0.6, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.18, h * 0.22]} />
        <meshStandardMaterial color="#1a1a2a" />
      </mesh>
      <mesh position={[-w * 0.25, h * 0.6, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.18, h * 0.22]} />
        <meshStandardMaterial color="#1a1a2a" />
      </mesh>

      {/* Door (dark rectangle on front face) */}
      <mesh position={[0, h * 0.3, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.2, h * 0.55]} />
        <meshStandardMaterial color="#2a1a0a" />
      </mesh>

      {/* Roof */}
      {roofType === "peaked" && (
        <mesh position={[0, h + roofH / 2, 0]} castShadow>
          <coneGeometry args={[Math.max(w, d) * 0.75, roofH, 4]} />
          <meshStandardMaterial color={roofColor} roughness={0.8} />
        </mesh>
      )}
      {roofType === "flat" && (
        <mesh position={[0, h + 0.1, 0]} castShadow>
          <boxGeometry args={[w + 0.4, 0.2, d + 0.4]} />
          <meshStandardMaterial color={roofColor} roughness={0.8} />
        </mesh>
      )}
      {roofType === "canopy" && (
        <group>
          {/* Angled canopy */}
          <mesh position={[0, h + roofH * 0.3, -0.3]} rotation={[0.25, 0, 0]} castShadow>
            <boxGeometry args={[w + 0.8, 0.1, d + 1.2]} />
            <meshStandardMaterial color={roofColor} roughness={0.7} side={THREE.DoubleSide} />
          </mesh>
          {/* Front poles */}
          <mesh position={[w / 2 - 0.15, h / 2, d / 2 + 0.5]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, h, 6]} />
            <meshStandardMaterial color={trimColor} roughness={0.9} />
          </mesh>
          <mesh position={[-w / 2 + 0.15, h / 2, d / 2 + 0.5]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, h, 6]} />
            <meshStandardMaterial color={trimColor} roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Foundation trim */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[w + 0.3, 0.1, d + 0.3]} />
        <meshStandardMaterial color={trimColor} roughness={0.9} />
      </mesh>
    </group>
  );
}

function StreetSegment({ def }: { def: StreetDef }) {
  const { from, to, width } = def;
  const dx = to[0] - from[0], dz = to[1] - from[1];
  const len = Math.sqrt(dx * dx + dz * dz);
  const cx = (from[0] + to[0]) / 2;
  const cz = (from[1] + to[1]) / 2;
  const angle = Math.atan2(dx, dz);

  return (
    <mesh position={[cx, 0.02, cz]} rotation={[0, angle, 0]} receiveShadow>
      <boxGeometry args={[width, 0.04, len]} />
      <meshStandardMaterial color="#6a6258" roughness={0.95} />
    </mesh>
  );
}

function CentralPlaza() {
  return (
    <group>
      {/* Stone circle */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6, 32]} />
        <meshStandardMaterial color="#7a7268" roughness={0.9} />
      </mesh>
      {/* Well in center */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.8, 1.0, 12]} />
          <meshStandardMaterial color="#808080" roughness={0.9} />
        </mesh>
        {/* Well roof */}
        <mesh position={[0, 1.6, 0]} castShadow>
          <coneGeometry args={[1.0, 0.8, 4]} />
          <meshStandardMaterial color="#5a3a20" roughness={0.85} />
        </mesh>
        {/* Posts */}
        <mesh position={[0.5, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 5]} />
          <meshStandardMaterial color="#4a3018" roughness={0.9} />
        </mesh>
        <mesh position={[-0.5, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 1.6, 5]} />
          <meshStandardMaterial color="#4a3018" roughness={0.9} />
        </mesh>
      </group>
      {/* Campfire near plaza */}
      <group position={[3.5, 0, 2.5]}>
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.5, 0.3, 8]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
        </mesh>
        <pointLight position={[0, 0.5, 0]} intensity={1.5} distance={8} color="#ff8844" />
      </group>
      {/* Scatter barrels + crates */}
      {[
        [4, 0.4, -3], [-3.5, 0.4, 4], [5, 0.4, 3.5], [-4, 0.5, -2],
      ].map(([x, y, z], i) => (
        <mesh key={`barrel-${i}`} position={[x, y, z]} castShadow>
          <cylinderGeometry args={[0.35, 0.4, 0.8, 8]} />
          <meshStandardMaterial color="#6a4a2a" roughness={0.85} />
        </mesh>
      ))}
      {[
        [-5, 0.35, 1], [4.5, 0.35, -1.5],
      ].map(([x, y, z], i) => (
        <mesh key={`crate-${i}`} position={[x, y, z]} castShadow rotation={[0, i * 0.7, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshStandardMaterial color="#8a6a40" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// ── Main village component ──

export function VillageLayout() {
  return (
    <group>
      {/* Central plaza with well + campfire */}
      <CentralPlaza />

      {/* Streets */}
      {STREETS.map((s, i) => (
        <StreetSegment key={`street-${i}`} def={s} />
      ))}

      {/* Buildings */}
      {BUILDINGS.map((b, i) => (
        <ProceduralBuilding key={`bldg-${i}`} def={b} />
      ))}
    </group>
  );
}
