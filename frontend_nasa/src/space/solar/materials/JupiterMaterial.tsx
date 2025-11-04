'use client';

import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const vshader = `
  varying vec3 vPos;
  varying vec3 vNormal;
  void main(){
    vPos = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`;

const fshader = `
  precision highp float;
  varying vec3 vPos;
  varying vec3 vNormal;
  uniform float uTime;
  uniform vec3 uDark;
  uniform vec3 uMid;
  uniform vec3 uLight;
  uniform vec3 uSpot;

  float hash(vec3 p){ p = fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){
    vec3 i=floor(x); vec3 f=fract(x); vec3 u=f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), u.x),
          mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), u.x), u.y),
      mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), u.x),
          mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), u.x), u.y), u.z);
  }
  float fbm(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.0; a*=0.55; } return s; }

  void main(){
    vec3 sp = normalize(vPos);
    vec3 nrm = normalize(vNormal);
    float lat = sp.y;
    float t = uTime*0.03;
    float bands = sin((lat*10.0) + fbm(sp*4.0 + vec3(t, -t, t))*2.5);
    bands = bands*0.5 + 0.5;
    vec3 col = mix(uDark, uMid, bands);
    col = mix(col, uLight, smoothstep(0.6,1.0,bands));
    vec3 center = normalize(vec3(0.4, -0.2, 0.9));
    float d = distance(sp, center);
    float spot = smoothstep(0.25, 0.0, d);
    float swirl = fbm(sp*6.0 + vec3(-t*2.5, t*1.7, -t*1.3));
    spot *= (0.8 + 0.2*swirl);
    col = mix(col, uSpot, spot*0.9);
    float ndotv = max(dot(nrm, vec3(0.0,0.0,1.0)), 0.0);
    float rim = pow(1.0 - ndotv, 1.3);
    col += rim*0.06;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function JupiterMaterial(){
  const ref = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDark:  { value: new THREE.Color('#8c6d4d') },
    uMid:   { value: new THREE.Color('#caa27f') },
    uLight: { value: new THREE.Color('#e6d1b8') },
    uSpot:  { value: new THREE.Color('#c15c2a') },
  }), []);

  useFrame((_, dt) => { if (ref.current) uniforms.uTime.value += dt; });

  return (
    <shaderMaterial ref={ref} uniforms={uniforms} vertexShader={vshader} fragmentShader={fshader} />
  );
}

