import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark";

interface UiState {
  sidebarOpen: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: "light",
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    {
      name: "coredesk-ui",
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);
