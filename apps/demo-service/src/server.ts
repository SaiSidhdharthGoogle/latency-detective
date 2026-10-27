import Fastify from "fastify";
import {
  measureLatency,
  setLatencyEventHandler,
} from "@latency-detective/instrumentation";
import {
  collectLatencyEvent,
  getLatencyEvents,
} from "@latency-detective/collector";

const app = Fastify({
  logger: true,
});

setLatencyEventHandler(collectLatencyEvent);

app.get("/health", async () => {
  return {
    status: "ok",
    service: "demo-service",
  };
});

app.get("/slow", async () => {
  return measureLatency(
    "demo.slow-operation",
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        status: "ok",
        service: "demo-service",
        simulatedLatencyMs: 1000,
      };
    },
    "demo-service",
  );
});

app.get("/latency-events", async () => {
  const events = await getLatencyEvents();

  return {
    count: events.length,
    events,
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
