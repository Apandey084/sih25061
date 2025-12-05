import { useRouter } from "next/navigation";
import { useVRTour } from "@/context/VRTourContext";

  export default function VRTourCard({ tour }) {
  const router = useRouter();
  const { setCurrentTour, setRoom } = useVRTour();

  const handleOpenViewer = () => {
    setCurrentTour(tour);
    setRoom(tour.rooms[0]); // Load first room
    router.push("/viewer");
  };

  return (
    <div
      onClick={handleOpenViewer}
      className="bg-gray-800 text-white rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition"
    >
      <h3 className="text-lg font-semibold">{tour.title}</h3>
      <p className="text-sm text-gray-400">{tour.description}</p>
    </div>
  );
}
