import { API_BASE, ACCESS_TOKEN_KEY, ACCESS_TOKEN_UPDATE_EVENT } from "./config";
import { isJwtExpired } from "./jwt";

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

function emitAccessTokenToApp(token: string | null): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ accessToken: string | null }>(ACCESS_TOKEN_UPDATE_EVENT, {
      detail: { accessToken: token },
    })
  );
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

type FetchOptionsInternal = FetchOptions & { _retried?: boolean };

function parseResponseBody(
  res: Response,
  text: string
): { error: ApiRequestError } | { data: { error?: string; message?: string } } {
  if (text.length > 0) {
    let data: { error?: string; message?: string };
    try {
      data = JSON.parse(text) as { error?: string; message?: string };
    } catch {
      if (!res.ok) {
        const snippet = text.length > 240 ? `${text.slice(0, 240)}…` : text;
        return { error: new ApiRequestError(res.status, "invalid_response", snippet || `HTTP ${res.status}`) };
      }
      return { error: new ApiRequestError(res.status, "invalid_response", "Unexpected response from server") };
    }
    if (!res.ok) {
      return {
        error: new ApiRequestError(
          res.status,
          typeof data.error === "string" ? data.error : "request_failed",
          typeof data.message === "string" ? data.message : `HTTP ${res.status}`
        ),
      };
    }
    return { data };
  }
  if (!res.ok) {
    return { error: new ApiRequestError(res.status, "request_failed", `HTTP ${res.status}`) };
  }
  return { data: {} };
}

async function rawJsonFetch<T>(path: string, options: FetchOptionsInternal = {}): Promise<T> {
  const { auth = true, json, headers: initHeaders, _retried: _unused, ...rest } = options;
  void _unused;
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
  const parsed = parseResponseBody(res, text);
  if ("error" in parsed) {
    return Promise.reject(parsed.error) as never;
  }
  return parsed.data as T;
}

export async function apiRefreshAccessToken(): Promise<{ accessToken: string; expiresIn: number }> {
  return rawJsonFetch<{ accessToken: string; expiresIn: number }>("/auth/refresh", {
    method: "POST",
    credentials: "include",
    auth: false,
  });
}

let refreshInFlight: Promise<string | null> | null = null;

function refreshAccessTokenSingleFlight(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;
  const p = (async () => {
    try {
      const out = await apiRefreshAccessToken();
      setStoredAccessToken(out.accessToken);
      emitAccessTokenToApp(out.accessToken);
      return out.accessToken;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();
  refreshInFlight = p;
  return p;
}

async function ensureValidAccessTokenForRequest(): Promise<void> {
  const t = getStoredToken();
  if (t && !isJwtExpired(t)) return;
  await refreshAccessTokenSingleFlight();
}

export async function apiFetch<T>(path: string, options: FetchOptionsInternal = {}): Promise<T> {
  const { auth = true, _retried } = options;
  if (auth && !_retried) {
    await ensureValidAccessTokenForRequest();
  }
  try {
    return await rawJsonFetch<T>(path, options);
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 401 && auth && !_retried) {
      const t = await refreshAccessTokenSingleFlight();
      if (t) {
        return rawJsonFetch<T>(path, { ...options, _retried: true });
      }
    }
    throw e;
  }
}