import { Router } from "express";
import type { AuthController } from "../../controllers/auth.controller.js";

export function createAuthRouter(controller: AuthController): Router {
  const r = Router();
  r.post("/register", controller.register);
  r.post("/login", controller.login);
  r.post("/refresh", controller.refresh);
  return r;
}
