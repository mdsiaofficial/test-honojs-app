import { env } from "./config/env";
import { app } from "./app";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`
🚀 Server is running!
---------------------------------------------
📡 Listening on:      http://localhost:${server.port}
🩺 Health Check:      http://localhost:${server.port}/health
✨ Runtime:           Bun ${Bun.version}
🌍 Environment:       ${env.NODE_ENV}
---------------------------------------------
`);

const handleShutdown = () => {
  console.log("\nGracefully shutting down server...");
  server.stop();
  process.exit(0);
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

export default server;