import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { AppEnv } from "../types/env.js";
import { HttpError } from "../utils/http-error.js";

const ROLES: UserRole[] = ["ADMIN", "MANAGER", "USER", "BANKER"];

function isUserRole(v: unknown): v is UserRole {
  return typeof v === "string" && ROLES.includes(v as UserRole);
}

type AccessClaims = {
  sub?: string;
  email?: string;
  role?: unknown;
};

export function authenticateJWT(env: AppEnv) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const header = req.headers.authorization;
      const token =
        typeof header === "string" && header.startsWith("Bearer ")
          ? header.slice(7)
          : null;
      if (!token) {
        throw new HttpError(401, "Missing access token", "missing_token");
      }
      const decoded = jwt.verify(token, env.jwtSecret) as AccessClaims;
      if (
        typeof decoded.sub !== "string" ||
        typeof decoded.email !== "string" ||
        !isUserRole(decoded.role)
      ) {
        throw new HttpError(401, "Invalid access token", "invalid_token");
      }
      req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
      next();
    } catch (e) {
      if (e instanceof HttpError) {
        next(e);
        return;
      }
      next(new HttpError(401, "Invalid access token", "invalid_token"));
    }
  };
}
