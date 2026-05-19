import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  hydrated: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      collapsed: false,
      mobileOpen: false,
      hydrated: false,
      setCollapsed: (collapsed) => set({ collapsed }),
      toggleCollapsed: () => set({ collapsed: !get().collapsed }),
      setMobileOpen: (mobileOpen) => set({ mobileOpen }),
      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: "rm-sidebar",
      partialize: (state) => ({ collapsed: state.collapsed }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
