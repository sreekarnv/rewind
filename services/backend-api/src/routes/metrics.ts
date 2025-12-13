import { Elysia } from "elysia";

interface PrometheusMetric {
  name: string;
  type: string;
  help: string;
  values: Array<{
    labels: Record<string, string>;
    value: number;
  }>;
}

interface ParsedMetrics {
  [key: string]: PrometheusMetric;
}

/**
 * Parse Prometheus text format to JSON
 */
function parsePrometheusMetrics(text: string): ParsedMetrics {
  const lines = text.split("\n");
  const metrics: ParsedMetrics = {};
  let currentMetric: string | null = null;
  let currentType: string | null = null;
  let currentHelp: string | null = null;

  for (const line of lines) {
    if (
      !line.trim() ||
      (line.startsWith("#") && !line.includes("HELP") && !line.includes("TYPE"))
    ) {
      continue;
    }

    if (line.startsWith("# HELP")) {
      const match = line.match(/# HELP (\S+) (.+)/);
      if (match) {
        currentMetric = match[1];
        currentHelp = match[2];
      }
      continue;
    }

    if (line.startsWith("# TYPE")) {
      const match = line.match(/# TYPE (\S+) (\S+)/);
      if (match) {
        currentMetric = match[1];
        currentType = match[2];

        if (currentMetric && !metrics[currentMetric]) {
          metrics[currentMetric] = {
            name: currentMetric,
            type: currentType || "unknown",
            help: currentHelp || "",
            values: [],
          };
        }
      }
      continue;
    }

    const metricMatch = line.match(/^(\S+?)(?:\{([^}]+)\})?\s+(\S+)/);
    if (metricMatch) {
      const [, metricName, labelsStr, valueStr] = metricMatch;
      const value = parseFloat(valueStr);

      const labels: Record<string, string> = {};
      if (labelsStr) {
        const labelPairs = labelsStr.match(/(\w+)="([^"]+)"/g);
        if (labelPairs) {
          for (const pair of labelPairs) {
            const [key, val] = pair.split("=");
            labels[key] = val.replace(/"/g, "");
          }
        }
      }

      if (!metrics[metricName]) {
        metrics[metricName] = {
          name: metricName,
          type: "unknown",
          help: "",
          values: [],
        };
      }

      metrics[metricName].values.push({ labels, value });
    }
  }

  return metrics;
}

/**
 * Extract specific Rewind metrics for the dashboard
 */
function extractRewindMetrics(metrics: ParsedMetrics) {
  const packetsProcessed =
    metrics["rewind_packets_total"]?.values.find(
      (v) => v.labels.type === "processed",
    )?.value || 0;

  const httpRequests =
    metrics["rewind_http_messages_total"]?.values.find(
      (v) => v.labels.type === "requests",
    )?.value || 0;

  const httpResponses =
    metrics["rewind_http_messages_total"]?.values.find(
      (v) => v.labels.type === "responses",
    )?.value || 0;

  const activeSessions =
    metrics["rewind_active_sessions"]?.values.find(
      (v) => v.labels.state === "active",
    )?.value || 0;

  const sessionsCreated =
    metrics["rewind_sessions_total"]?.values.find(
      (v) => v.labels.action === "created",
    )?.value || 0;

  const sessionsClosed =
    metrics["rewind_sessions_total"]?.values.find(
      (v) => v.labels.action === "closed",
    )?.value || 0;

  const errors =
    metrics["rewind_errors_total"]?.values.find(
      (v) => v.labels.type === "general",
    )?.value || 0;

  const droppedPackets =
    metrics["rewind_errors_total"]?.values.find(
      (v) => v.labels.type === "dropped_packets",
    )?.value || 0;

  return {
    packets: {
      processed: packetsProcessed,
    },
    http: {
      requests: httpRequests,
      responses: httpResponses,
      total: httpRequests + httpResponses,
    },
    sessions: {
      active: activeSessions,
      created: sessionsCreated,
      closed: sessionsClosed,
    },
    errors: {
      total: errors,
      droppedPackets: droppedPackets,
    },
    timestamp: Date.now(),
  };
}

export const metricsRoutes = new Elysia({ prefix: "/api/v1/metrics" })
  /**
   * Get raw Prometheus metrics (text format)
   */
  .get("/raw", async () => {
    try {
      const response = await fetch("http://localhost:9090/metrics");
      const text = await response.text();
      return new Response(text, {
        headers: { "Content-Type": "text/plain" },
      });
    } catch (error) {
      console.log("Failed to fetch Prometheus metrics:", error);
      return new Response("Metrics service unavailable", { status: 503 });
    }
  })

  /**
   * Get parsed Prometheus metrics (JSON format)
   */
  .get("/parsed", async () => {
    try {
      const response = await fetch("http://localhost:9090/metrics");
      const text = await response.text();
      const parsed = parsePrometheusMetrics(text);
      return parsed;
    } catch (error) {
      console.log("Failed to fetch Prometheus metrics:", error);
      return { error: "Metrics service unavailable" };
    }
  })

  /**
   * Get Rewind-specific metrics in a dashboard-friendly format
   */
  .get("/dashboard", async () => {
    try {
      const response = await fetch("http://localhost:9090/metrics");
      const text = await response.text();
      const parsed = parsePrometheusMetrics(text);
      const rewindMetrics = extractRewindMetrics(parsed);
      return rewindMetrics;
    } catch (error) {
      console.log("Failed to fetch Prometheus metrics:", error);
      return {
        packets: { processed: 0 },
        http: { requests: 0, responses: 0, total: 0 },
        sessions: { active: 0, created: 0, closed: 0 },
        errors: { total: 0, droppedPackets: 0 },
        timestamp: Date.now(),
        error: "Metrics service unavailable",
      };
    }
  });
