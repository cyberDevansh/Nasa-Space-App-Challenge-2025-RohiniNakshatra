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
  uniform vec3 uDark;
  uniform vec3 uMid;
  uniform vec3 uLight;

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
    float surface = fbm(sp * 5.0);
    float dust = fbm(sp * 3.0 + vec3(uTime * 0.1, uTime * 0.05, -uTime * 0.07));
    dust = smoothstep(0.3, 0.7, dust);
    float poles = smoothstep(0.7, 1.0, abs(sp.y));
    vec3 col = mix(uDark, uMid, surface);
    col = mix(col, uLight, dust * 0.3);
    col = mix(col, vec3(0.9, 0.9, 0.95), poles * 0.7);
    float ndotl = max(dot(nrm, normalize(vec3(1.0, 0.5, 0.2))), 0.0);
    col *= 0.7 + 0.3 * ndotl;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function MarsMaterial() {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDark: { value: new THREE.Color('#8e3b2a') },
    uMid: { value: new THREE.Color('#c4553b') },
    uLight: { value: new THREE.Color('#e07a5f') },
  }), []);

  useFrame((_, dt) => { if (ref.current) uniforms.uTime.value += dt; });

  return (
    <shaderMaterial ref={ref} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
  );
}

