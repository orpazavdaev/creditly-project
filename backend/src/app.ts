import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { AppEnv } from "./types/env.js";
import { AuthController } from "./controllers/auth.controller.js";
import { HealthController } from "./controllers/health.controller.js";
import { AuthRepository } from "./repositories/auth.repository.js";
import { HealthRepository } from "./repositories/health.repository.js";
import { AuthService } from "./services/auth.service.js";
import { HealthService } from "./services/health.service.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { requestContext } from "./middleware/request-context.js";

export function createApp(env: AppEnv): express.Express {
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

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
