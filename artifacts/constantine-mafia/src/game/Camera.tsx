import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraMode } from './useGameStore';

interface CameraProps {
  targetRef: React.RefObject<THREE.Object3D | null>;
  inVehicle: boolean;
  cameraMode: CameraMode;
}

const _forward  = new THREE.Vector3();
const _desired  = new THREE.Vector3();
const _lookAt   = new THREE.Vector3();
const _offset   = new THREE.Vector3();

export function Camera({ targetRef, inVehicle, cameraMode }: CameraProps) {
  const camPos    = useRef(new THREE.Vector3(0, 10, 10));
  const camLookAt = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!targetRef.current) return;

    const target = targetRef.current;
    const pos    = target.position;
    const rotY   = target.rotation.y;
    const lerpT  = Math.min(1, 12 * delta);

    // Forward direction the entity is facing (in XZ plane)
    _forward.set(-Math.sin(rotY), 0, -Math.cos(rotY));

    if (cameraMode === 'first') {
      // ── First-person: camera at eye level, looking forward ──────────────
      _desired.copy(pos).add(new THREE.Vector3(0, 1.65, 0));
      _lookAt.copy(_desired).addScaledVector(_forward, 20);

    } else if (cameraMode === 'second') {
      // ── Second-person: face-to-face, camera in front looking back ────────
      const dist = inVehicle ? 8 : 5;
      _desired.copy(pos)
        .addScaledVector(_forward, dist)
        .add(new THREE.Vector3(0, inVehicle ? 4 : 2.5, 0));
      _lookAt.copy(pos).add(new THREE.Vector3(0, 1.0, 0));

    } else {
      // ── Third-person: current behaviour — behind and above ───────────────
      _offset.set(0, inVehicle ? 5 : 4, inVehicle ? 10 : 7);
      _offset.applyEuler(new THREE.Euler(0, rotY, 0));
      _desired.copy(pos).add(_offset);
      _lookAt.copy(pos).add(new THREE.Vector3(0, 1.0, 0));
    }

    camPos.current.lerp(_desired,  lerpT);
    camLookAt.current.lerp(_lookAt, lerpT);

    state.camera.position.copy(camPos.current);
    state.camera.lookAt(camLookAt.current);
  });

  return null;
}
