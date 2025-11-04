import { useFrame } from '@react-three/fiber';
import React, { useRef } from 'react';

export function SceneCameraLogic() {
  const basePos = useRef<{ x: number; y: number; z: number } | null>(null);

  useFrame(({ camera, clock }) => {
    if (!basePos.current) {
      basePos.current = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    }
    const t = clock.getElapsedTime();
    const ampXZ = 0.8;
    const ampY = 0.3;
    const speed = 0.2;
    const bx = basePos.current.x;
    const by = basePos.current.y;
    const bz = basePos.current.z;
    camera.position.x = bx + Math.sin(t * speed) * ampXZ;
    camera.position.z = bz + Math.cos(t * speed) * ampXZ;
    camera.position.y = by + Math.sin(t * speed * 0.6) * ampY;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

