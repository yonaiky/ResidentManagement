import { create } from "zustand";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

interface AuthUserState {
  user: AuthUser | null;
  isLoading: boolean;
  isFetched: boolean;
  fetchUser: () => Promise<void>;
  reset: () => void;
}

let fetchPromise: Promise<void> | null = null;

export const useAuthUserStore = create<AuthUserState>((set, get) => ({
  user: null,
  isLoading: false,
  isFetched: false,
  reset: () => {
    fetchPromise = null;
    set({ user: null, isLoading: false, isFetched: false });
  },
  fetchUser: async () => {
    if (get().isFetched && get().user) return;
    if (fetchPromise) return fetchPromise;

    set({ isLoading: true });

    fetchPromise = (async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          set({ user: data.user, isFetched: true });
        } else {
          set({ user: null, isFetched: true });
        }
      } catch {
        set({ user: null, isFetched: true });
      } finally {
        set({ isLoading: false });
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  },
}));
