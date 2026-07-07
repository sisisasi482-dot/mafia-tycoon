import React, { useMemo } from 'react';
import * as THREE from 'three';

export function City() {
  const buildings = useMemo(() => {
    const list = [];
    const seed = 12345;
    let s = seed;
    const random = () => {
      s = Math.sin(s) * 10000;
      return s - Math.floor(s);
    };

    // Ali Mendjeli (Brutalist blocks) x: -200 to -50, z: -100 to 100
    for (let i = 0; i < 60; i++) {
      const x = -200 + random() * 150;
      const z = -100 + random() * 200;
      list.push({ x, y: 7.5, z, w: 15, h: 15, d: 15, color: '#2a2a2a', emissive: '#FFB347', emissiveIntensity: random() > 0.5 ? 0.2 : 0 });
    }

    // Centre-Ville (French colonial) x: -50 to 100, z: -100 to 100
    for (let i = 0; i < 80; i++) {
      const x = -50 + random() * 150;
      const z = -100 + random() * 200;
      const h = 10 + random() * 15;
      list.push({ x, y: h / 2, z, w: 8 + random() * 5, h, d: 8 + random() * 5, color: '#C4A84F', emissive: '#FFB347', emissiveIntensity: random() > 0.7 ? 0.3 : 0 });
    }

    // Old City (Dense medina & Bridge) x: 100 to 250, z: -50 to 50
    for (let i = 0; i < 100; i++) {
      const x = 100 + random() * 150;
      const z = -50 + random() * 100;
      // Gap for gorge
      if (x > 140 && x < 180) continue; 
      const h = 4 + random() * 6;
      list.push({ x, y: h / 2, z, w: 4 + random() * 4, h, d: 4 + random() * 4, color: '#8B7355', emissive: '#000000', emissiveIntensity: 0 });
    }
    
    // The Bridge Pylons
    list.push({ x: 145, y: 15, z: 0, w: 4, h: 40, d: 6, color: '#333333', emissive: '#000000', emissiveIntensity: 0 });
    list.push({ x: 175, y: 15, z: 0, w: 4, h: 40, d: 6, color: '#333333', emissive: '#000000', emissiveIntensity: 0 });

    return list;
  }, []);

  const streetLights = useMemo(() => {
    const list = [];
    for(let x = -200; x < 100; x += 30) {
      list.push({ x, y: 6, z: -10 });
      list.push({ x, y: 6, z: 10 });
    }
    return list;
  }, []);

  return (
    <group>
      {/* Ground Plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
      </mesh>
      
      {/* Gorge */}
      <mesh receiveShadow position={[160, -15, 0]}>
        <boxGeometry args={[40, 30, 200]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Bridge Deck */}
      <mesh castShadow receiveShadow position={[160, 5, 0]}>
        <boxGeometry args={[40, 1, 8]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Buildings */}
      {buildings.map((b, i) => (
        <mesh key={i} castShadow receiveShadow position={[b.x, b.y, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial 
            color={b.color} 
            emissive={b.emissive}
            emissiveIntensity={b.emissiveIntensity}
            roughness={0.9} 
          />
        </mesh>
      ))}

      {/* Streetlights */}
      {streetLights.map((light, i) => (
        <group key={`light-${i}`} position={[light.x, 0, light.z]}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 6, 0]}>
            <sphereGeometry args={[0.5]} />
            <meshBasicMaterial color="#FF9240" />
          </mesh>
          <pointLight position={[0, 5.5, 0]} color="#FF9240" intensity={1} distance={30} decay={2} castShadow />
        </group>
      ))}
    </group>
  );
}
