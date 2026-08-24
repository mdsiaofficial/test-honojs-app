import { Hono } from "hono";
import { env } from "./config/env";

const app = new Hono();


// app.get(
//   "/",
//   (c) => {
//     const startTime = Date.now();

//     return c.json({
//       message: "Test honojs application is running",
//       status: "ok",
//       timestamp: new Date().toISOString(),
//       uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
//       runtime: {
//         name: "Bun",
//         version: Bun.version,
//       },
//       environment: process.env.NODE_ENV || "development",
//     });
//   }
// )

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