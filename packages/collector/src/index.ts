export interface LatencyEvent {
  service: string;
  operation: string;
  durationMs: number;
  timestamp: string;
  traceId?: string;
  success: boolean;
}

const events: LatencyEvent[] = [];

export function collectLatencyEvent(event: LatencyEvent): void {
  events.push(event);
}

export function getLatencyEvents(): readonly LatencyEvent[] {
  return events;
}

export function clearLatencyEvents(): void {
  events.length = 0;
}
