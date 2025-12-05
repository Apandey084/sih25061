// app/viewer/RoomScene.jsx
"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Html } from "@react-three/drei";
import * as THREE from "three";

function Panorama({ imageUrl, autoRotateSpeed = 0.001 }) {
  const meshRef = useRef();
  const texture = useMemo(() => {
    if (!imageUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(imageUrl);
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }, [imageUrl]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += autoRotateSpeed * delta * 60; // scaled rotation
    }
  });

  if (!texture) {
    return <Html center>Loading panorama…</Html>;
  }

  return (
    <mesh ref={meshRef}>
      <sphereBufferGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

export default function RoomScene({ room }) {
  // small fallback if no room
  if (!room) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
        No room selected
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <PerspectiveCamera makeDefault position={[0, 0, 0.1]} />
        <ambientLight intensity={0.5} />
        <Suspense fallback={null}>
          <Panorama imageUrl={room.imageUrl} />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={true}
          rotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}
