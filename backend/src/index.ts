import "./utils/load-env.js";
import { appEventBus } from "./event-bus/app-event-bus.js";
import { registerEventBusListeners } from "./event-bus/register-listeners.js";
import { createApp } from "./app.js";
import { parseEnv } from "./utils/parse-env.js";
import { prisma } from "./repositories/prisma.js";
import { startRefreshTokenCleanupJob } from "./jobs/refresh-token-cleanup.js";

registerEventBusListeners(appEventBus);

const env = parseEnv();
const app = createApp(env, appEventBus);

startRefreshTokenCleanupJob(prisma);

app.listen(env.port, () => {
  process.stdout.write(`listening on ${env.port}\n`);
});
