import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { AuctionController } from "../../controllers/auction.controller.js";
import type { AuctionOfferController } from "../../controllers/auction-offer.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRole, requireRoles } from "../../middleware/require-role.js";

export function createAuctionRouter(
  env: AppEnv,
  controller: AuctionController,
  offerController: AuctionOfferController
): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  const bankerOnly = { allowAdminBypass: false } as const;
  const managerAdminOnly = requireRoles(["ADMIN", "MANAGER"]);
  r.get("/", auth, requireRoles(["ADMIN", "BANKER"]), controller.list);
  r.post("/:id/close", auth, managerAdminOnly, controller.close);
  r.get("/:id/offers", auth, requireRoles(["BANKER", "ADMIN"]), offerController.list);
  r.post("/:id/offers", auth, requireRole("BANKER", bankerOnly), offerController.submit);
  return r;
}
