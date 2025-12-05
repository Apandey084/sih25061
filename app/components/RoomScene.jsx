"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function RoomScene({ room }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [room]);

  return (
    <div className="h-full w-full relative">
      <Canvas camera={{ fov: 75 }}>
        <OrbitControls autoRotate autoRotateSpeed={0.4} enableZoom={false} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} />
        {/* Placeholder sphere */}
        <mesh>
          <sphereGeometry args={[500, 60, 40]} />
          <meshBasicMaterial map={null} side={2} color="lightblue" />
        </mesh>
      </Canvas>

      {room?.audioUrl && <audio ref={audioRef} src={room.audioUrl} loop />}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg"
      >
        {room?.name || "Unnamed Room"}
      </motion.div>
    </div>
  );
}
