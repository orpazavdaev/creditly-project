import "./utils/load-env.js";
import { appEventBus } from "./event-bus/app-event-bus.js";
import { registerEventBusListeners } from "./event-bus/register-listeners.js";
import { createApp } from "./app.js";
import { parseEnv } from "./utils/parse-env.js";
import { startRefreshTokenCleanupJob } from "./jobs/refresh-token-cleanup.js";

registerEventBusListeners(appEventBus);

const env = parseEnv();
const app = createApp(env, appEventBus);

startRefreshTokenCleanupJob();

app.listen(env.port, () => {
  console.log(`listening on ${env.port}`);
});
