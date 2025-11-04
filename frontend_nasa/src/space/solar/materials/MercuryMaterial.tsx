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

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
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
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for(int i = 0; i < 6; i++) {
      sum += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return sum;
  }
  float crater(vec3 p, float size, float depth) {
    float d = length(p) / size;
    float rim = smoothstep(0.8, 1.0, d) * smoothstep(1.2, 1.0, d);
    float center = smoothstep(0.0, 0.8, d);
    return mix(depth, rim * 0.2, center);
  }

  void main() {
    vec3 nrm = normalize(vNormal);
    vec3 sp = normalize(vPos);
    float n = fbm(sp * 8.0);
    float craters = 0.0;
    craters += crater(sp * 5.0 + vec3(1.0, 0.5, -0.3), 0.2, -0.15);
    craters += crater(sp * 4.0 + vec3(-0.5, 0.2, 0.8), 0.3, -0.1);
    craters += crater(sp * 6.0 + vec3(0.2, -0.7, 0.4), 0.15, -0.2);
    craters += crater(sp * 3.5 + vec3(-0.8, -0.2, -0.5), 0.25, -0.12);
    float surface = n * 0.5 + craters;
    vec3 col = mix(uDark, uMid, surface + 0.5);
    col = mix(col, uLight, smoothstep(0.5, 0.8, surface + 0.6));
    float ndotl = max(dot(nrm, normalize(vec3(1.0, 0.5, 0.2))), 0.0);
    col *= 0.7 + 0.3 * ndotl;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function MercuryMaterial() {
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDark: { value: new THREE.Color('#6e6e6e') },
    uMid: { value: new THREE.Color('#9e9e9e') },
    uLight: { value: new THREE.Color('#c0c0c0') },
  }), []);

  useFrame((_, dt) => { if (ref.current) uniforms.uTime.value += dt; });

  return (
    <shaderMaterial ref={ref} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
  );
}

