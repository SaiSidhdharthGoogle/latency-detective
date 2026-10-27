import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 5433),
  database: process.env.DATABASE_NAME ?? "latency_detective",
  user: process.env.DATABASE_USER ?? "latency",
  password: process.env.DATABASE_PASSWORD ?? "latency_dev_password",
});

export interface LatencyEventRecord {
  service: string;
  operation: string;
  durationMs: number;
  timestamp: string;
  traceId?: string;
  success: boolean;
}

export async function saveLatencyEvent(
  event: LatencyEventRecord,
): Promise<void> {
  await pool.query(
    `
      INSERT INTO latency_events (
        service,
        operation,
        duration_ms,
        timestamp,
        trace_id,
        success
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [
      event.service,
      event.operation,
      event.durationMs,
      event.timestamp,
      event.traceId ?? null,
      event.success,
    ],
  );
}

export async function getLatencyEvents(): Promise<LatencyEventRecord[]> {
  const result = await pool.query<{
    service: string;
    operation: string;
    duration_ms: number;
    timestamp: Date;
    trace_id: string | null;
    success: boolean;
  }>(
    `
      SELECT
        service,
        operation,
        duration_ms,
        timestamp,
        trace_id,
        success
      FROM latency_events
      ORDER BY timestamp ASC
    `,
  );

  return result.rows.map((row) => ({
    service: row.service,
    operation: row.operation,
    durationMs: row.duration_ms,
    timestamp: row.timestamp.toISOString(),
    traceId: row.trace_id ?? undefined,
    success: row.success,
  }));
}


export async function getLatencyDurations(
  service?: string,
  operation?: string,
): Promise<number[]> {
  const result = await pool.query<{ duration_ms: number }>(
    `
      SELECT duration_ms
      FROM latency_events
      WHERE ($1::text IS NULL OR service = $1)
        AND ($2::text IS NULL OR operation = $2)
      ORDER BY timestamp ASC
    `,
    [service ?? null, operation ?? null],
  );

  return result.rows.map((row) => row.duration_ms);
}


export interface LatencyOperationSummary {
  service: string;
  operation: string;
  durationMs: number;
}

export async function getLatencyOperationSummaries(): Promise<
  LatencyOperationSummary[]
> {
  const result = await pool.query<{
    service: string;
    operation: string;
    duration_ms: number;
  }>(
    `
      SELECT
        service,
        operation,
        duration_ms
      FROM latency_events
      ORDER BY timestamp ASC
    `,
  );

  return result.rows.map((row) => ({
    service: row.service,
    operation: row.operation,
    durationMs: row.duration_ms,
  }));
}

export async function closeStorage(): Promise<void> {
  await pool.end();
}
