import { API_BASE, ACCESS_TOKEN_KEY } from "./config";

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiRequestError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setStoredAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
}

type FetchOptions = RequestInit & {
  auth?: boolean;
  json?: unknown;
};

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, json, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const t = getStoredToken();
    if (t) headers.set("Authorization", `Bearer ${t}`);
  }
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...rest,
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const text = await res.text();
  let data: { error?: string; message?: string } = {};
  if (text.length > 0) {
    try {
      data = JSON.parse(text) as { error?: string; message?: string };
    } catch {
      if (!res.ok) {
        const snippet = text.length > 240 ? `${text.slice(0, 240)}…` : text;
        throw new ApiRequestError(res.status, "invalid_response", snippet || `HTTP ${res.status}`);
      }
      throw new ApiRequestError(
        res.status,
        "invalid_response",
        "Unexpected response from server"
      );
    }
  } else if (!res.ok) {
    throw new ApiRequestError(res.status, "request_failed", `HTTP ${res.status}`);
  }
  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      typeof data.error === "string" ? data.error : "request_failed",
      typeof data.message === "string" ? data.message : `HTTP ${res.status}`
    );
  }
  return data as T;
}

export async function apiRefreshAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
  return apiFetch<{ accessToken: string; expiresIn: number }>("/auth/refresh", {
    method: "POST",
    auth: false,
    credentials: "include",
  });
}
