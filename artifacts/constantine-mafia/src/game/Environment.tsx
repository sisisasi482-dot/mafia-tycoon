/**
 * Environment — street lighting, sidewalk trees, planters, and green zones.
 *
 * Architecture:
 *   StreetLamp  — single lamp post with glowing head (no per-lamp point light
 *                 to save GPU fill-rate; a few area lights handle real illumination).
 *   SidewalkTree — small ornamental tree in a concrete planter box.
 *   GreenStrip  — thin grassy median between sidewalk and building zone.
 *
 * Lamp posts line both sides of City A and City B's central boulevards at 32-unit
 * intervals. Trees are placed between every other pair of lamps (~64-unit spacing).
 * A few real point lights at major intersections provide actual scene illumination.
 */
import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Simple lamp-post: pole + horizontal arm + glowing lamp head.
 *  Emissive head gives visual glow without a per-lamp shadow-casting light.
 *  rotY = 0  → arm extends toward negative-z (south side usage)
 *  rotY = π  → arm extends toward positive-z  (north side usage)
 */
function StreetLamp({ x, z, rotY = 0 }: { x: number; z: number; rotY?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      {/* Pole */}
      <mesh castShadow position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.065, 0.10, 7, 6]} />
        <meshStandardMaterial color="#4e5060" roughness={0.65} metalness={0.35} />
      </mesh>
      {/* Arm extending toward the road */}
      <mesh castShadow position={[0, 7.1, -0.9]}>
        <boxGeometry args={[0.09, 0.09, 1.8]} />
        <meshStandardMaterial color="#4e5060" roughness={0.65} metalness={0.35} />
      </mesh>
      {/* Lamp housing */}
      <mesh position={[0, 6.88, -1.72]}>
        <boxGeometry args={[0.52, 0.20, 0.85]} />
        <meshStandardMaterial
          color="#ffeecc"
          emissive="#ffdd88"
          emissiveIntensity={2.2}
          roughness={0.45}
        />
      </mesh>
      {/* Small reflector cap on top */}
      <mesh position={[0, 7.0, -1.72]}>
        <boxGeometry args={[0.56, 0.06, 0.90]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

/** Ornamental sidewalk tree in a low concrete planter box. */
function SidewalkTree({ x, z, treeHeight = 3.2 }: { x: number; z: number; treeHeight?: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* Concrete planter box */}
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[1.4, 0.4, 1.4]} />
        <meshStandardMaterial color="#424242" roughness={0.88} />
      </mesh>
      {/* Soil fill */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.41, 0]}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshStandardMaterial color="#1a1208" roughness={0.99} />
      </mesh>
      {/* Trunk */}
      <mesh castShadow position={[0, treeHeight * 0.5 + 0.4, 0]}>
        <cylinderGeometry args={[0.12, 0.18, treeHeight, 6]} />
        <meshStandardMaterial color="#3e2a16" roughness={0.94} />
      </mesh>
      {/* Lower canopy */}
      <mesh castShadow position={[0, treeHeight + 0.4, 0]}>
        <sphereGeometry args={[treeHeight * 0.45, 7, 7]} />
        <meshStandardMaterial color="#245a18" roughness={0.87} />
      </mesh>
      {/* Upper canopy highlight */}
      <mesh castShadow position={[0, treeHeight * 1.22 + 0.4, 0]}>
        <sphereGeometry args={[treeHeight * 0.30, 6, 6]} />
        <meshStandardMaterial color="#2d7020" roughness={0.87} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// City A — warm sodium lamp posts along both sides of the central boulevard
// ─────────────────────────────────────────────────────────────────────────────
//  Boulevard: x −435 → −185, z = 0
//  South lamp row: z ≈ −36 (just inside sidewalk, arm faces road → rotY 0)
//  North lamp row: z ≈ +36 (arm faces road → rotY π)

const CITY_A_LAMP_X: number[] = [];
for (let x = -426; x <= -194; x += 32) CITY_A_LAMP_X.push(x);

const CITY_A_TREE_X: number[] = [];
for (let x = -410; x <= -210; x += 64) CITY_A_TREE_X.push(x);

function CityAStreetLamps() {
  return (
    <>
      {/* Area fill lights — 2 real point lights per city side */}
      <pointLight position={[-310, 9, -34]} color="#ffcc66" intensity={55} distance={180} decay={2} />
      <pointLight position={[-310, 9,  34]} color="#ffcc66" intensity={55} distance={180} decay={2} />

      {/* South lamp row */}
      {CITY_A_LAMP_X.map((x, i) => (
        <StreetLamp key={`ca-ls-${i}`} x={x} z={-36} rotY={0} />
      ))}
      {/* North lamp row (arm faces south toward road) */}
      {CITY_A_LAMP_X.map((x, i) => (
        <StreetLamp key={`ca-ln-${i}`} x={x} z={36} rotY={Math.PI} />
      ))}

      {/* Sidewalk trees — south and north rows, between lamps */}
      {CITY_A_TREE_X.map((x, i) => (
        <SidewalkTree key={`ca-ts-${i}`} x={x} z={-44} treeHeight={3.0} />
      ))}
      {CITY_A_TREE_X.map((x, i) => (
        <SidewalkTree key={`ca-tn-${i}`} x={x} z={44} treeHeight={3.0} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// City B — cool white-blue LED lamp posts (modern downtown aesthetic)
// ─────────────────────────────────────────────────────────────────────────────

const CITY_B_LAMP_X: number[] = [];
for (let x = 194; x <= 426; x += 32) CITY_B_LAMP_X.push(x);

const CITY_B_TREE_X: number[] = [];
for (let x = 210; x <= 410; x += 64) CITY_B_TREE_X.push(x);

function CityBStreetLamps() {
  return (
    <>
      {/* Area fill lights */}
      <pointLight position={[310, 9, -34]} color="#cce8ff" intensity={60} distance={190} decay={2} />
      <pointLight position={[310, 9,  34]} color="#cce8ff" intensity={60} distance={190} decay={2} />

      {/* South lamp row */}
      {CITY_B_LAMP_X.map((x, i) => (
        <StreetLamp key={`cb-ls-${i}`} x={x} z={-36} rotY={0} />
      ))}
      {/* North lamp row */}
      {CITY_B_LAMP_X.map((x, i) => (
        <StreetLamp key={`cb-ln-${i}`} x={x} z={36} rotY={Math.PI} />
      ))}

      {/* Sidewalk trees — taller, more ornamental for modern downtown */}
      {CITY_B_TREE_X.map((x, i) => (
        <SidewalkTree key={`cb-ts-${i}`} x={x} z={-44} treeHeight={3.8} />
      ))}
      {CITY_B_TREE_X.map((x, i) => (
        <SidewalkTree key={`cb-tn-${i}`} x={x} z={44} treeHeight={3.8} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Highway shoulder lamps — supplement the GLB light-square-double models
// ─────────────────────────────────────────────────────────────────────────────

const HW_LAMP_X: number[] = [];
for (let x = -144; x <= 144; x += 48) HW_LAMP_X.push(x);

function HighwayShoulderLamps() {
  return (
    <>
      {/* 2 real area lights for the highway corridor */}
      <pointLight position={[0,  9, -13]} color="#ffdd99" intensity={35} distance={160} decay={2} />
      <pointLight position={[0,  9,  13]} color="#ffdd99" intensity={35} distance={160} decay={2} />

      {/* Lamp posts — south side only (GLB models cover most of north) */}
      {HW_LAMP_X.map((x, i) => (
        <StreetLamp key={`hw-l-${i}`} x={x} z={-16} rotY={0} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Green building-perimeter zones — lush strips along both city building bands
// (These add a continuous green border at the building-zone / sidewalk boundary)
// ─────────────────────────────────────────────────────────────────────────────

function BuildingPerimeterTrees() {
  // Scattered trees along the north building perimeter of City A
  const cityATrees: { x: number; z: number }[] = [];
  for (let x = -420; x <= -200; x += 48) {
    cityATrees.push({ x, z:  48 }); // north perimeter
    cityATrees.push({ x: x + 16, z: -48 }); // south perimeter
  }

  // City B — slightly denser near skyscrapers
  const cityBTrees: { x: number; z: number }[] = [];
  for (let x = 200; x <= 420; x += 48) {
    cityBTrees.push({ x, z:  48 });
    cityBTrees.push({ x: x + 16, z: -48 });
  }

  return (
    <>
      {cityATrees.map((t, i) => (
        <SidewalkTree key={`bp-a-${i}`} x={t.x} z={t.z} treeHeight={2.5 + (i % 3) * 0.4} />
      ))}
      {cityBTrees.map((t, i) => (
        <SidewalkTree key={`bp-b-${i}`} x={t.x} z={t.z} treeHeight={2.8 + (i % 3) * 0.5} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Public export
// ─────────────────────────────────────────────────────────────────────────────
export function Environment() {
  return (
    <group>
      <CityAStreetLamps />
      <CityBStreetLamps />
      <HighwayShoulderLamps />
      <BuildingPerimeterTrees />
    </group>
  );
}
