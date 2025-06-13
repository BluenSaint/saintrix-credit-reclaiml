"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const { user, role, clearAuth } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role !== "admin") return;
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      // Fetch clients
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("full_name, email, created_at");
      // Fetch admins
      const { data: admins, error: adminsError } = await supabase
        .from("admins")
        .select("id, role, created_at");
      if (clientsError || adminsError) {
        setError(
          clientsError?.message || adminsError?.message || "Error fetching data"
        );
        setLoading(false);
        return;
      }
      // Combine and normalize
      const clientRows = (clients || []).map((c: any) => ({
        name: c.full_name,
        email: c.email,
        role: "client",
        created_at: c.created_at,
      }));
      const adminRows = (admins || []).map((a: any) => ({
        name: a.id,
        email: a.id,
        role: "admin",
        created_at: a.created_at,
      }));
      setUsers([...adminRows, ...clientRows]);
      setLoading(false);
    };
    fetchUsers();
  }, [role]);

  if (role !== "admin")
    return <div className="p-8 text-center">Access denied.</div>;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalClients = users.filter((u) => u.role === "client").length;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <div className="flex gap-6 mb-6">
          <div className="bg-gray-200 rounded p-4 flex-1 text-center">
            <div className="text-lg font-bold">{totalUsers}</div>
            <div className="text-gray-600">Total Users</div>
          </div>
          <div className="bg-gray-200 rounded p-4 flex-1 text-center">
            <div className="text-lg font-bold">{totalAdmins}</div>
            <div className="text-gray-600">Admins</div>
          </div>
          <div className="bg-gray-200 rounded p-4 flex-1 text-center">
            <div className="text-lg font-bold">{totalClients}</div>
            <div className="text-gray-600">Clients</div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="even:bg-gray-50">
                  <td className="p-2 border">{u.name}</td>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border capitalize">{u.role}</td>
                  <td className="p-2 border">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            clearAuth();
          }}
          className="mt-6 bg-red-600 text-white px-4 py-2 rounded"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
