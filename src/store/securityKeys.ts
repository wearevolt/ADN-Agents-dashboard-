import { create } from "zustand";

type SecurityKey = { id: string; system_name: string; description?: string | null };

type SecurityKeysState = {
  keys: SecurityKey[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchIfNeeded: () => Promise<void>;
  forceRefresh: () => Promise<void>;
};

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export const useSecurityKeysStore = create<SecurityKeysState>((set, get) => ({
  keys: [],
  loading: false,
  error: null,
  lastFetchedAt: null,
  fetchIfNeeded: async () => {
    const { loading, lastFetchedAt } = get();
    const now = Date.now();
    if (loading) return;
    if (lastFetchedAt && now - lastFetchedAt < TTL_MS) return;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/tools/security-keys", { cache: "no-store" });
      if (res.status === 403 || res.status === 401) {
        set({ keys: [], loading: false, lastFetchedAt: now });
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as SecurityKey[];
      set({ keys: data, loading: false, lastFetchedAt: now });
    } catch (e: any) {
      set({ error: e?.message || String(e), loading: false, lastFetchedAt: now });
    }
  },
  forceRefresh: async () => {
    set({ lastFetchedAt: null });
    await get().fetchIfNeeded();
  },
}));

export function initSecurityKeysRevalidateOnFocus() {
  if (typeof window === "undefined") return;
  const handler = () => {
    useSecurityKeysStore.getState().fetchIfNeeded();
  };
  window.addEventListener("focus", handler);
  document.addEventListener("visibilitychange", handler);
}


