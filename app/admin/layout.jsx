// // import AdminSidebar from "@/components/AdminSidebar";
// // import AdminNavbar from "@/components/AdminNavbar";
// import AdminNavbar from "../components/AdminNavbar";
// import AdminSidebar from "../components/AdminSidebar";

// export const metadata = {
//   title: "Admin Dashboard | Monastery360",
//   description: "Admin panel for managing monasteries and users",
// };

// export default function AdminLayout({ children }) {
//   return (
//     <div className="flex h-screen bg-gray-50">
//       {/* Sidebar (left) */}
//       <AdminSidebar />

//       {/* Main content area */}
//       <div className="flex flex-col flex-1 overflow-hidden">
//         <AdminNavbar />

//         {/* Scrollable content area */}
//         <main className="flex-1 overflow-y-auto p-6">{children}</main>
//       </div>
//     </div>
//   );
// }


// app/admin/layout.jsx

// import AdminSidebar from "@/components/AdminSidebar";
// import AdminNavbar from "@/components/AdminNavbar";
import AdminNavbar from "../components/AdminNavbar";
import AdminSidebar from "../components/AdminSidebar";

export const metadata = {
  title: "Admin Dashboard | Monastery360",
  description: "Admin panel for managing monasteries and users",
};

export default function AdminLayout({ children }) {
  return (
    <div className="relative h-screen w-full overflow-hidden">

      {/* 🌟 GLOBAL ADMIN BACKGROUND */}
      <div className="absolute inset-0 z-[-2] h-full w-full 
        bg-[#000000] 
        bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] 
        bg-[size:20px_20px]
      "></div>

      {/* Optional dark overlay for effect */}
      <div className="absolute inset-0 z-[-1] bg-black/40 backdrop-blur-sm"></div>

      {/* MAIN ADMIN LAYOUT */}
      <div className="relative flex h-full w-full">

        {/* Sidebar */}
        <AdminSidebar />

        {/* Main column */}
        <div className="flex flex-col flex-1 overflow-hidden">

          {/* Navbar */}
          <AdminNavbar />

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto p-6 text-white">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
