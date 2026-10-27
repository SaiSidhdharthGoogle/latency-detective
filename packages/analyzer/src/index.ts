import {
  getLatencyDurations,
  getLatencyOperationSummaries,
} from "@latency-detective/storage";

export interface LatencyStatistics {
  count: number;
  minMs: number;
  maxMs: number;
  averageMs: number;
  p50Ms: number;
  p75Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = (percentileValue / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sortedValues[lower];
  }

  const weight = index - lower;

  return (
    sortedValues[lower] +
    (sortedValues[upper] - sortedValues[lower]) * weight
  );
}

export function calculateLatencyStatistics(
  durationsMs: readonly number[],
): LatencyStatistics {
  if (durationsMs.length === 0) {
    return {
      count: 0,
      minMs: 0,
      maxMs: 0,
      averageMs: 0,
      p50Ms: 0,
      p75Ms: 0,
      p90Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
    };
  }

  const sorted = [...durationsMs].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);

  const round = (value: number): number =>
    Math.round(value * 100) / 100;

  return {
    count: sorted.length,
    minMs: round(sorted[0]),
    maxMs: round(sorted[sorted.length - 1]),
    averageMs: round(total / sorted.length),
    p50Ms: round(percentile(sorted, 50)),
    p75Ms: round(percentile(sorted, 75)),
    p90Ms: round(percentile(sorted, 90)),
    p95Ms: round(percentile(sorted, 95)),
    p99Ms: round(percentile(sorted, 99)),
  };
}


export async function analyzeLatency(
  service?: string,
  operation?: string,
): Promise<LatencyStatistics> {
  const durations = await getLatencyDurations(service, operation);

  return calculateLatencyStatistics(durations);
}

export interface Bottleneck {
  service: string;
  operation: string;
  averageMs: number;
  p95Ms: number;
  count: number;
}

export async function detectBottlenecks(): Promise<Bottleneck[]> {
  const events = await getLatencyOperationSummaries();

  const groups = new Map<string, {
    service: string;
    operation: string;
    durations: number[];
  }>();

  for (const event of events) {
    const key = `${event.service}:${event.operation}`;
    const group = groups.get(key);

    if (group) {
      group.durations.push(event.durationMs);
    } else {
      groups.set(key, {
        service: event.service,
        operation: event.operation,
        durations: [event.durationMs],
      });
    }
  }

  const bottlenecks: Bottleneck[] = [];

  for (const group of groups.values()) {
    const statistics = calculateLatencyStatistics(group.durations);

    bottlenecks.push({
      service: group.service,
      operation: group.operation,
      averageMs: statistics.averageMs,
      p95Ms: statistics.p95Ms,
      count: statistics.count,
    });
  }

  return bottlenecks.sort((a, b) => b.p95Ms - a.p95Ms);
}
