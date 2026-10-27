import Fastify from "fastify";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "demo-service",
  };
});

app.get("/slow", async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    status: "ok",
    service: "demo-service",
    simulatedLatencyMs: 1000,
  };
});
const port = Number(process.env.PORT ?? 3000);

try {
  await app.listen({
    host: "0.0.0.0",
    port,
  });

  console.log(`Demo service running on http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
