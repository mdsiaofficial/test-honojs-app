import { env } from "./config/env";
import { app } from "./app";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`
Server is running!
-----------------------------------------------------------
- Listening on:      http://localhost:${server.port}
- Health Check:      http://localhost:${server.port}/health
- Runtime:           Bun ${Bun.version}
- Environment:       ${env.NODE_ENV}
-----------------------------------------------------------
`);

const handle_shutdown = () => {
  console.log("\nGracefully shutting down server...");
  server.stop();
  process.exit(0);
};

process.on("SIGINT", handle_shutdown);
process.on("SIGTERM", handle_shutdown);

export default server;