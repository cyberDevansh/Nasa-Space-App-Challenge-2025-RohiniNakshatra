'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const vertexShader = `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main() {
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 uBase;
  uniform vec3 uCloud;

  float hash(vec3 p) { p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), u.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), u.x), u.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), u.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), u.x), u.y), u.z);
  }
  float fbm(vec3 p) { float sum = 0.0; float amp = 0.5; for(int i = 0; i < 5; i++) { sum += amp * noise(p); p *= 2.0; amp *= 0.5; } return sum; }

  void main() {
    vec3 nrm = normalize(vNormal);
    vec3 sp = normalize(vPos);
    float t = uTime * 0.05;
    float bands = sin((sp.y * 8.0) + fbm(sp * 2.0 + vec3(t, -t, t)) * 1.5);
    bands = bands * 0.5 + 0.5;
    float clouds = fbm(sp * 3.0 + vec3(-t * 0.2, t * 0.1, t * 0.15));
    vec3 col = mix(uBase, uCloud, bands * 0.3 + clouds * 0.2);
    float ndotl = max(dot(nrm, normalize(vec3(1.0, 0.5, 0.2))), 0.0);
    col *= 0.8 + 0.2 * ndotl;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function UranusMaterial() {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBase: { value: new THREE.Color('#7fd6e7') },
    uCloud: { value: new THREE.Color('#b7f0ff') },
  }), []);

  useFrame((_, dt) => { if (ref.current) uniforms.uTime.value += dt; });

  return (
    <shaderMaterial ref={ref} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
  );
}

