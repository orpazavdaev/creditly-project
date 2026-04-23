import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { EventBus } from "./event-bus/event-bus.js";
import { appEventBus } from "./event-bus/app-event-bus.js";
import type { AppEnv } from "./types/env.js";
import { AccountController } from "./controllers/account.controller.js";
import { AuctionController } from "./controllers/auction.controller.js";
import { AuctionOfferController } from "./controllers/auction-offer.controller.js";
import { AuthController } from "./controllers/auth.controller.js";
import { BankOfferController } from "./controllers/bank-offer.controller.js";
import { EventController } from "./controllers/event.controller.js";
import { HealthController } from "./controllers/health.controller.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import { EventRepository } from "./repositories/event.repository.js";
import { HealthRepository } from "./repositories/health.repository.js";
import { AccountAuctionRepository } from "./repositories/account-auction.repository.js";
import { AuctionLifecycleRepository } from "./repositories/auction-lifecycle.repository.js";
import { AuctionOfferRepository } from "./repositories/auction-offer.repository.js";
import { AccountAuctionService } from "./services/account-auction.service.js";
import { AuctionCloseService } from "./services/auction-close.service.js";
import { AuctionOfferService } from "./services/auction-offer.service.js";
import { AuthService } from "./services/auth.service.js";
import { EventService } from "./services/event.service.js";
import { HealthService } from "./services/health.service.js";
import { createAccountRouter } from "./modules/account/account.routes.js";
import { createAuctionRouter } from "./modules/auction/auction.routes.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createBankOfferRouter } from "./modules/bank-offer/bank-offer.routes.js";
import { createEventRouter } from "./modules/events/event.routes.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { requestContext } from "./middleware/request-context.js";

export function createApp(env: AppEnv, eventBus: EventBus = appEventBus): express.Express {
  const auctionLifecycleRepo = new AuctionLifecycleRepository();
  const app = express();
  app.use(requestContext);
  app.use(cookieParser());
  app.use(express.json());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );

  const healthController = new HealthController(
    new HealthService(new HealthRepository())
  );

  const authController = new AuthController(
    new AuthService(new AuthRepository(), env)
  );

  app.use("/health", createHealthRouter(healthController));
  app.use("/auth", createAuthRouter(authController));

  app.use(
    "/auctions",
    createAuctionRouter(
      env,
      new AuctionController(new AuctionCloseService(auctionLifecycleRepo, eventBus)),
      new AuctionOfferController(
        new AuctionOfferService(new AuctionOfferRepository(), auctionLifecycleRepo, eventBus)
      )
    )
  );
  app.use("/bank-offers", createBankOfferRouter(env, new BankOfferController()));
  app.use(
    "/accounts",
    createAccountRouter(
      env,
      new AccountController(new AccountAuctionService(new AccountAuctionRepository(), eventBus))
    )
  );
  app.use(
    "/events",
    createEventRouter(env, new EventController(new EventService(new EventRepository(), eventBus)))
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
