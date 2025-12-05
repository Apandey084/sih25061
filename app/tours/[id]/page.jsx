// app/tours/[id]/page.jsx (server component)
import React from "react";
import VRViewer from "@/components/VRViewer";
import RoomSidebar from "@/components/RoomSidebar";

export default async function TourPage({ params }) {
  const id = await params?.id; // Next.js requires awaiting params in app router dynamic routes
  // Fetch tour from your API (server-side)
  const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/vr-tours?id=${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return <div className="p-6">Failed to load tour.</div>;
  }

  const tour = await res.json();
  if (!tour || !tour.rooms || tour.rooms.length === 0) {
    return <div className="p-6">This tour has no rooms.</div>;
  }

  // Pass minimal JSON-serializable data to the client component
  const rooms = tour.rooms.map((r) => ({
    id: r._id ?? r.id ?? r.name,
    name: r.name,
    thumb: r.thumbnailUrl || r.cover || r.imageUrl || "",
    imageUrl: r.imageUrl, // equirectangular panorama (cloudinary URL)
    audioUrl: r.audioUrl,
  }));

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-[1400px] mx-auto h-screen grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 p-4">
        <div className="order-2 lg:order-1">
          {/* Sidebar lives on left for large screens */}
          <RoomSidebar rooms={rooms} />
        </div>

        <div className="order-1 lg:order-2 rounded overflow-hidden shadow-lg bg-black">
          {/* VRViewer is a client component */}
          {/* initialActiveIndex 0 -> open first room */}
          <VRViewer rooms={rooms} initialActiveIndex={0} />
        </div>
      </div>
    </div>
  );
}
