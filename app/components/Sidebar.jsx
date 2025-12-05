"use client";
import { motion } from "framer-motion";

export default function Sidebar({ rooms, onTogglePlay, isPlaying }) {
  return (
    <motion.div
      initial={{ x: -200, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-gray-900 text-white p-4 space-y-4"
    >
      <h2 className="text-xl font-semibold mb-4">Rooms</h2>
      <ul className="space-y-2">
        {rooms.map((r, i) => (
          <li key={i} className="cursor-pointer hover:text-blue-400">
            {r.name}
          </li>
        ))}
      </ul>
      <button
        onClick={onTogglePlay}
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md w-full"
      >
        {isPlaying ? "Pause Audio" : "Play Audio"}
      </button>
    </motion.div>
  );
}
