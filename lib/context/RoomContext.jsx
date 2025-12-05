// lib/context/RoomContext.jsx
"use client";

import React, { createContext, useContext, useState } from "react";

const RoomContext = createContext();

export function RoomProvider({ children, initialRoomIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialRoomIndex);
  const setRoomIndex = (i) => setCurrentIndex(i);
  return (
    <RoomContext.Provider value={{ currentIndex, setRoomIndex }}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
}
