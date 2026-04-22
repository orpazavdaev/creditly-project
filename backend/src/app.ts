import cors from "cors";
import express from "express";
import type { AppEnv } from "./types/env.js";
import { HealthController } from "./controllers/health.controller.js";
import { HealthRepository } from "./repositories/health.repository.js";
import { HealthService } from "./services/health.service.js";
import { createHealthRouter } from "./modules/health/health.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { requestContext } from "./middleware/request-context.js";

export function createApp(env: AppEnv): express.Express {
  const app = express();
  app.use(requestContext);
  app.use(express.json());
  app.use(
    cors({
      origin: env.corsOrigin,
    })
  );

  const healthController = new HealthController(
    new HealthService(new HealthRepository())
  );

  app.use("/health", createHealthRouter(healthController));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
