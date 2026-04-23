"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ACCESS_TOKEN_KEY, ACCESS_TOKEN_UPDATE_EVENT } from "@/lib/config";
import { apiFetch, apiRefreshAccessToken, setStoredAccessToken } from "@/lib/api";
import { decodeJwtPayload, isJwtExpired } from "@/lib/jwt";
import type { UserRole } from "@/types/roles";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
};

type AuthContextValue = {
  ready: boolean;
  accessToken: string | null;
  user: SessionUser | null;
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function payloadToUser(token: string): SessionUser | null {
  const p = decodeJwtPayload(token);
  if (!p?.sub || !p.email || !p.role) return null;
  const role = p.role as UserRole;
  if (role !== "ADMIN" && role !== "MANAGER" && role !== "USER" && role !== "BANKER") {
    return null;
  }
  return { id: p.sub, email: p.email, role };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const setAccessToken = useCallback((token: string | null) => {
    setStoredAccessToken(token);
    setAccessTokenState(token);
  }, []);

  useEffect(() => {
    const onToken = (e: Event) => {
      const d = (e as CustomEvent<{ accessToken: string | null }>).detail;
      if (d && "accessToken" in d) {
        setAccessTokenState(d.accessToken ?? null);
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener(ACCESS_TOKEN_UPDATE_EVENT, onToken);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(ACCESS_TOKEN_UPDATE_EVENT, onToken);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = typeof window !== "undefined" ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
      if (stored && !isJwtExpired(stored)) {
        if (!cancelled) setAccessTokenState(stored);
        if (!cancelled) setReady(true);
        return;
      }
      if (stored) setStoredAccessToken(null);
      try {
        const next = await apiRefreshAccessToken();
        if (!cancelled) {
          setStoredAccessToken(next.accessToken);
          setAccessTokenState(next.accessToken);
        }
      } catch {
        if (!cancelled) setAccessTokenState(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const user = useMemo(() => {
    if (!accessToken) return null;
    return payloadToUser(accessToken);
  }, [accessToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const out = await apiFetch<{ accessToken: string; expiresIn: number }>("/auth/login", {
        method: "POST",
        auth: false,
        credentials: "include",
        json: { email, password },
      });
      await queryClient.cancelQueries();
      queryClient.clear();
      setAccessToken(out.accessToken);
    },
    [setAccessToken, queryClient]
  );

  const logout = useCallback(() => {
    void (async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      setAccessToken(null);
    })();
  }, [setAccessToken, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      accessToken,
      user,
      setAccessToken,
      login,
      logout,
    }),
    [ready, accessToken, user, setAccessToken, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
