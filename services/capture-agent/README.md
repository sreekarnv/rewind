# Rewind Capture Agent

A high-performance network packet capture agent written in C++20 that captures, parses, and exports HTTP traffic with advanced features like PII sanitization and Prometheus metrics.

## Features

**Network Packet Capture**
- Multi-interface support
- TCP stream reassembly
- HTTP request/response parsing
- Session tracking and correlation

**Configuration Management**
- YAML-based configuration
- CLI argument support
- Flexible filtering (BPF filters, port filtering)
- Configurable capture limits and timeouts

**PII Sanitization**
- Email address sanitization
- API key and JWT token masking
- International phone number sanitization (E.164 and common formats)
- Sensitive HTTP header sanitization (Authorization, Cookie, etc.)
- JSON body field sanitization (passwords, tokens, secrets)

**Observability**
- Prometheus metrics exporter
- Structured logging with spdlog
- Performance metrics (latency, throughput)
- Error tracking

**Data Export**
- JSON export format
- Configurable output directory
- Session-based organization

## Prerequisites

- **Windows**: Npcap SDK (https://npcap.com/)
- **CMake**: 3.20 or higher
- **C++ Compiler**: C++20 support required
- **Git**: For dependency management
- **PcapPlusPlus**: Automatically fetched via CMake FetchContent


## Why PcapPlusPlus?

PcapPlusPlus provides a high-level, zero-copy abstraction over libpcap/Npcap,
allowing safe and efficient packet parsing while avoiding manual buffer management.
This significantly reduces complexity compared to raw libpcap usage.


## Build Instructions

### Windows

1. **Install Npcap**

2. **Clone and Build**
   ```bash
   cd services/capture-agent
   ./build.bat
   ```

3. **Run**
   ```bash
   cd Release
   ./capture-agent --config ../../config/config.yaml
   ```

## Configuration

Create a `config.yaml` file (see `config/config.yaml.example`):

```yaml
capture:
  interface_index: 0        # Network interface
  packet_limit: 100         # Max packets (0 = unlimited)
  timeout_seconds: 60       # Capture timeout
  output_file: "captured_sessions.json"
  output_directory: "./output"

filters:
  ports: [80, 8080, 3000]   # Ports to capture
  capture_body: true
  max_body_size: 1048576    # 1MB
  # bpf_filter: "tcp and host 192.168.1.1"

logging:
  level: "info"             # debug, info, warn, error
  # file: "capture.log"

metrics:
  enabled: true
  port: 9090
  endpoint: "/metrics"

sanitization:
  enabled: false
  sanitize_headers: true
  sanitize_body: true
  headers_to_sanitize:
    - "Authorization"
    - "Cookie"
    - "Set-Cookie"
```

## Usage

### Basic Usage

```bash
# Use default config
./capture-agent

# Specify custom config
./capture-agent --config /path/to/config.yaml

# Show help
./capture-agent --help
```

### Viewing Metrics

When metrics are enabled, visit:
```
http://localhost:9090/metrics
```

Example metrics:
```
# HELP rewind_packets_total Total number of packets processed
# TYPE rewind_packets_total counter
rewind_packets_total{type="processed"} 1523

# HELP rewind_http_messages_total Total number of HTTP messages
# TYPE rewind_http_messages_total counter
rewind_http_messages_total{type="requests"} 47
rewind_http_messages_total{type="responses"} 47

# HELP rewind_sessions_total Total number of sessions
# TYPE rewind_sessions_total counter
rewind_sessions_total{action="created"} 12
rewind_sessions_total{action="closed"} 12

# HELP rewind_active_sessions Number of currently active sessions
# TYPE rewind_active_sessions gauge
rewind_active_sessions{state="active"} 0
```

## Output Format

Captured sessions are exported as JSON:

```json
{
  "sessions": [
    {
      "session_id": "192.168.1.100:54321_192.168.1.1:80",
      "client_ip": "192.168.1.100",
      "client_port": 54321,
      "server_ip": "192.168.1.1",
      "server_port": 80,
      "start_time": 1702345678.123,
      "end_time": 1702345698.456,
      "duration": 20.333,
      "transactions": [
        {
          "request": {
            "method": "GET",
            "uri": "/api/users",
            "version": "HTTP/1.1",
            "headers": {
              "Host": "api.example.com",
              "User-Agent": "Mozilla/5.0"
            },
            "body": ""
          },
          "response": {
            "status_code": 200,
            "status_message": "OK",
            "version": "HTTP/1.1",
            "headers": {
              "Content-Type": "application/json"
            },
            "body": "{\"users\": [...]}"
          },
          "request_time": 1702345678.123,
          "response_time": 1702345678.248,
          "duration": 0.125
        }
      ]
    }
  ]
}
```
## Dependencies

All dependencies are automatically fetched via CMake FetchContent:

- **PcapPlusPlus** (v24.09) - Packet capture and processing
- **spdlog** (v1.14.1) - Structured logging
- **nlohmann/json** (v3.11.3) - JSON serialization
- **yaml-cpp** (v0.8.0) - YAML configuration parsing
- **prometheus-cpp** (v1.2.4) - Metrics exporter

## Acknowledgments

- PcapPlusPlus team for the excellent packet capture library
- spdlog for fast logging
- Prometheus team for metrics standards
