import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { AccountController } from "../../controllers/account.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRoles } from "../../middleware/require-role.js";

export function createAccountRouter(env: AppEnv, controller: AccountController): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  const staffOnly = requireRoles(["ADMIN", "MANAGER", "USER"], { allowAdminBypass: false });
  const managerAdminOnly = requireRoles(["ADMIN", "MANAGER"], { allowAdminBypass: false });
  r.get("/:id", auth, staffOnly, controller.getById);
  r.post(
    "/:id/auctions",
    auth,
    staffOnly,
    managerAdminOnly,
    controller.createAuctionForAccount
  );
  r.get("/", auth, staffOnly, controller.list);
  return r;
}
