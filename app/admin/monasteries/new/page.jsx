// app/admin/monasteries/new/page.jsx
import MonasteryForm from "@/app/components/MonasteryForm";

export const metadata = { title: "New Monastery | Admin" };

export default function NewMonasteryPage() {
  // server component: no data fetching required for new page
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Add New Monastery</h1>
      <MonasteryForm existing={null} />
    </div>
  );
}
