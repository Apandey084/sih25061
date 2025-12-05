// app/viewer/Sidebar.jsx
"use client";

import React from "react";
import { useRoom } from "@/lib/context/RoomContext";
import { motion } from "framer-motion";

export default function Sidebar({ rooms, onTogglePlay, isPlaying }) {
  const { currentIndex, setRoomIndex } = useRoom();

  return (
    <aside className="w-64 bg-white border-r p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Rooms</h3>
        <button
          onClick={() => onTogglePlay?.()}
          className="px-2 py-1 bg-gray-100 rounded text-sm"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {rooms.map((r, i) => {
          const active = i === currentIndex;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded cursor-pointer border ${active ? "border-blue-500 bg-blue-50" : "border-transparent"}`}
              onClick={() => {
                setRoomIndex(i);
              }}
            >
              <div className="font-medium text-sm">{r.name || `Room ${i + 1}`}</div>
              <div className="text-xs text-gray-500 line-clamp-2">{r.description}</div>
            </motion.div>
          );
        })}
      </div>
    </aside>
  );
}
