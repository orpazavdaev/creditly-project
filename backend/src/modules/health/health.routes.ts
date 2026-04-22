import { Router } from "express";
import type { HealthController } from "../../controllers/health.controller.js";

export function createHealthRouter(controller: HealthController): Router {
  const r = Router();
  r.get("/", controller.get);
  return r;
}
