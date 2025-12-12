# Rewind Frontend

Modern web interface for viewing and analyzing captured HTTP traffic from the Rewind capture agent.

## Tech Stack

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Syntax Highlighting:** highlight.js
- **Build Tool:** Vite
- **Runtime:** Node.js / Bun

## Prerequisites

- [Node.js](https://nodejs.org) (v18+) or [Bun](https://bun.sh) (v1.0+)
- Backend API running on port 8000

## Installation

```bash
cd services/frontend
npm install
# or
bun install
```

## Configuration

Environment variables (optional):

```bash
# Backend API URL (default: http://localhost:8000)
PUBLIC_API_URL=http://localhost:8000
```

## Usage

### Development

```bash
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:5173`

### Production Build

```bash
npm run build
npm run preview
# or
bun run build
bun run preview
```

### Type Checking

```bash
npm run check
# or
bun run check
```

## Pages

### Sessions List (`/`)

- Displays all captured HTTP sessions
- Shows session metadata (client/server IPs, ports, duration)
- Links to detailed session view
- Empty state when no sessions available
- Error handling for API failures

### Session Detail (`/sessions/:id`)

- Full session information
- List of all transactions in the session
- Transaction timeline
- Click to view individual request/response pairs
- Formatted headers and bodies
- JSON syntax highlighting

### Statistics (`/stats`)

- Total sessions and requests count
- HTTP method distribution (GET, POST, etc.)
- Status code distribution (2xx, 4xx, 5xx)
- Visual bar charts
- Detailed breakdown tables

## Future Enhancements

- [ ] Dark mode support
- [ ] Export sessions to HAR format
- [ ] Request filtering and search
- [ ] Real-time updates via WebSocket
- [ ] Performance metrics visualization
- [ ] Authentication/Authorization
- [ ] Session comparison view
- [ ] Advanced filtering (by status, method, URL pattern)

## Troubleshooting

### API Connection Failed

- Ensure backend API is running on port 8000
- Check `PUBLIC_API_URL` environment variable
- Verify CORS is enabled on backend


### Build Errors

```bash
# Clear build cache
rm -rf .svelte-kit
npm run check
npm run build
```
