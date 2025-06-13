"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const { user, role, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (role !== "admin") router.push("/login");
  }, [role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold">Welcome Admin</h1>
        <p className="text-gray-600 mt-2">Logged in as: {user?.email}</p>
        <button
          onClick={handleLogout}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
