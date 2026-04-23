import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { AuctionController } from "../../controllers/auction.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRoles } from "../../middleware/require-role.js";

export function createAuctionRouter(env: AppEnv, controller: AuctionController): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  r.post("/", auth, requireRoles(["MANAGER"]), controller.create);
  return r;
}
