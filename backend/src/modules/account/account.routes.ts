import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { AccountController } from "../../controllers/account.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRoles } from "../../middleware/require-role.js";

export function createAccountRouter(env: AppEnv, controller: AccountController): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  r.get("/", auth, requireRoles(["MANAGER", "USER"]), controller.list);
  return r;
}
