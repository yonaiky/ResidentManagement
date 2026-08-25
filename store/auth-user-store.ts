import { create } from "zustand";

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
};

type AuthGateCache = {
  user: AuthUser;
  hasActiveMembership: boolean;
};

const AUTH_GATE_KEY = "rm-auth-gate";

function readGateCache(): AuthGateCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_GATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthGateCache;
  } catch {
    return null;
  }
}

function writeGateCache(cache: AuthGateCache | null) {
  if (typeof window === "undefined") return;
  try {
    if (!cache) {
      sessionStorage.removeItem(AUTH_GATE_KEY);
      return;
    }
    sessionStorage.setItem(AUTH_GATE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota / private mode
  }
}

interface AuthUserState {
  user: AuthUser | null;
  hasActiveMembership: boolean;
  isLoading: boolean;
  isFetched: boolean;
  hydrateFromCache: () => void;
  fetchUser: (options?: { force?: boolean }) => Promise<void>;
  reset: () => void;
}

let fetchPromise: Promise<void> | null = null;

export const useAuthUserStore = create<AuthUserState>((set, get) => ({
  user: null,
  hasActiveMembership: false,
  isLoading: false,
  isFetched: false,
  hydrateFromCache: () => {
    if (get().isFetched || get().user) return;
    const cached = readGateCache();
    if (!cached?.user) return;
    set({
      user: cached.user,
      hasActiveMembership: cached.hasActiveMembership,
      isFetched: true,
    });
  },
  reset: () => {
    fetchPromise = null;
    writeGateCache(null);
    set({
      user: null,
      hasActiveMembership: false,
      isLoading: false,
      isFetched: false,
    });
  },
  fetchUser: async (options) => {
    const force = options?.force === true;

    if (!force && get().isFetched && get().user) {
      return fetchPromise ?? undefined;
    }
    if (fetchPromise) return fetchPromise;

    set({ isLoading: true });

    fetchPromise = (async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const next = {
            user: data.user as AuthUser,
            hasActiveMembership: Boolean(data.hasActiveMembership),
          };
          writeGateCache(next);
          set({
            user: next.user,
            hasActiveMembership: next.hasActiveMembership,
            isFetched: true,
          });
        } else {
          writeGateCache(null);
          set({ user: null, hasActiveMembership: false, isFetched: true });
        }
      } catch {
        if (!get().user) {
          set({ user: null, hasActiveMembership: false, isFetched: true });
        } else {
          set({ isFetched: true });
        }
      } finally {
        set({ isLoading: false });
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  },
}));
