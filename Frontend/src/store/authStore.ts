import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // ✅ Sets the current user and login state
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      // ✅ Controls loading state globally (used during login/init)
      setLoading: (isLoading) => set({ isLoading }),

      // ✅ Logout: clear access token, keep cookie managed by backend
      logout: () => {
        console.debug("🚪 Logging out — clearing local data");

        // Remove only the access token (refresh token is httpOnly cookie)
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_profile");

        // Reset store state
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: "auth-storage", // storage key
      // ✅ Only persist essential fields
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
