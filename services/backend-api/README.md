# Rewind Backend API

REST API for viewing captured HTTP sessions from the Rewind capture agent.

## Tech Stack

- **Runtime:** Bun
- **Framework:** Elysia
- **Language:** TypeScript
- **Storage:** File-based (reads JSON from capture agent)

## Prerequisites

- [Bun](https://bun.sh) installed (v1.0+)

## Installation

```bash
cd services/backend-api
bun install
```

## Configuration

Environment variables:

```bash
# Port (default: 8000)
PORT=8000

# Data directory (default: ../capture-agent/output)
DATA_DIR=../capture-agent/output
```

## Usage

### Development

```bash
bun run dev
```

### Production

```bash
bun run start
```

### Build

```bash
bun run build
```

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-12T10:30:00.000Z",
  "service": "rewind-backend-api"
}
```

### List Sessions

```http
GET /api/v1/sessions
```

**Response:**
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
      "transaction_count": 47
    }
  ],
  "total": 1
}
```

### Get Session Details

```http
GET /api/v1/sessions/:id
```

**Response:**
```json
{
  "session": {
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
            "Host": "api.example.com"
          },
          "body": "",
          "length": 0
        },
        "response": {
          "status_code": 200,
          "status_message": "OK",
          "version": "HTTP/1.1",
          "headers": {
            "Content-Type": "application/json"
          },
          "body": "{\"users\": [...]}",
          "length": 1234
        },
        "request_time": 1702345678.123,
        "response_time": 1702345678.248,
        "duration": 0.125
      }
    ]
  }
}
```

### Get Session Requests

```http
GET /api/v1/sessions/:id/requests
```

**Response:**
```json
{
  "session_id": "192.168.1.100:54321_192.168.1.1:80",
  "transactions": [...],
  "total": 47
}
```

### Get Statistics

```http
GET /api/v1/stats
```

**Response:**
```json
{
  "total_sessions": 12,
  "total_requests": 156,
  "method_distribution": {
    "GET": 89,
    "POST": 45,
    "PUT": 12,
    "DELETE": 10
  },
  "status_distribution": {
    "200": 120,
    "201": 25,
    "404": 8,
    "500": 3
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Not Found",
  "message": "Session with ID 'xyz' not found",
  "statusCode": 404
}
```
## Development

### Testing with curl

```bash
# Health check
curl http://localhost:8000/health

# List sessions
curl http://localhost:8000/api/v1/sessions

# Get session details
curl http://localhost:8000/api/v1/sessions/192.168.1.100:54321_192.168.1.1:80

# Get statistics
curl http://localhost:8000/api/v1/stats
```

### Testing with sample data

1. Run the capture agent to generate JSON files
2. Ensure JSON files are in `../capture-agent/output/`
3. Start the backend API: `bun run dev`
4. Test endpoints with curl or browser

## Notes

- This is a **read-only API** - no write operations
- Data is loaded from JSON files on each request
- CORS is enabled for all origins (suitable for development)
- For production, configure CORS to specific origins

## Future Enhancements

- [ ] Pagination for large result sets
- [ ] Filtering and search capabilities
- [ ] Caching layer (Redis)
- [ ] WebSocket support for real-time updates
- [ ] Authentication/Authorization

## License

MIT
