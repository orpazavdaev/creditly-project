import type { AppEnv } from "../types/env.js";

export function parseEnv(): AppEnv {
  const port = Number(process.env.PORT);
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number.isFinite(port) && port > 0 ? port : 3001,
    corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  };
}
