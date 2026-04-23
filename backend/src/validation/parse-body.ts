import type { ZodType } from "zod";
import { HttpError } from "../utils/http-error.js";

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const r = schema.safeParse(body);
  if (!r.success) {
    const msg = r.error.issues[0]?.message ?? "Invalid body";
    throw new HttpError(400, msg, "invalid_body");
  }
  return r.data;
}
