import http from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startOverdueJob } from "./jobs/overdue-job.js";
import { socketManager } from "./socket/socket-manager.js";

const app = createApp();
const server = http.createServer(app);

socketManager.initialize(server);
startOverdueJob();

server.listen(env.PORT, () => {
  console.log(`Backend listening on port ${env.PORT}`);
});
