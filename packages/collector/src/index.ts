import {
  getLatencyEvents as getStoredLatencyEvents,
  saveLatencyEvent,
} from "@latency-detective/storage";

export interface LatencyEvent {
  service: string;
  operation: string;
  durationMs: number;
  timestamp: string;
  traceId?: string;
  success: boolean;
}

export async function collectLatencyEvent(
  event: LatencyEvent,
): Promise<void> {
  await saveLatencyEvent(event);
}

export async function getLatencyEvents(): Promise<LatencyEvent[]> {
  return getStoredLatencyEvents();
}
