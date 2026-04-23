import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { EventController } from "../../controllers/event.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRoles } from "../../middleware/require-role.js";

export function createEventRouter(env: AppEnv, controller: EventController): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  const staffOnly = requireRoles(["ADMIN", "MANAGER", "USER"], { allowAdminBypass: false });
  r.post("/", auth, staffOnly, controller.create);
  r.get("/", auth, staffOnly, controller.list);
  return r;
}
