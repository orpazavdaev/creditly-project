import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { EventController } from "../../controllers/event.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";

export function createEventRouter(env: AppEnv, controller: EventController): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  r.post("/", auth, controller.create);
  r.get("/", auth, controller.list);
  return r;
}
