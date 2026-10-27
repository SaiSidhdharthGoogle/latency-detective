import Fastify from "fastify";
import { analyzeLatency, detectBottlenecks } from "@latency-detective/analyzer";

const app = Fastify({
  logger: true,
});

app.get("/health", async () => {
  return {
    status: "ok",
    service: "latency-detective-api",
  };
});

app.get("/analytics", async () => {
  const statistics = await analyzeLatency();
  const bottlenecks = await detectBottlenecks();

  return {
    statistics,
    bottlenecks,
  };
});

const port = Number(process.env.API_PORT ?? 4000);

try {
  await app.listen({
    host: "0.0.0.0",
    port,
  });

  console.log(`Analytics API running on http://localhost:${port}`);
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
