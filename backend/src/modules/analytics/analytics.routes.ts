import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { AnalyticsController } from "../../controllers/analytics.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRoles } from "../../middleware/require-role.js";

export function createAnalyticsRouter(env: AppEnv, controller: AnalyticsController): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  const adminAnalytics = requireRoles(["ADMIN"]);
  r.get("/summary", auth, adminAnalytics, controller.summary);
  return r;
}
