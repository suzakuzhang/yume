"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  username: string;
  role: string;
  anon?: boolean;
}

export interface KeepResult {
  claimed?: boolean;
  accessToken?: string;
  user?: AuthUser;
  dream?: unknown;
  error?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  capabilities: Record<string, boolean>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, inviteCode: string) => Promise<void>;
  /** passwordless retrace: type your id to return to your kept dreams (/diary). */
  enter: (id: string) => Promise<void>;
  /** silent anonymous session, created on first dream. */
  enterAnon: () => Promise<void>;
  /** keep this dream in the library at 拂晓 — claim an id (optional) + write a reflection. */
  keep: (dreamId: string, opts?: { id?: string; reflection?: string }) => Promise<KeepResult>;
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
    enter: (id) => handleAuth("/api/auth/enter", { id }),
    enterAnon: () => handleAuth("/api/auth/anon", {}),
    keep: async (dreamId, opts = {}) => {
      const res = await authedFetch(`/api/dreams/${dreamId}/keep`, { method: "POST", body: JSON.stringify(opts) });
      const data: KeepResult = await res.json();
      if (!res.ok) throw new Error(data.error ?? "保留失败");
      if (data.accessToken) {
        localStorage.setItem(TOKEN_KEY, data.accessToken);
        setToken(data.accessToken);
      }
      if (data.user) setUser(data.user);
      return data;
    },
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
