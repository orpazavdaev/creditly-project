import type { AppEnv } from "../types/env.js";

export function parseEnv(): AppEnv {
  const port = Number(process.env.PORT);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is required");
  }
  const accessSeconds = Number(process.env.ACCESS_TOKEN_EXPIRES_SECONDS);
  const refreshDays = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS);
  return {
    nodeEnv,
    port: Number.isFinite(port) && port > 0 ? port : 3001,
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    jwtSecret,
    accessTokenExpiresSeconds:
      Number.isFinite(accessSeconds) && accessSeconds > 0 ? accessSeconds : 900,
    refreshTokenExpiresDays:
      Number.isFinite(refreshDays) && refreshDays > 0 ? refreshDays : 7,
    refreshCookieName: process.env.REFRESH_TOKEN_COOKIE ?? "refreshToken",
    cookieSecure: nodeEnv === "production",
  };
}
