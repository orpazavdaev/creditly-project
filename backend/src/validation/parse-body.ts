import type { ZodType } from "zod";
import { HttpError } from "../utils/http-error.js";

export function firstQueryString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return "";
}

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.issues[0]?.message ?? "Invalid body";
    throw new HttpError(400, msg, "invalid_body");
  }
  return r.data;
}

export function parseParams<T>(schema: ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) {
    const msg = r.error.issues[0]?.message ?? "Invalid parameters";
    throw new HttpError(400, msg, "invalid_params");
  }
  return r.data;
}

export function parseQuery<T>(schema: ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) {
    const msg = r.error.issues[0]?.message ?? "Invalid query";
    throw new HttpError(400, msg, "invalid_query");
  }
  return r.data;
}
