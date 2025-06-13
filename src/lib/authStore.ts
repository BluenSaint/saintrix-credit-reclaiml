import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/hooks/useAuth";

type AuthState = {
  user: any;
  role: "admin" | "client" | null;
  session: any;
  setAuth: (user: any, session: any, role: "admin" | "client") => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      role: null,
      setAuth: (user, session, role) => set({ user, session, role }),
      clearAuth: () => set({ user: null, session: null, role: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
