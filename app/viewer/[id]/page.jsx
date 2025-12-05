// "use client";
// import { useEffect, useRef, useState } from "react";
// import { Canvas, useFrame, useLoader } from "@react-three/fiber";
// import { OrbitControls } from "@react-three/drei";
// import { TextureLoader } from "three";
// import { motion, AnimatePresence } from "framer-motion";
// import { useRouter, useParams } from "next/navigation";

// export default function ViewerPage() {
//   const { id } = useParams();
//   const router = useRouter();
//   const [tour, setTour] = useState(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(true);
//   const audioRef = useRef(null);

//   // Fetch tour data
//   useEffect(() => {
//     const fetchTour = async () => {
//       try {
//         const res = await fetch(`/api/vr-tours?id=${id}`);
//         const data = await res.json();
//         setTour(data);
//       } catch (error) {
//         console.error("Failed to fetch tour:", error);
//       }
//     };
//     fetchTour();
//   }, [id]);

//   // Manage audio
// useEffect(() => {
//   if (!tour?.rooms?.length) return;

//   const room = tour.rooms[currentIndex];
//   if (audioRef.current) {
//     audioRef.current.pause();
//     audioRef.current = null;
//   }

//   if (room.audioUrl) {
//     const audio = new Audio(room.audioUrl);
//     audio.loop = true;
//     audio.volume = 0.9;
//     audio.play().catch(() => console.log("Audio autoplay blocked"));
//     audioRef.current = audio;
//   }

//   // ✅ Cleanup: Stop audio when leaving the page
//   return () => {
//     if (audioRef.current) {
//       audioRef.current.pause();
//       audioRef.current = null;
//     }
//   };
// }, [currentIndex, tour]);


//   const handlePlayPause = () => {
//     if (!audioRef.current) return;
//     if (isPlaying) {
//       audioRef.current.pause();
//     } else {
//       audioRef.current.play();
//     }
//     setIsPlaying(!isPlaying);
//   };

//   const nextRoom = () => {
//     setCurrentIndex((i) =>
//       i + 1 < tour.rooms.length ? i + 1 : 0
//     );
//   };

//   const prevRoom = () => {
//     setCurrentIndex((i) =>
//       i - 1 >= 0 ? i - 1 : tour.rooms.length - 1
//     );
//   };

//   if (!tour)
//     return (
//       <div className="flex justify-center items-center h-screen text-lg">
//         Loading tour...
//       </div>
//     );

//   const room = tour.rooms[currentIndex];

//   return (
//     <div className="h-screen flex flex-col md:flex-row bg-black text-white">
//       {/* Sidebar */}
//       <motion.div
//         initial={{ x: -200 }}
//         animate={{ x: 0 }}
//         transition={{ duration: 0.5 }}
//         className="md:w-64 w-full md:h-full bg-gray-900 p-4 flex flex-col justify-between z-10"
//       >
//         <div>
//           <h2 className="text-xl font-semibold mb-4">{tour.title}</h2>
//           <ul className="space-y-2">
//             {tour.rooms.map((r, i) => (
//               <li
//                 key={i}
//                 onClick={() => setCurrentIndex(i)}
//                 className={`cursor-pointer p-2 rounded ${
//                   i === currentIndex
//                     ? "bg-indigo-600 text-white"
//                     : "bg-gray-800 hover:bg-gray-700"
//                 }`}
//               >
//                 {r.name || r.title}
//               </li>
//             ))}
//           </ul>
//         </div>

//         <div className="flex justify-between mt-4">
//           <button
//             onClick={() => router.push("/viewer") }
//             className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
//           >
//             ← Back
//           </button>
//           <button
//             onClick={handlePlayPause}
//             className="bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500"
//           >
//             {isPlaying ? "⏸️" : "▶️"}
//           </button>
//         </div>
//       </motion.div>

//       {/* Main Viewer */}
//       <div className="flex-1 relative">
//         <AnimatePresence mode="wait">
//           <motion.div
//             key={room.imageUrl}
//             className="absolute inset-0"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.4 }}
//           >
//             <Canvas>
//               <ambientLight intensity={1.2} />
//               <RoomScene
//                 imageUrl={room.imageUrl}
//                 autoRotate
//                 speed={0.015}
//               />
//               <OrbitControls
//                 enableZoom={false}
//                 enablePan={false}
//                 autoRotate
//                 autoRotateSpeed={0.4}
//               />
//             </Canvas>
//           </motion.div>
//         </AnimatePresence>

//         {/* Room Info */}
//         <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center text-center">
//           <motion.h2
//             className="text-2xl font-semibold"
//             initial={{ opacity: 0, y: 10 }}
//             animate={{ opacity: 1, y: 0 }}
//           >
//             {room.name || room.title}
//           </motion.h2>
//         </div>

//         {/* Navigation Buttons */}
//         <div className="absolute inset-y-0 flex items-center justify-between px-4">
//           <button
//             onClick={prevRoom}
//             className="bg-gray-800 bg-opacity-60 rounded-full p-3 hover:bg-opacity-90"
//           >
//             ⬅️
//           </button>
//           <button
//             onClick={nextRoom}
//             className="bg-gray-800 bg-opacity-60 rounded-full p-3 hover:bg-opacity-90"
//           >
//             ➡️
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ✅ Fixed Panorama Direction
// function RoomScene({ imageUrl }) {
//   const texture = useLoader(TextureLoader, imageUrl);
//   const meshRef = useRef();
//   useFrame(() => {
//     if (meshRef.current) meshRef.current.rotation.y += 0.001; // slow auto rotate
//   });

//   return (
//     <mesh ref={meshRef} scale={[-1, 1, 1]}>
//       <sphereGeometry args={[500, 60, 40]} />
//       <meshBasicMaterial map={texture} side={1} />
//     </mesh>
//   );
// }


"use client";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { TextureLoader, BackSide } from "three";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";

export default function ViewerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tour, setTour] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // Fetch tour data (robust to various API shapes)
  useEffect(() => {
    if (!id) return;
    const fetchTour = async () => {
      try {
        const res = await fetch(`/api/vr-tours?id=${id}`);
        const data = await res.json();

        // Normalize response shapes:
        // - if API returns { tours: [...] } and id was provided, take first item
        // - if API returns an array (unlikely for id query) take first
        // - if API returns the object (tour) directly, use it
        let resolved = null;
        if (!data) {
          resolved = null;
        } else if (Array.isArray(data)) {
          resolved = data[0] ?? null;
        } else if (Array.isArray(data.tours)) {
          // sometimes API returns { ok: true, tours: [...] }
          resolved = data.tours[0] ?? null;
        } else if (data.tour) {
          resolved = data.tour;
        } else if (data._id || data.title) {
          // looks like a single tour object
          resolved = data;
        } else {
          // unexpected shape — keep raw to help debugging
          resolved = data;
        }

        setTour(resolved);
      } catch (error) {
        console.error("Failed to fetch tour:", error);
        setTour(null);
      }
    };
    fetchTour();
  }, [id]);

  // Manage audio (play current room's audio)
  useEffect(() => {
    if (!tour || !Array.isArray(tour.rooms) || tour.rooms.length === 0) return;

    const room = tour.rooms[currentIndex];
    // stop previous audio
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (e) {}
      audioRef.current = null;
    }

    if (room?.audioUrl) {
      const audio = new Audio(room.audioUrl);
      audio.loop = true;
      audio.volume = 0.9;
      audio
        .play()
        .then(() => {
          audioRef.current = audio;
          setIsPlaying(true);
        })
        .catch(() => {
          // autoplay blocked — keep reference so user can play manually
          audioRef.current = audio;
          setIsPlaying(false);
          console.log("Audio autoplay blocked or failed to play");
        });
    } else {
      setIsPlaying(false);
    }

    // cleanup on unmount / room change
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
        audioRef.current = null;
      }
    };
  }, [tour, currentIndex]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          console.log("Play was blocked");
          setIsPlaying(false);
        });
    }
  };

  const nextRoom = () => {
    if (!tour?.rooms?.length) return;
    setCurrentIndex((i) => (i + 1 < tour.rooms.length ? i + 1 : 0));
  };

  const prevRoom = () => {
    if (!tour?.rooms?.length) return;
    setCurrentIndex((i) => (i - 1 >= 0 ? i - 1 : tour.rooms.length - 1));
  };

  if (!tour)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-white bg-black">
        Loading tour...
      </div>
    );

  const room = (Array.isArray(tour.rooms) && tour.rooms[currentIndex]) || {};

  return (
    <div className="h-screen flex flex-col md:flex-row bg-black text-white">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -200 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        className="md:w-64 w-full md:h-full bg-gray-900 p-4 flex flex-col justify-between z-10"
      >
        <div>
          <h2 className="text-xl font-semibold mb-4">{tour.title}</h2>
          <ul className="space-y-2">
            {(Array.isArray(tour.rooms) ? tour.rooms : []).map((r, i) => (
              <li
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`cursor-pointer p-2 rounded ${
                  i === currentIndex ? "bg-indigo-600 text-white" : "bg-gray-800 hover:bg-gray-700"
                }`}
              >
                {r.name || r.title || `Room ${i + 1}`}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={() => router.push("/viewer")} className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600">
            ← Back
          </button>
          <button onClick={handlePlayPause} className="bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500">
            {isPlaying ? "⏸️" : "▶️"}
          </button>
        </div>
      </motion.div>

      {/* Main Viewer */}
      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={room.imageUrl || currentIndex}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Canvas>
              <ambientLight intensity={1.2} />
              <RoomScene imageUrl={room.imageUrl || ""} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.4} />
            </Canvas>
          </motion.div>
        </AnimatePresence>

        {/* Room Info */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center text-center">
          <motion.h2 className="text-2xl font-semibold" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {room.name || room.title || `Room ${currentIndex + 1}`}
          </motion.h2>
        </div>

        {/* Navigation Buttons */}
        <div className="absolute inset-y-0 flex items-center justify-between px-4">
          <button onClick={prevRoom} className="bg-gray-800 bg-opacity-60 rounded-full p-3 hover:bg-opacity-90">
            ⬅️
          </button>
          <button onClick={nextRoom} className="bg-gray-800 bg-opacity-60 rounded-full p-3 hover:bg-opacity-90">
            ➡️
          </button>
        </div>
      </div>
    </div>
  );
}

// Panorama sphere component
function RoomScene({ imageUrl }) {
  const texture = useLoader(TextureLoader, imageUrl || "/placeholder.jpg");
  const meshRef = useRef();
  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={BackSide} />
    </mesh>
  );
}
