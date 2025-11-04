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
  uniform vec3 uHighlight;

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
  float fbm(vec3 p) { float sum = 0.0; float amp = 0.5; for(int i = 0; i < 6; i++) { sum += amp * noise(p); p *= 2.0; amp *= 0.5; } return sum; }

  void main() {
    vec3 nrm = normalize(vNormal);
    vec3 sp = normalize(vPos);
    float t = uTime * 0.1;
    float clouds = fbm(sp * 2.0 + vec3(t * 0.2, t * 0.3, -t * 0.1));
    clouds += fbm(sp * 4.0 + vec3(-t * 0.1, t * 0.2, t * 0.3)) * 0.5;
    float detail = fbm(sp * 8.0 + vec3(t * 0.4, -t * 0.3, t * 0.2)) * 0.25;
    clouds = clouds * 0.5 + 0.5 + detail;
    vec3 col = mix(uBase, uCloud, clouds);
    col = mix(col, uHighlight, smoothstep(0.7, 0.9, clouds) * 0.7);
    float ndotl = max(dot(nrm, normalize(vec3(1.0, 0.5, 0.2))), 0.0);
    col *= 0.8 + 0.2 * ndotl;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function VenusMaterial() {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uBase: { value: new THREE.Color('#cdb28a') },
    uCloud: { value: new THREE.Color('#e6d7b8') },
    uHighlight: { value: new THREE.Color('#f5ecd6') },
  }), []);

  useFrame((_, dt) => { if (ref.current) uniforms.uTime.value += dt; });

  return (
    <shaderMaterial ref={ref} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
  );
}

