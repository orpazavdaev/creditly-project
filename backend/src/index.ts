import "./utils/load-env.js";
import { createApp } from "./app.js";
import { parseEnv } from "./utils/parse-env.js";
import { prisma } from "./repositories/prisma.js";
import { startRefreshTokenCleanupJob } from "./jobs/refresh-token-cleanup.js";

const env = parseEnv();
const app = createApp(env);

startRefreshTokenCleanupJob(prisma);

app.listen(env.port, () => {
  process.stdout.write(`listening on ${env.port}\n`);
});
