import { createApp } from "./app.js";
import { loadEnv } from "./utils/load-env.js";
import { parseEnv } from "./utils/parse-env.js";

loadEnv();
const env = parseEnv();
const app = createApp(env);

app.listen(env.port, () => {
  process.stdout.write(`listening on ${env.port}\n`);
});
