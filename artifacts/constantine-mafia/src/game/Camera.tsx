import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CameraProps {
  targetRef: React.RefObject<THREE.Object3D | null>;
  inVehicle: boolean;
}

export function Camera({ targetRef, inVehicle }: CameraProps) {
  const currentCameraPos = useRef(new THREE.Vector3(0, 10, 10));
  const currentLookAt = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (!targetRef.current) return;

    const targetPos = targetRef.current.position;
    
    // Smoothly track look-at target
    currentLookAt.current.lerp(targetPos, 10 * delta);
    state.camera.lookAt(currentLookAt.current);

    // Calculate desired position
    const offset = inVehicle ? new THREE.Vector3(0, 5, 8) : new THREE.Vector3(0, 4, 6);
    
    // In free-roam, it's better to follow behind the player rotation
    offset.applyEuler(new THREE.Euler(0, targetRef.current.rotation.y, 0));
    
    const desiredPos = targetPos.clone().add(offset);
    
    // Smoothly interpolate camera position
    currentCameraPos.current.lerp(desiredPos, 10 * delta);
    state.camera.position.copy(currentCameraPos.current);
  });

  return null;
}
