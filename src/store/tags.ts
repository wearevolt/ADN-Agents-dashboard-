import { create } from "zustand";

type TagItem = { id: string; name: string };

type TagsState = {
  tags: TagItem[];
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchIfNeeded: () => Promise<void>;
  forceRefresh: () => Promise<void>;
};

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
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
      const res = await fetch("/api/tools/tags", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { id: string; name: string }[];
      set({ tags: data, loading: false, lastFetchedAt: now });
    } catch (e: any) {
      set({ error: e?.message || String(e), loading: false, lastFetchedAt: now });
    }
  },
  forceRefresh: async () => {
    set({ lastFetchedAt: null });
    await get().fetchIfNeeded();
  },
}));

// Utility to enable global revalidate on window focus
export function initTagsRevalidateOnFocus() {
  if (typeof window === "undefined") return;
  const handler = () => {
    useTagsStore.getState().fetchIfNeeded();
  };
  window.addEventListener("focus", handler);
  document.addEventListener("visibilitychange", handler);
}


