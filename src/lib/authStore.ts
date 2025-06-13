import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/hooks/useAuth'

interface AuthState {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null })
    }),
    {
      name: 'auth-storage'
    }
  )
)

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return !!user && user.user_metadata?.role === "admin";
} 