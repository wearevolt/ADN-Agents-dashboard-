"use client";

// Client hook to fetch and cache current user's roles (in-memory only)
// Comments in English per project convention
import { useEffect } from "react";
import { create } from "zustand";

type RolesState = {
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  set: (partial: Partial<RolesState>) => void;
  reset: () => void;
};

const useRolesStore = create<RolesState>((set) => ({
  roles: [],
  isAdmin: false,
  loading: false,
  error: null,
  lastFetchedAt: null,
  set: (partial) => set((s) => ({ ...s, ...partial })),
  reset: () => set({ roles: [], isAdmin: false, loading: false, error: null, lastFetchedAt: null }),
}));

async function fetchRolesOnce(): Promise<void> {
  const { loading, lastFetchedAt, set } = useRolesStore.getState();
  const TTL_MS = 60_000; // 60s cache TTL
  const now = Date.now();
  if (loading) return;
  if (lastFetchedAt && now - lastFetchedAt < TTL_MS) return;
  set({ loading: true, error: null });
  try {
    const res = await fetch("/api/auth/roles", { cache: "no-store" });
    if (res.status === 401) {
      set({ roles: [], isAdmin: false, loading: false, lastFetchedAt: now });
      return;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to load roles: ${res.status}`);
    }
    const json = (await res.json()) as { roles: string[] };
    const roles = json.roles || [];
    set({ roles, isAdmin: roles.includes("ADMIN"), loading: false, lastFetchedAt: now });
  } catch (e: any) {
    set({ error: e?.message || String(e), loading: false, lastFetchedAt: now });
  }
}

export function useUserRoles() {
  const state = useRolesStore();

  useEffect(() => {
    // Initial fetch
    fetchRolesOnce();

    // Revalidate on focus
    function onFocus() {
      fetchRolesOnce();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  return state;
}

export function invalidateUserRoles() {
  useRolesStore.getState().set({ lastFetchedAt: null });
}


