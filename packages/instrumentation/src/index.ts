import { trace, SpanStatusCode } from "@opentelemetry/api";
import type { LatencyEvent } from "@latency-detective/collector";

export type LatencyEventHandler = (event: LatencyEvent) => void;

let eventHandler: LatencyEventHandler | undefined;

export function setLatencyEventHandler(
  handler: LatencyEventHandler | undefined,
): void {
  eventHandler = handler;
}

export async function measureLatency<T>(
  operation: string,
  fn: () => Promise<T>,
  service = "unknown-service",
): Promise<T> {
  const tracer = trace.getTracer("latency-detective");

  return tracer.startActiveSpan(operation, async (span) => {
    const start = performance.now();
    let success = false;

    try {
      const result = await fn();

      success = true;

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

      const event: LatencyEvent = {
        service,
        operation,
        durationMs,
        timestamp: new Date().toISOString(),
        success,
      };

      eventHandler?.(event);

      span.end();
    }
  });
}
