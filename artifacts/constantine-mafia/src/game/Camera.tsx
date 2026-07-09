import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraMode } from './useGameStore';
import { cameraDrag } from './cameraState';

interface CameraProps {
  targetRef: React.RefObject<THREE.Object3D | null>;
  inVehicle: boolean;
  cameraMode: CameraMode;
}

const _desired  = new THREE.Vector3();
const _lookAt   = new THREE.Vector3();
const _forward  = new THREE.Vector3();

export function Camera({ targetRef, inVehicle, cameraMode }: CameraProps) {
  const camPos    = useRef(new THREE.Vector3(0, 10, 10));
  const camLookAt = useRef(new THREE.Vector3());
  const { gl }    = useThree();

  /* ── Mouse-drag orbit ──────────────────────────────────────────────────────
   * Left-button drag rotates the camera yaw/pitch around the player.
   * Stored in the shared cameraDrag module object (no React state) so Player.tsx
   * can read the camera forward direction each frame without prop drilling.
   */
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      // Only capture on left-button; right-button is used by context menu
      if (e.button !== 0) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
    };

    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      cameraDrag.yaw -= dx * 0.006;
      // Wrap yaw to [-π, π] to prevent long-session floating-point drift
      while (cameraDrag.yaw >  Math.PI) cameraDrag.yaw -= Math.PI * 2;
      while (cameraDrag.yaw < -Math.PI) cameraDrag.yaw += Math.PI * 2;

      cameraDrag.pitch = THREE.MathUtils.clamp(
        cameraDrag.pitch + dy * 0.004,
        -0.08,  // nearly horizontal
        1.15,   // steep top-down
      );
    };

    const onUp = (e: PointerEvent) => {
      dragging = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* ok */ }
    };

    el.addEventListener('pointerdown',   onDown);
    el.addEventListener('pointermove',   onMove);
    el.addEventListener('pointerup',     onUp);
    el.addEventListener('pointercancel', onUp);

    return () => {
      el.removeEventListener('pointerdown',   onDown);
      el.removeEventListener('pointermove',   onMove);
      el.removeEventListener('pointerup',     onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [gl.domElement]);

  useFrame((state, delta) => {
    if (!targetRef.current) return;

    const target = targetRef.current;
    const pos    = target.position;
    const rotY   = target.rotation.y;
    const lerpT  = Math.min(1, 12 * delta);

    if (cameraMode === 'first') {
      /* ── First-person: camera at eye level, looking forward ─────────── */
      _forward.set(-Math.sin(rotY), 0, -Math.cos(rotY));
      _desired.copy(pos).add(new THREE.Vector3(0, 1.65, 0));
      _lookAt.copy(_desired).addScaledVector(_forward, 20);

    } else if (cameraMode === 'second') {
      /* ── Second-person: face-to-face ────────────────────────────────── */
      _forward.set(-Math.sin(rotY), 0, -Math.cos(rotY));
      const dist = inVehicle ? 8 : 5;
      _desired.copy(pos)
        .addScaledVector(_forward, dist)
        .add(new THREE.Vector3(0, inVehicle ? 4 : 2.5, 0));
      _lookAt.copy(pos).add(new THREE.Vector3(0, 1.0, 0));

    } else {
      /* ── Third-person: mouse-drag orbit ─────────────────────────────── */
      const dist   = inVehicle ? 12 : 8;
      const height = inVehicle ? 5  : 4;

      // Camera sits at (sin(yaw)*dist, height+pitch*dist, cos(yaw)*dist) relative to target
      const pitchHeight = Math.sin(cameraDrag.pitch) * dist;
      _desired.set(
        pos.x + Math.sin(cameraDrag.yaw) * dist,
        pos.y + height + pitchHeight,
        pos.z + Math.cos(cameraDrag.yaw) * dist,
      );
      _lookAt.copy(pos).add(new THREE.Vector3(0, 1.2, 0));
    }

    camPos.current.lerp(_desired,  lerpT);
    camLookAt.current.lerp(_lookAt, lerpT);

    state.camera.position.copy(camPos.current);
    state.camera.lookAt(camLookAt.current);
  });

  return null;
}
