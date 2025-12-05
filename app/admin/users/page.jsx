"use client";

import { useEffect, useState } from "react";
import ApproveCheckerList from "../dashboard/components/ApproveCheckerList";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", role: "user" });
  const [editUser, setEditUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 🔍 Search & Filter
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  // 📄 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Robust fetch: accept either [] or { users: [], total, ... }
  async function fetchUsers() {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/users");
      const data = await res.json();

      // Normalize to array
      const list = Array.isArray(data) ? data : data?.users ?? [];
      setUsers(list);
    } catch (err) {
      console.error("Failed to load users:", err);
      setUsers([]);
      setErrorMsg("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Add user
  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create user");
      setForm({ name: "", email: "", role: "user" });
      await fetchUsers();
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Create failed");
    }
  }

  // ✅ Delete user
  async function handleDelete(id) {
    if (!confirm("Delete this user?")) return;
    setErrorMsg("");
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete");
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Delete failed");
    }
  }

  // ✅ Edit button click
  function openEditModal(user) {
    setEditUser(user);
    setIsModalOpen(true);
  }

  // ✅ Save edit
  async function handleUpdate(e) {
    e.preventDefault();
    if (!editUser || !editUser._id) return;
    setErrorMsg("");
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editUser),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to update user");
      setIsModalOpen(false);
      setEditUser(null);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Update failed");
    }
  }

  // 🔍 Filter + Search Logic — safe guard users to array
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers
    .filter((user) =>
      `${user?.name ?? ""} ${user?.email ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((user) => (filterRole === "all" ? true : user?.role === filterRole));

  // 📄 Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));

  return (
    <div className="p-6">
      <ApproveCheckerList/>
      <h1 className="text-2xl font-semibold mb-6">User Management</h1>

      {errorMsg && (
        <div className="mb-4 text-red-600 font-medium">{errorMsg}</div>
      )}

      {/* Add Form */}
      <form onSubmit={handleSubmit} className="flex gap-4 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded w-40"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded w-64"
          required
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="checker">Checker</option>
        </select>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </form>

      {/* 🔍 Search + Filter Controls */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-64"
        />
        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setCurrentPage(1);
          }}
          className="border p-2 rounded"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="checker">Checker</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse  rounded shadow">
            <thead>
              <tr className="bg-gray-100 text-left border-b">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">{user.role}</td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 📄 Pagination Controls */}
      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* ✏️ Edit Modal */}
      {isModalOpen && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className=" p-6 rounded-xl shadow-lg w-[400px]">
            <h2 className="text-xl font-semibold mb-4">Edit User</h2>
            <form onSubmit={handleUpdate} className="flex flex-col gap-3">
              <input
                type="text"
                value={editUser.name || ""}
                onChange={(e) =>
                  setEditUser({ ...editUser, name: e.target.value })
                }
                className="border p-2 rounded"
                required
              />
              <input
                type="email"
                value={editUser.email || ""}
                onChange={(e) =>
                  setEditUser({ ...editUser, email: e.target.value })
                }
                className="border p-2 rounded"
                required
              />
              <select
                value={editUser.role || "user"}
                onChange={(e) =>
                  setEditUser({ ...editUser, role: e.target.value })
                }
                className="border p-2 rounded"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="checker">Checker</option>
              </select>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditUser(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
