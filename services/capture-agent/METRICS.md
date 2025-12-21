# Prometheus Metrics Guide

## Overview

The Rewind capture agent now exposes Prometheus metrics at `http://localhost:9090/metrics` when running.

## Configuration

Metrics are configured in `config/config.yaml`:

```yaml
metrics:
  enabled: true        # Enable/disable metrics
  port: 9090          # Metrics server port
  endpoint: "/metrics" # Metrics endpoint path
```

## Available Metrics

### Counters (always increasing)

- `rewind_packets_total{type="processed"}` - Total packets processed
- `rewind_http_messages_total{type="all"}` - Total HTTP messages (requests + responses)
- `rewind_http_messages_total{type="requests"}` - Total HTTP requests
- `rewind_http_messages_total{type="responses"}` - Total HTTP responses
- `rewind_sessions_total{action="created"}` - Total sessions created
- `rewind_sessions_total{action="closed"}` - Total sessions closed
- `rewind_errors_total{type="general"}` - Total errors
- `rewind_errors_total{type="dropped_packets"}` - Total dropped packets

### Gauges (current value)

- `rewind_active_sessions{state="active"}` - Currently active sessions

### Histograms (distribution of durations)

- `rewind_operation_duration_seconds{operation="capture"}` - Capture operation latency
  - Buckets: 0.001s, 0.01s, 0.1s, 1.0s, 10.0s
- `rewind_operation_duration_seconds{operation="session"}` - Session durations
  - Buckets: 0.1s, 1.0s, 10.0s, 60.0s, 300.0s

## Usage

### 1. Run the Capture Agent

```bash
cd C:\Users\sreek\Desktop\rewind\services\capture-agent
.\build\Release\capture-agent.exe
```

When metrics are enabled, you'll see:
```
Metrics server started on port 9090
```

### 2. Access Metrics

While the capture agent is running, open a browser or use curl:

```bash
curl http://localhost:9090/metrics
```

Example output:
```
# HELP rewind_packets_total Total number of packets processed
# TYPE rewind_packets_total counter
rewind_packets_total{type="processed"} 150

# HELP rewind_http_messages_total Total number of HTTP messages
# TYPE rewind_http_messages_total counter
rewind_http_messages_total{type="all"} 50
rewind_http_messages_total{type="requests"} 25
rewind_http_messages_total{type="responses"} 25

# HELP rewind_active_sessions Number of currently active sessions
# TYPE rewind_active_sessions gauge
rewind_active_sessions{state="active"} 5
```

### 3. Disable Metrics (Optional)

To disable metrics, edit `config/config.yaml`:

```yaml
metrics:
  enabled: false
```

## Integration with Prometheus

To scrape these metrics with a Prometheus server, add this to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'rewind-capture-agent'
    static_configs:
      - targets: ['localhost:9090']
```

## Troubleshooting

**Port already in use:**
If port 9090 is already in use, change the port in `config/config.yaml`:

```yaml
metrics:
  port: 9091  # Use a different port
```

**Metrics server failed to start:**
Check the logs for error messages. Common issues:
- Port already in use
- Firewall blocking the port
- Missing dependencies

**No metrics showing up:**
- Ensure `metrics.enabled: true` in config
- Verify the capture agent is running
- Check the correct port and endpoint
- Try accessing `http://localhost:9090/metrics` directly
