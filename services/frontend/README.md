# Rewind Frontend

Modern web interface for viewing and analyzing captured HTTP traffic from the Rewind capture agent.

## Tech Stack

- **Framework:** SvelteKit
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Syntax Highlighting:** highlight.js
- **Build Tool:** Vite
- **Runtime:** Node.js / Bun

## Features

- ✅ Session list with summary cards
- ✅ Detailed session view with transaction timeline
- ✅ HTTP request/response viewer with syntax highlighting
- ✅ Statistics dashboard with method and status code distributions
- ✅ Responsive design (mobile-friendly)
- ✅ Real-time API integration
- ✅ Type-safe API client
- ✅ Clean, modern UI with Tailwind CSS

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

## Project Structure

```
services/frontend/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   └── HttpViewer.svelte    # Request/response viewer
│   │   ├── api.ts                   # API client
│   │   ├── types.ts                 # TypeScript types
│   │   └── utils.ts                 # Utility functions
│   ├── routes/
│   │   ├── +layout.svelte           # Root layout
│   │   ├── +page.svelte             # Sessions list
│   │   ├── sessions/[id]/
│   │   │   ├── +page.svelte         # Session detail
│   │   │   └── +page.ts             # Session data loader
│   │   └── stats/
│   │       ├── +page.svelte         # Statistics dashboard
│   │       └── +page.ts             # Stats data loader
│   ├── app.html                     # HTML template
│   └── app.css                      # Global styles
├── static/                          # Static assets
├── svelte.config.js                 # SvelteKit config
├── vite.config.ts                   # Vite config
├── tailwind.config.js               # Tailwind config
├── tsconfig.json                    # TypeScript config
└── package.json
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

## Components

### HttpViewer

Displays HTTP request and response details:

- **Headers:** Formatted HTTP headers with syntax highlighting
- **Body:** Auto-formatted JSON bodies with syntax highlighting
- **Tabs:** Switch between request and response
- **Empty State:** Shows message when no body is present

## API Integration

The frontend communicates with the backend API via the `api` client:

```typescript
import { api } from '$lib/api';

// Get all sessions
const sessions = await api.getSessions();

// Get session by ID
const session = await api.getSessionById(id);

// Get session requests
const requests = await api.getSessionRequests(id);

// Get statistics
const stats = await api.getStats();

// Health check
const health = await api.checkHealth();
```

## Utilities

### Formatting Functions

- `formatTimestamp(timestamp)` - Unix timestamp to readable date
- `formatDuration(seconds)` - Seconds to human-readable duration
- `formatBytes(bytes)` - Bytes to KB/MB/GB
- `tryFormatJson(text)` - Pretty-print JSON
- `isJson(text)` - Check if text is valid JSON

### Badge Utilities

- `getStatusBadgeClass(statusCode)` - Color class for HTTP status
- `getMethodBadgeClass(method)` - Color class for HTTP method

## Styling

### Tailwind CSS

The project uses Tailwind CSS with custom configuration:

- **Primary Color:** Blue (customizable in `tailwind.config.js`)
- **Custom Components:** `.card`, `.badge`, `.btn`
- **Responsive Design:** Mobile-first approach

### Component Classes

```css
.card - White card with shadow and hover effect
.badge - Small colored pill badge
.badge-success - Green (2xx status)
.badge-error - Red (5xx status)
.badge-warning - Yellow (4xx status)
.badge-info - Blue (3xx status, GET)
.btn - Base button style
.btn-primary - Primary action button
.btn-secondary - Secondary action button
```

## Development Tips

### Hot Module Replacement

SvelteKit supports HMR out of the box. Changes to `.svelte` files will update instantly.

### Type Safety

All API responses are typed. TypeScript will catch type errors at compile time:

```typescript
import type { Session, HttpTransaction } from '$lib/types';
```

### Proxy Configuration

The Vite config includes a proxy for `/api` requests to avoid CORS issues during development:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true
  }
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- **Initial Load:** < 100KB (gzipped)
- **Lazy Loading:** Route-based code splitting
- **Caching:** API responses can be cached
- **Rendering:** Client-side rendering (CSR)

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

### Syntax Highlighting Not Working

- Check that highlight.js is installed: `npm list highlight.js`
- Ensure CSS is imported in `HttpViewer.svelte`

### Build Errors

```bash
# Clear build cache
rm -rf .svelte-kit
npm run check
npm run build
```

## License

MIT
