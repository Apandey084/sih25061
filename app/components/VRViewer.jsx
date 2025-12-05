// // app/components/VRViewer.jsx
// "use client";

// import React, { useEffect, useRef, useState, Suspense } from "react";
// import { Canvas, useThree } from "@react-three/fiber";
// import { Sky, OrbitControls, useTexture } from "@react-three/drei";
// import { motion, AnimatePresence } from "framer-motion";

// /**
//  * SpherePanorama - inside-out sphere with texture
//  */
// function SpherePanorama({ textureUrl }) {
//   const texture = useTexture(textureUrl);
//   return (
//     <mesh scale={[-1, 1, 1]}> {/* invert X to view inside */}
//       <sphereGeometry args={[50, 64, 64]} />
//       <meshBasicMaterial map={texture} side={2} />
//     </mesh>
//   );
// }

// /**
//  * CameraAuto - attaches to scene and optionally performs small subtle animations
//  */
// function CameraAuto() {
//   // Keep camera where OrbitControls will handle auto-rotate
//   const { camera } = useThree();
//   useEffect(() => {
//     camera.position.set(0, 0, 0.1);
//   }, [camera]);
//   return null;
// }

// export default function VRViewer({ rooms = [], initialActiveIndex = 0 }) {
//   const [activeIndex, setActiveIndex] = useState(initialActiveIndex || 0);
//   const audioRef = useRef(null);
//   const prevIndexRef = useRef(activeIndex);

//   // When active changes, update audio src and play
//   useEffect(() => {
//     const curRoom = rooms[activeIndex];
//     if (!curRoom) return;

//     // Use HTMLAudioElement for narration; keep it simple
//     if (!audioRef.current) {
//       audioRef.current = new Audio();
//       audioRef.current.preload = "auto";
//     }

//     const audio = audioRef.current;
//     audio.pause();
//     audio.src = curRoom.audioUrl || "";
//     audio.currentTime = 0;
//     // try play (user gesture restrictions: typically allowed after user interaction)
//     audio
//       .play()
//       .catch((e) => {
//         // Autoplay might be blocked — we'll not crash; UI should show play control if needed
//         console.debug("Audio play was blocked:", e.message);
//       });

//     prevIndexRef.current = activeIndex;

//     return () => {
//       // cleanup: pause
//       audio.pause();
//     };
//   }, [activeIndex, rooms]);

//   // small on-screen controls if audio blocked
//   const [muted, setMuted] = useState(false);
//   useEffect(() => {
//     if (audioRef.current) audioRef.current.muted = muted;
//   }, [muted]);

//   if (!rooms || rooms.length === 0) {
//     return <div className="p-6 text-center">No rooms available</div>;
//   }

//   const activeRoom = rooms[activeIndex];

//   return (
//     <div className="relative h-full w-full">
//       {/* Canvas */}
//       <Canvas camera={{ fov: 75, near: 0.1, far: 200, position: [0, 0, 0.1] }}>
//         <ambientLight intensity={0.6} />
//         <Suspense fallback={null}>
//           <SpherePanorama textureUrl={activeRoom.imageUrl} />
//         </Suspense>

//         <CameraAuto />

//         {/* OrbitControls handles user drag and auto-rotate */}
//         <OrbitControls
//           enableZoom={false}
//           enablePan={false}
//           autoRotate={true} // important: auto rotating
//           autoRotateSpeed={0.3}
//           rotateSpeed={0.6}
//           enableDamping={true}
//         />
//       </Canvas>

//       {/* Overlays: room title + simple prev/next controls */}
//       <div className="absolute left-4 top-4 bg-black/50 px-3 py-2 rounded">
//         <div className="text-sm font-semibold">{activeRoom.name}</div>
//         <div className="text-xs text-gray-300">{rooms.length} rooms</div>
//       </div>

//       <div className="absolute right-4 top-4 flex gap-2">
//         <button
//           onClick={() => setActiveIndex((i) => (i - 1 + rooms.length) % rooms.length)}
//           className="bg-black/50 text-white px-3 py-2 rounded"
//           aria-label="Previous room"
//         >
//           ◀
//         </button>
//         <button
//           onClick={() => setActiveIndex((i) => (i + 1) % rooms.length)}
//           className="bg-black/50 text-white px-3 py-2 rounded"
//           aria-label="Next room"
//         >
//           ▶
//         </button>
//       </div>

//       {/* Sidebar minimized for small screens (the full RoomSidebar is rendered on server page) */}
//       <div className="absolute left-4 bottom-4">
//         <button
//           onClick={() => {
//             // pause/play toggle
//             if (!audioRef.current) return;
//             if (audioRef.current.paused) audioRef.current.play().catch(() => {});
//             else audioRef.current.pause();
//           }}
//           className="bg-black/50 text-white px-3 py-2 rounded"
//         >
//           Play / Pause
//         </button>
//         <button
//           onClick={() => setMuted((m) => !m)}
//           className="bg-black/50 text-white px-3 py-2 rounded ml-2"
//         >
//           {muted ? "Unmute" : "Mute"}
//         </button>
//       </div>

//       {/* Mini room list bottom (small screens) */}
//       <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[90%] lg:hidden">
//         <div className="flex gap-2 overflow-x-auto">
//           {rooms.map((r, idx) => (
//             <motion.button
//               key={r.id}
//               onClick={() => setActiveIndex(idx)}
//               initial={false}
//               animate={{ scale: idx === activeIndex ? 1.03 : 1 }}
//               className={`min-w-[120px] bg-black/40 p-2 rounded text-left ${idx === activeIndex ? "ring-2 ring-white" : ""}`}
//             >
//               <div className="text-sm font-semibold">{r.name}</div>
//             </motion.button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import React, { useEffect, useRef, useState, Suspense, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture } from "@react-three/drei";
import { BackSide } from "three";
import { motion } from "framer-motion";

/**
 * SpherePanorama - inside-out sphere with texture
 * Uses BackSide so the texture is visible from inside the sphere.
 */
function SpherePanorama({ textureUrl }) {
  // fallback placeholder if textureUrl falsy
  const url = textureUrl || "/placeholder.jpg";
  // useTexture already caches textures
  const texture = useTexture(url);
  return (
    <mesh scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 64, 64]} />
      <meshBasicMaterial map={texture} side={BackSide} />
    </mesh>
  );
}

/**
 * CameraAuto - keep camera in the correct place for panorama viewing
 */
function CameraAuto() {
  const { camera } = useThree();
  useEffect(() => {
    // keep camera slightly offset so OrbitControls works well
    camera.position.set(0, 0, 0.1);
  }, [camera]);
  return null;
}

export default function VRViewer({ rooms = [], initialActiveIndex = 0 }) {
  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = Number(initialActiveIndex) || 0;
    return Math.min(Math.max(0, idx), Math.max(0, safeRooms.length - 1));
  });

  // Ensure activeIndex is valid when rooms change
  useEffect(() => {
    if (safeRooms.length === 0) {
      setActiveIndex(0);
    } else if (activeIndex >= safeRooms.length) {
      setActiveIndex(0);
    }
  }, [safeRooms.length, activeIndex]);

  // Single persistent audio element
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    // ensure muted state applied
    audioRef.current.muted = muted;
    return () => {
      // cleanup on unmount
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
        }
      } catch (e) {
        // ignore
      }
    };
    // intentionally run once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update audio when active room changes
  useEffect(() => {
    const curRoom = safeRooms[activeIndex];
    const audio = audioRef.current;
    if (!audio) return;

    // stop current
    try {
      audio.pause();
    } catch (e) {}

    if (!curRoom || !curRoom.audioUrl) {
      audio.src = "";
      setIsPlaying(false);
      return;
    }

    // set and try to play
    audio.src = curRoom.audioUrl;
    audio.currentTime = 0;
    audio.loop = true;
    audio.muted = muted;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setAutoplayBlocked(false);
      })
      .catch((err) => {
        // autoplay blocked — user must press play
        console.debug("Audio autoplay blocked or failed:", err?.message ?? err);
        setAutoplayBlocked(true);
        setIsPlaying(false);
      });

    // cleanup when room changes
    return () => {
      try {
        audio.pause();
      } catch (e) {}
    };
  }, [activeIndex, safeRooms, muted]);

  // toggle play/pause (user-initiated)
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setAutoplayBlocked(true);
        });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  // toggle mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = !!muted;
  }, [muted]);

  // navigation helpers
  const goNext = useCallback(() => {
    if (safeRooms.length === 0) return;
    setActiveIndex((i) => (i + 1) % safeRooms.length);
  }, [safeRooms.length]);

  const goPrev = useCallback(() => {
    if (safeRooms.length === 0) return;
    setActiveIndex((i) => (i - 1 + safeRooms.length) % safeRooms.length);
  }, [safeRooms.length]);

  if (safeRooms.length === 0) {
    return <div className="p-6 text-center text-white bg-black">No rooms available</div>;
  }

  const activeRoom = safeRooms[activeIndex] || {};

  return (
    <div className="relative h-full w-full text-white bg-black">
      {/* Canvas panorama */}
      <Canvas camera={{ fov: 75, near: 0.1, far: 200, position: [0, 0, 0.1] }}>
        <ambientLight intensity={0.6} />
        <Suspense fallback={null}>
          <SpherePanorama textureUrl={activeRoom.imageUrl} />
        </Suspense>
        <CameraAuto />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.3}
          rotateSpeed={0.6}
          enableDamping={true}
        />
      </Canvas>

      {/* Top-left info */}
      <div className="absolute left-4 top-4 bg-black/60 px-3 py-2 rounded">
        <div className="text-sm font-semibold">{activeRoom.name || activeRoom.title || `Room ${activeIndex + 1}`}</div>
        <div className="text-xs text-gray-300">{safeRooms.length} room{safeRooms.length > 1 ? "s" : ""}</div>
      </div>

      {/* Top-right nav */}
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={goPrev}
          aria-label="Previous room"
          className="bg-black/50 text-white px-3 py-2 rounded"
        >
          ◀
        </button>
        <button
          onClick={goNext}
          aria-label="Next room"
          className="bg-black/50 text-white px-3 py-2 rounded"
        >
          ▶
        </button>
      </div>

      {/* Bottom-left audio controls */}
      <div className="absolute left-4 bottom-4 flex gap-2 items-center">
        <button
          onClick={togglePlay}
          className="bg-black/50 text-white px-3 py-2 rounded"
          aria-label={isPlaying ? "Pause audio" : "Play audio"}
        >
          {isPlaying ? "⏸️" : "▶️"}
        </button>

        <button
          onClick={() => setMuted((m) => !m)}
          className="bg-black/50 text-white px-3 py-2 rounded"
          aria-label={muted ? "Unmute audio" : "Mute audio"}
        >
          {muted ? "🔈" : "🔇"}
        </button>

        {autoplayBlocked && (
          <div className="text-xs text-gray-300 ml-2">Tap ▶️ to enable audio</div>
        )}
      </div>

      {/* Bottom center mini thumbnails (mobile) */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-[90%] lg:hidden">
        <div className="flex gap-2 overflow-x-auto">
          {safeRooms.map((r, idx) => (
            <motion.button
              key={r.id ?? r._id ?? idx}
              onClick={() => setActiveIndex(idx)}
              initial={false}
              animate={{ scale: idx === activeIndex ? 1.03 : 1 }}
              className={`min-w-[120px] bg-black/40 p-2 rounded text-left ${idx === activeIndex ? "ring-2 ring-white" : ""}`}
            >
              <div className="text-sm font-semibold">{r.name || r.title || `Room ${idx + 1}`}</div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
