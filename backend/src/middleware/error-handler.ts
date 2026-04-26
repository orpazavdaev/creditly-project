import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.code ?? "http_error",
      message: err.message,
    });
    return;
  }
  const asError = err instanceof Error ? err : new Error(typeof err === "string" ? err : JSON.stringify(err));
  console.error(`[error] ${asError.name}: ${asError.message}\n${asError.stack ?? ""}`);
  res.status(500).json({
    error: "internal_error",
    message: "Something went wrong. Please try again.",
  });
}
