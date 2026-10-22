"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type SessionUser = { name: string };

type AuthContextValue = {
  user: SessionUser | null;
  login: (u: SessionUser | null) => void;
  logout: () => void;
};

const STORAGE_KEY = "av_user";

// Store externo: la sesión vive en memoria y se espeja en localStorage (si está disponible).
let current: SessionUser | null = null;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.name === "string" ? { name: parsed.name } : null;
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      current = readStorage();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): SessionUser | null {
  if (!loaded) {
    current = readStorage();
    loaded = true;
  }
  return current;
}

function getServerSnapshot(): SessionUser | null {
  return null;
}

function setUser(u: SessionUser | null) {
  current = u;
  loaded = true;
  try {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage bloqueado: la sesión queda solo en memoria.
  }
  emit();
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const login = useCallback((u: SessionUser | null) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);
  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
