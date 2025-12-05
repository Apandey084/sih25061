// app/admin/monasteries/[id]/page.jsx
import connectDB from "@/lib/mongodb";
import Monastery from "@/lib/models/Monastery";
import MonasteryForm from "@/app/components/MonasteryForm";

export default async function EditMonasteryPage(props) {
  const params = await (props?.params ?? props?.route?.params ?? null);
  const id = params?.id ?? null;

  if (!id) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Edit Monastery</h2>
        <p className="mt-2 text-gray-600">Missing id in URL.</p>
      </div>
    );
  }

  try {
    await connectDB();
    const doc = await Monastery.findById(id).lean();
    if (!doc) {
      return (
        <div className="p-6">
          <h2 className="text-xl font-semibold">Edit Monastery</h2>
          <p className="mt-2 text-gray-600">Monastery not found.</p>
        </div>
      );
    }
    const plain = JSON.parse(JSON.stringify(doc));
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Edit Monastery</h2>
        <MonasteryForm existing={plain} />
      </div>
    );
  } catch (err) {
    console.error("Error loading monastery:", err);
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Edit Monastery</h2>
        <p className="mt-2 text-red-600">Failed to load monastery.</p>
      </div>
    );
  }
}
