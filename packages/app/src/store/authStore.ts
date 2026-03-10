import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),
  logout: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));
