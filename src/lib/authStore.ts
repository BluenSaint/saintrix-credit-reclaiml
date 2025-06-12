import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
  [key: string]: any;
}

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}));

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return !!user && user.user_metadata?.role === "admin";
} 