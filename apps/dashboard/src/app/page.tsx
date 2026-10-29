"use client";

import { useEffect, useState } from "react";
import {
  Bar,
Line,
  BarChart,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Statistics {
  count: number;
  averageMs: number;
  p50Ms: number;
  p75Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
}

interface Bottleneck {
  service: string;
  operation: string;
  averageMs: number;
  p95Ms: number;
  count: number;
}
interface HistoryPoint {
  timestamp: string;
  count: number;
  averageMs: number;
  p95Ms: number;
}

interface AnalyticsResponse {
  statistics: Statistics;
  bottlenecks: Bottleneck[];
  history: HistoryPoint[];

}

function formatMs(value: number): string {
  return `${value.toFixed(1)} ms`;
}

export default function Home() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const response = await fetch("http://localhost:4000/analytics");
const historyResponse = await fetch("http://localhost:4000/history");
if (!historyResponse.ok) {
  throw new Error(`History API returned ${historyResponse.status}`);
}

        if (!response.ok) {
          throw new Error(`Analytics API returned ${response.status}`);
        }

        const data: AnalyticsResponse = await response.json();
const historyData: { history: HistoryPoint[] } = await historyResponse.json();

setHistory(historyData.history);
        setAnalytics(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      }
    }

    loadAnalytics();

    const interval = setInterval(loadAnalytics, 5000);

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <main className="dashboard">
        <header className="header">
          <div>
            <p className="eyebrow">Developer Observability</p>
            <h1>Latency Detective</h1>
            <p className="subtitle">
              Identify slow operations before they become production incidents.
            </p>
          </div>

          <div className="status">
            <span className="status-dot" />
            API unavailable
          </div>
        </header>

        <section className="panel">
          <h2>Unable to load analytics</h2>
          <p>{error}</p>
        </section>
      </main>
    );
  }

  if (!analytics) {
    return (
      <main className="dashboard">
        <header className="header">
          <div>
            <p className="eyebrow">Developer Observability</p>
            <h1>Latency Detective</h1>
            <p className="subtitle">
              Identify slow operations before they become production incidents.
            </p>
          </div>

          <div className="status">
            <span className="status-dot" />
            Loading analytics
          </div>
        </header>

        <section className="panel">
          <h2>Loading telemetry...</h2>
          <p>Fetching the latest latency measurements.</p>
        </section>
      </main>
    );
  }

  const { statistics, bottlenecks } = analytics;
  const topBottleneck = bottlenecks[0];

  const chartData = [
    { name: "P50", latency: statistics.p50Ms },
    { name: "P75", latency: statistics.p75Ms },
    { name: "P90", latency: statistics.p90Ms },
    { name: "P95", latency: statistics.p95Ms },
    { name: "P99", latency: statistics.p99Ms },
  ];

  return (
    <main className="dashboard">
      <header className="header">
        <div>
          <p className="eyebrow">Developer Observability</p>
          <h1>Latency Detective</h1>
          <p className="subtitle">
            Identify slow operations before they become production incidents.
          </p>
        </div>

        <div className="status">
          <span className="status-dot" />
          System operational
        </div>
      </header>

      <section className="metrics">
        <article className="metric-card">
          <span>Total Events</span>
          <strong>{statistics.count}</strong>
        </article>

        <article className="metric-card">
          <span>Average Latency</span>
          <strong>{formatMs(statistics.averageMs)}</strong>
        </article>

        <article className="metric-card">
          <span>P95 Latency</span>
          <strong>{formatMs(statistics.p95Ms)}</strong>
        </article>

        <article className="metric-card">
          <span>P99 Latency</span>
          <strong>{formatMs(statistics.p99Ms)}</strong>
        </article>
      </section>

      <section className="grid">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h2>Latency Percentiles</h2>
              <p>Observed latency distribution across recorded events.</p>
            </div>
          </div>

          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="latency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel bottleneck-panel">
          <div className="panel-header">
            <div>
              <h2>Top Bottleneck</h2>
              <p>Operation with the highest P95 latency.</p>
            </div>
          </div>

          {topBottleneck ? (
            <div className="bottleneck">
              <span className="service">{topBottleneck.service}</span>
              <h3>{topBottleneck.operation}</h3>

              <div className="bottleneck-stats">
                <div>
                  <span>Average</span>
                  <strong>{formatMs(topBottleneck.averageMs)}</strong>
                </div>

                <div>
                  <span>P95</span>
                  <strong>{formatMs(topBottleneck.p95Ms)}</strong>
                </div>

                <div>
                  <span>Events</span>
                  <strong>{topBottleneck.count}</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="bottleneck">
              <p>No bottleneck data available yet.</p>
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Bottleneck Operations</h2>
            <p>Ranked by P95 latency.</p>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Operation</th>
                <th>Average</th>
                <th>P95</th>
                <th>Events</th>
              </tr>
            </thead>

            <tbody>
              {bottlenecks.map((bottleneck) => (
                <tr key={`${bottleneck.service}:${bottleneck.operation}`}>
                  <td>{bottleneck.service}</td>
                  <td>{bottleneck.operation}</td>
                  <td>{formatMs(bottleneck.averageMs)}</td>
                  <td>{formatMs(bottleneck.p95Ms)}</td>
                  <td>{bottleneck.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Historical Latency</h2>
            <p>Average and P95 latency over time.</p>
          </div>
        </div>

        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString()
                }
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) =>
                  new Date(String(value)).toLocaleString()
                }
              />
              <Line
                type="monotone"
                dataKey="averageMs"
                name="Average"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p95Ms"
                name="P95"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

