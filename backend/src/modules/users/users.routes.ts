import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { UserController } from "../../controllers/user.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRoles } from "../../middleware/require-role.js";

export function createUsersRouter(env: AppEnv, controller: UserController): Router {
  const r = Router();
  r.get(
    "/",
    authenticateJWT(env),
    requireRoles(["ADMIN", "MANAGER"]),
    controller.listAssignable
  );
  return r;
}
