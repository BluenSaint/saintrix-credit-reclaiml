"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/authStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleLogin = async () => {
    setError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return setError(error.message);

    const { user, session } = data;
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = userData?.role;

    if (!role) return setError("No role assigned to this user.");
    setAuth(user, session, role);

    router.push(role === "admin" ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-center">
          Login to Saintrix
        </h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          className="w-full border p-2 rounded mb-2"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          className="w-full border p-2 rounded mb-4"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-purple-600 text-white py-2 rounded"
        >
          Sign In
        </button>
        {error && (
          <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
