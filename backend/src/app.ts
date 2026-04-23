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
import { EventController } from "./controllers/event.controller.js";
import { AnalyticsController } from "./controllers/analytics.controller.js";
import { HealthController } from "./controllers/health.controller.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import { EventRepository } from "./repositories/event.repository.js";
import { HealthRepository } from "./repositories/health.repository.js";
import { AccountAuctionRepository } from "./repositories/account-auction.repository.js";
import { AccountRepository } from "./repositories/account.repository.js";
import { AuctionBrowseRepository } from "./repositories/auction-browse.repository.js";
import { AuctionLifecycleRepository } from "./repositories/auction-lifecycle.repository.js";
import { AnalyticsRepository } from "./repositories/analytics.repository.js";
import { AuctionOfferRepository } from "./repositories/auction-offer.repository.js";
import { AccountAccessService } from "./services/account-access.service.js";
import { AccountAuctionService } from "./services/account-auction.service.js";
import { AccountCreateService } from "./services/account-create.service.js";
import { AccountListService } from "./services/account-list.service.js";
import { AuctionBrowseService } from "./services/auction-browse.service.js";
import { AuctionCloseService } from "./services/auction-close.service.js";
import { AuctionOfferService } from "./services/auction-offer.service.js";
import { AnalyticsService } from "./services/analytics.service.js";
import { AuthService } from "./services/auth.service.js";
import { EventService } from "./services/event.service.js";
import { HealthService } from "./services/health.service.js";
import { createAccountRouter } from "./modules/account/account.routes.js";
import { createAnalyticsRouter } from "./modules/analytics/analytics.routes.js";
import { createAuctionRouter } from "./modules/auction/auction.routes.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createEventRouter } from "./modules/events/event.routes.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { requestContext } from "./middleware/request-context.js";

export function createApp(env: AppEnv, eventBus: EventBus = appEventBus): express.Express {
  const auctionLifecycleRepo = new AuctionLifecycleRepository();
  const accountRepo = new AccountRepository();
  const accountAccess = new AccountAccessService(accountRepo);
  const accountListService = new AccountListService(accountRepo, accountAccess);
  const authRepository = new AuthRepository();
  const accountCreateService = new AccountCreateService(accountRepo);
  const auctionBrowseRepository = new AuctionBrowseRepository();
  const auctionBrowseService = new AuctionBrowseService(auctionBrowseRepository);
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

  const authController = new AuthController(new AuthService(authRepository, env));

  app.use("/health", createHealthRouter(healthController));
  app.use("/auth", createAuthRouter(authController));
  app.use(
    "/analytics",
    createAnalyticsRouter(env, new AnalyticsController(new AnalyticsService(new AnalyticsRepository())))
  );

  app.use(
    "/auctions",
    createAuctionRouter(
      env,
      new AuctionController(
        new AuctionCloseService(auctionLifecycleRepo, eventBus, accountAccess),
        auctionBrowseService
      ),
      new AuctionOfferController(
        new AuctionOfferService(new AuctionOfferRepository(), auctionLifecycleRepo, eventBus)
      )
    )
  );
  app.use(
    "/accounts",
    createAccountRouter(
      env,
      new AccountController(
        new AccountAuctionService(new AccountAuctionRepository(), eventBus, accountAccess),
        accountListService,
        accountCreateService
      )
    )
  );
  app.use(
    "/events",
    createEventRouter(
      env,
      new EventController(new EventService(new EventRepository(), eventBus, accountAccess))
    )
  );

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
