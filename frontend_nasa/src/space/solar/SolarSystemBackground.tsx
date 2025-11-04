'use client';

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { SceneCameraLogic } from './SceneCameraLogic';
import { SunMaterial } from './materials/SunMaterial';
import { MercuryMaterial } from './materials/MercuryMaterial';
import { VenusMaterial } from './materials/VenusMaterial';
import { EarthMaterial } from './materials/EarthMaterial';
import { MarsMaterial } from './materials/MarsMaterial';
import { JupiterMaterial } from './materials/JupiterMaterial';
import { SaturnMaterial } from './materials/SaturnMaterial';
import { UranusMaterial } from './materials/UranusMaterial';
import { NeptuneMaterial } from './materials/NeptuneMaterial';

function TexturedPlanet({
  radius = 0.5,
  distance = 6,
  speed = 0.5,
  initialAngle = 0,
  ringInner,
  ringOuter,
  tilt = 0,
  fallbackColor,
  glowColor,
  materialType,
}: {
  radius?: number;
  distance?: number;
  speed?: number;
  initialAngle?: number;
  ringInner?: number;
  ringOuter?: number;
  tilt?: number;
  fallbackColor?: string;
  glowColor?: string;
  materialType?: 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | undefined;
}) {
  const groupRef = React.useRef<THREE.Group>(null!);
  const angleRef = React.useRef<number>(initialAngle);

  // Manual orbit update using requestAnimationFrame to avoid extra hooks
  React.useEffect(() => {
    let raf: number;
    const update = () => {
      angleRef.current += speed * 0.01;
      const x = Math.cos(angleRef.current) * distance;
      const z = Math.sin(angleRef.current) * distance;
      if (groupRef.current) {
        groupRef.current.position.set(x, 0, z);
        groupRef.current.rotation.y += 0.01;
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [distance, speed]);

  return (
    <group ref={groupRef} rotation={[0, tilt, 0] as any}>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        {materialType === 'mercury' ? (
          <MercuryMaterial />
        ) : materialType === 'venus' ? (
          <VenusMaterial />
        ) : materialType === 'earth' ? (
          <EarthMaterial />
        ) : materialType === 'mars' ? (
          <MarsMaterial />
        ) : materialType === 'jupiter' ? (
          <JupiterMaterial />
        ) : materialType === 'saturn' ? (
          <SaturnMaterial />
        ) : materialType === 'uranus' ? (
          <UranusMaterial />
        ) : materialType === 'neptune' ? (
          <NeptuneMaterial />
        ) : (
          <meshStandardMaterial 
            color={new THREE.Color(fallbackColor ?? '#888888')} 
            roughness={0.7}
            metalness={0.3}
          />
        )}
      </mesh>
      {glowColor && (
        <mesh>
          <sphereGeometry args={[radius * 1.03, 64, 64]} />
          <meshBasicMaterial color={new THREE.Color(glowColor)} transparent opacity={0.12} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {(ringInner !== undefined && ringOuter !== undefined) && (
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[radius * (ringInner as number), radius * (ringOuter as number), 256]} />
          <meshBasicMaterial color={new THREE.Color('#d9c89c')} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

export function SolarSystemBackground() {
  const planets = useMemo(
    () => [
      { name: 'Mercury', radius: 0.25, distance: 4, speed: 1.2, initialAngle: 0.0, materialType: 'mercury', fallbackColor: '#9e9e9e' },
      { name: 'Venus', radius: 0.35, distance: 6, speed: 0.9, initialAngle: 1.0, materialType: 'venus', fallbackColor: '#cdb28a' },
      { name: 'Earth', radius: 0.5, distance: 8.5, speed: 0.7, initialAngle: 2.0, tilt: 0.41, materialType: 'earth', fallbackColor: '#3a78ff', glowColor: '#9fd3ff' },
      { name: 'Mars', radius: 0.4, distance: 11, speed: 0.6, initialAngle: 3.0, materialType: 'mars', fallbackColor: '#c4553b' },
      { name: 'Jupiter', radius: 1.2, distance: 15, speed: 0.35, initialAngle: 0.7, materialType: 'jupiter', fallbackColor: '#d1a67a', glowColor: '#ffd9a8' },
      { name: 'Saturn', radius: 1.0, distance: 20, speed: 0.3, initialAngle: 1.7, tilt: 0.47, materialType: 'saturn', fallbackColor: '#e3cfa3', glowColor: '#ffe8b8', ringInner: 1.5, ringOuter: 2.6 },
      { name: 'Uranus', radius: 0.85, distance: 24, speed: 0.25, initialAngle: 0.4, tilt: -1.0, materialType: 'uranus', fallbackColor: '#7fd6e7', glowColor: '#b7f0ff' },
      { name: 'Neptune', radius: 0.8, distance: 28, speed: 0.22, initialAngle: 1.1, tilt: 0.49, materialType: 'neptune', fallbackColor: '#2e6cf6', glowColor: '#6aa7ff' },
    ],
    []
  );

  return (
    <Canvas
      camera={{ position: [0, 10, 25], fov: 50 } as any}
      frameloop="always"
      dpr={[1, 2] as any}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' } as any}
      onCreated={({ gl }) => {
        // @ts-ignore
        if ('outputColorSpace' in gl) (gl as any).outputColorSpace = THREE.SRGBColorSpace;
        // @ts-ignore
        if ('toneMapping' in gl) (gl as any).toneMapping = THREE.ACESFilmicToneMapping;
        // @ts-ignore
        if ('toneMappingExposure' in gl) (gl as any).toneMappingExposure = 1.1;
      }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -2, pointerEvents: 'none' }}
    >
      <SceneCameraLogic />

      <ambientLight intensity={0.7} />
      <hemisphereLight color={0xffffff as any} groundColor={0x444444 as any} intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={10} color="#FDB813" distance={0} decay={2} />

      <Stars radius={150} depth={80} count={8000} factor={4.5} saturation={0} fade speed={1} />

      <group>
        <mesh position={[0, 0, 0] as any}>
          <sphereGeometry args={[3, 96, 96]} />
          <SunMaterial colorA="#FF6A00" colorB="#FFD54D" />
        </mesh>
      </group>

      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5] as any} intensity={2} castShadow />
      <hemisphereLight args={['#ffffff', '#004080', 1] as any} />

      {planets.map((p: any, idx: number) => (
        <group key={idx}>
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <ringGeometry args={[p.distance - 0.05, p.distance + 0.05, 256]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
          <TexturedPlanet
            radius={p.radius}
            distance={p.distance}
            speed={p.speed}
            initialAngle={p.initialAngle}
            ringInner={p.ringInner}
            ringOuter={p.ringOuter}
            tilt={p.tilt}
            materialType={p.materialType}
            fallbackColor={p.fallbackColor}
            glowColor={p.glowColor}
          />
          {idx === 2 && (
            <mesh>
              <sphereGeometry args={[p.radius * 1.05, 32, 32]} />
              <meshBasicMaterial color="#93c5fd" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
            </mesh>
          )}
        </group>
      ))}
    </Canvas>
  );
}

