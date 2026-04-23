import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http-error.js";

export type RequireRolesOptions = {
  allowAdminBypass?: boolean;
};

export function requireRoles(
  allowed: UserRole[],
  options?: RequireRolesOptions
): (req: Request, _res: Response, next: NextFunction) => void {
  const allowAdminBypass = options?.allowAdminBypass !== false;
  return (req, _res, next): void => {
    if (!req.user) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }
    if (allowAdminBypass && req.user.role === "ADMIN") {
      next();
      return;
    }
    if (allowed.includes(req.user.role)) {
      next();
      return;
    }
    next(new HttpError(403, "Forbidden", "forbidden"));
  };
}

export function requireRole(
  role: UserRole,
  options?: RequireRolesOptions
): (req: Request, _res: Response, next: NextFunction) => void {
  return requireRoles([role], options);
}
