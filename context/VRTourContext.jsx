"use client";
import { createContext, useContext, useState, useEffect } from "react";

const VRTourContext = createContext();

export function VRTourProvider({ children }) {
  const [currentTour, setCurrentTour] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [audio, setAudio] = useState(null);

  // Handle audio changes
  useEffect(() => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (currentRoom?.audioUrl) {
      const newAudio = new Audio(currentRoom.audioUrl);
      newAudio.loop = true;
      if (isPlaying) newAudio.play();
      setAudio(newAudio);
    }
    return () => audio?.pause();
  }, [currentRoom]);

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const setRoom = (room) => setCurrentRoom(room);

  return (
    <VRTourContext.Provider
      value={{
        currentTour,
        setCurrentTour,
        currentRoom,
        setRoom,
        isPlaying,
        togglePlay,
        autoRotate,
        setAutoRotate,
      }}
    >
      {children}
    </VRTourContext.Provider>
  );
}

export const useVRTour = () => useContext(VRTourContext);
