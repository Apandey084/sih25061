// app/components/RoomSidebar.jsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * Minimal sidebar. This component is intentionally client-side
 * so we can handle clicks/animations locally.
 *
 * If you want it to control VRViewer's activeIndex, you can:
 * - lift state up (server->client pattern), or
 * - use a small global state (React context) — for now we keep it independent.
 *
 * Here it emits a `customEvent` that VRViewer could listen for,
 * or you can adapt to use context or pass a setter prop.
 */

export default function RoomSidebar({ rooms = [] }) {
  // local selected index for highlight (this sidebar by default emits events).
  const [selected, setSelected] = useState(0);

  function selectIndex(i) {
    setSelected(i);
    // emit DOM event so VRViewer can listen (easy decoupling)
    window.dispatchEvent(new CustomEvent("vr:selectRoom", { detail: { index: i } }));
  }

  return (
    <aside className="bg-white/5 rounded p-3 h-full overflow-auto text-white">
      <h3 className="text-lg font-semibold mb-3">Rooms</h3>
      <div className="flex flex-col gap-2">
        {rooms.map((r, i) => (
          <motion.button
            key={r.id}
            initial={false}
            animate={{ scale: selected === i ? 1.02 : 1 }}
            onClick={() => selectIndex(i)}
            className={`flex items-center gap-3 text-left p-2 rounded ${selected === i ? "bg-white/10" : "hover:bg-white/5"}`}
          >
            <img
              src={r.thumb || r.imageUrl}
              alt={r.name}
              className="w-14 h-10 object-cover rounded"
            />
            <div>
              <div className="font-medium text-sm">{r.name}</div>
              <div className="text-xs text-gray-300">{r.audioUrl ? "Audio ✓" : "No audio"}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </aside>
  );
}
