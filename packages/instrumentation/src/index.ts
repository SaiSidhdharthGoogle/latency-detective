import { trace, SpanStatusCode } from "@opentelemetry/api";

export async function measureLatency<T>(
  operation: string,
  fn: () => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer("latency-detective");

  return tracer.startActiveSpan(operation, async (span) => {
    const start = performance.now();

    try {
      const result = await fn();

      span.setStatus({
        code: SpanStatusCode.OK,
      });

      return result;
    } catch (error) {
      span.recordException(error as Error);

      span.setStatus({
        code: SpanStatusCode.ERROR,
      });

      throw error;
    } finally {
      const durationMs = performance.now() - start;

      span.setAttribute("latency.duration_ms", durationMs);
      span.setAttribute("latency.operation", operation);
      span.end();
    }
  });
}
