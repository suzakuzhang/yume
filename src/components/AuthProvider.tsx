"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  capabilities: Record<string, boolean>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, inviteCode: string) => Promise<void>;
  logout: () => Promise<void>;
  /** fetch with the access token attached. */
  authedFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const TOKEN_KEY = "yume_token";
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const authedFetch = useCallback(
    (input: string, init: RequestInit = {}) => {
      const t = token ?? (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
      const headers = new Headers(init.headers);
      if (t) headers.set("X-Access-Token", t);
      if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return fetch(input, { ...init, headers });
    },
    [token]
  );

  const refresh = useCallback(async (t: string | null) => {
    if (!t) {
      setUser(null);
      setCapabilities({});
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/access/status", { headers: { "X-Access-Token": t } });
      const data = await res.json();
      if (data.authed) {
        setUser(data.user);
        setCapabilities(data.capabilities ?? {});
      } else {
        setUser(null);
        setCapabilities({});
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    setToken(t);
    refresh(t);
  }, [refresh]);

  async function handleAuth(path: string, payload: Record<string, unknown>) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "请求失败");
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    setToken(data.accessToken);
    setUser(data.user);
    setCapabilities(data.capabilities ?? {});
  }

  const value: AuthState = {
    user,
    token,
    loading,
    capabilities,
    login: (username, password) => handleAuth("/api/auth/login", { username, password }),
    register: (username, password, inviteCode) =>
      handleAuth("/api/auth/register", { username, password, inviteCode }),
    logout: async () => {
      await authedFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setCapabilities({});
    },
    authedFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth 必须在 <AuthProvider> 内使用");
  return ctx;
}
