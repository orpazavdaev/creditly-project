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
  r.post("/", auth, requireRoles(["MANAGER"]), controller.create);
  r.post(
    "/:id/close",
    auth,
    requireRoles(["ADMIN", "MANAGER"], { allowAdminBypass: false }),
    controller.close
  );
  r.get("/:id/offers", auth, requireRole("BANKER", bankerOnly), offerController.list);
  r.post("/:id/offers", auth, requireRole("BANKER", bankerOnly), offerController.submit);
  return r;
}
