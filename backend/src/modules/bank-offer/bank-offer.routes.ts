import { Router } from "express";
import type { AppEnv } from "../../types/env.js";
import type { BankOfferController } from "../../controllers/bank-offer.controller.js";
import { authenticateJWT } from "../../middleware/authenticate-jwt.js";
import { requireRole } from "../../middleware/require-role.js";

export function createBankOfferRouter(env: AppEnv, controller: BankOfferController): Router {
  const r = Router();
  const auth = authenticateJWT(env);
  r.post("/", auth, requireRole("BANKER"), controller.submit);
  return r;
}
