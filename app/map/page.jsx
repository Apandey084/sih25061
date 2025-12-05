// app/map/page.jsx
"use client";
import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./MapClient"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center text-gray-600 text-lg">
      Loading map...
    </div>
  ),
});

export default function MapPage() {
  return <MapClient />;
}
