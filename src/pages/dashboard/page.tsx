"use client";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/authStore";
import { supabase } from "@/lib/supabase";

export default function ClientDashboard() {
  const { user, role, clearAuth } = useAuthStore();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (role !== "client") return;
    const fetchClient = async () => {
      setLoading(true);
      setError("");
      if (!user?.id) {
        setError("No user session");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("clients")
        .select("full_name, email, credit_score, created_at")
        .eq("user_id", user.id)
        .single();
      if (error) setError(error.message);
      setClient(data);
      setLoading(false);
    };
    fetchClient();
  }, [user, role]);

  if (role !== "client")
    return <div className="p-8 text-center">Access denied.</div>;
  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow max-w-xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Welcome to your dashboard</h1>
        <p className="text-gray-600 mb-4">Logged in as: {client?.email}</p>
        <div className="mb-4">
          <div>
            <span className="font-semibold">Name:</span> {client?.full_name}
          </div>
          <div>
            <span className="font-semibold">Credit Score:</span>{" "}
            {client?.credit_score ?? "N/A"}
          </div>
          <div>
            <span className="font-semibold">Signup Date:</span>{" "}
            {client?.created_at
              ? new Date(client.created_at).toLocaleDateString()
              : "N/A"}
          </div>
        </div>
        <div className="bg-purple-100 border border-purple-300 rounded p-4 mt-6 text-center">
          <span className="font-semibold">Upcoming Dispute Round:</span>{" "}
          <span className="italic text-gray-500">(Coming soon)</span>
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
