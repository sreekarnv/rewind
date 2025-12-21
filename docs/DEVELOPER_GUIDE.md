# Rewind Developer Guide

Complete guide for developers working on Rewind, covering architecture, development setup, and contribution workflows.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Adding New Features](#adding-new-features)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Contributing](#contributing)

---

## Architecture Overview

### High-Level Architecture

Rewind uses a three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (SvelteKit)                    │
│  - Real-time Dashboard                                       │
│  - Session Viewer                                            │
│  - Alert Management UI                                       │
│  - WebSocket Client                                          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/WebSocket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Bun + Elysia)                    │
│  - REST API Endpoints                                        │
│  - WebSocket Server (Real-time + Terminal)                  │
│  - Capture Manager (Process Lifecycle)                      │
│  - Alert Service (Rule Evaluation)                          │
│  - Email Notification Service                               │
│  - File Watcher (Session Data)                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴──────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐      ┌──────────────────┐
│  C++ Agent       │      │  MongoDB         │
│  - Packet Capture│      │  - Sessions      │
│  - HTTP Assembly │      │  - Alerts        │
│  - PII Filter    │      │  - Notifications │
│  - JSON Output   │      │                  │
└──────────────────┘      └──────────────────┘
```

### Event-Driven Design

Rewind uses event emitters for loose coupling between services:

**Alert Flow:**
```
Session Saved → AlertService.evaluate()
                     ↓
              Match Found → emit("notification")
                                    ↓
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
          EmailNotificationService    WebSocketBroadcaster
                     ↓                             ↓
              Send Email                    Push to UI
```

**Capture Terminal Flow:**
```
Frontend WebSocket ↔ Backend WebSocket ↔ C++ Agent stdin/stdout
```

### Data Flow

1. **Capture Phase:**
   - C++ agent captures packets → Assembles HTTP → Writes JSON to file
   - Backend file watcher detects new file → Parses JSON → Saves to MongoDB
   - WebSocket broadcasts new session to connected clients

2. **Alert Phase:**
   - AlertService evaluates session against active rules
   - Match found → Creates notification in database
   - Emits "notification" event → Email service + WebSocket broadcast

3. **Replay Phase:**
   - Frontend sends replay request → Backend reconstructs HTTP request
   - Backend sends request to target → Returns response to frontend

---

## Development Setup

### Prerequisites

- **Bun 1.0+** or Node.js 18+ (Bun recommended for performance)
- **MongoDB 7.x** running locally or remotely
- **C++ Build Tools** (for capture agent)
- **Administrator/sudo access** (for packet capture)
- **Git** for version control

### Initial Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/sreekarnv/rewind.git
   cd rewind
   ```

2. **Build Capture Agent**
   ```bash
   cd services/capture-agent
   # Windows
   build.bat
   # Linux/macOS
   make
   ```

3. **Install Backend Dependencies**
   ```bash
   cd services/backend-api
   bun install
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Install Frontend Dependencies**
   ```bash
   cd services/frontend
   bun install
   # or npm install
   ```

5. **Start MongoDB**
   ```bash
   # macOS/Linux
   mongod --dbpath /path/to/data

   # Windows
   mongod --dbpath C:\data\db
   ```

6. **Start Development Servers**

   Terminal 1 - Backend:
   ```bash
   cd services/backend-api
   sudo bun run dev  # sudo required for capture agent
   ```

   Terminal 2 - Frontend:
   ```bash
   cd services/frontend
   npm run dev
   ```

7. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/swagger (if enabled)

### Hot Reload

- **Backend**: Bun's built-in watch mode (`--watch` flag) automatically restarts on file changes
- **Frontend**: Vite's HMR provides instant updates without full page reload
- **Capture Agent**: Must be manually rebuilt and restarted via UI

---

## Project Structure

```
rewind/
├── services/
│   ├── capture-agent/          # C++ packet capture agent
│   │   ├── src/                # C++ source files
│   │   ├── include/            # Header files
│   │   ├── build/              # Build output
│   │   └── output/             # JSON session files
│   │
│   ├── backend-api/            # Bun + Elysia API server
│   │   ├── src/
│   │   │   ├── index.ts        # Entry point
│   │   │   ├── models/         # MongoDB schemas
│   │   │   │   ├── Session.ts
│   │   │   │   ├── Alert.ts
│   │   │   │   └── Notification.ts
│   │   │   ├── routes/         # API route handlers
│   │   │   │   ├── sessions.ts
│   │   │   │   ├── alerts.ts
│   │   │   │   ├── notifications.ts
│   │   │   │   ├── capture.ts
│   │   │   │   └── realtime.ts
│   │   │   └── services/       # Business logic
│   │   │       ├── captureManager.ts      # Process lifecycle
│   │   │       ├── fileWatcher.ts         # Session file monitoring
│   │   │       ├── alertService.ts        # Rule evaluation
│   │   │       └── emailNotificationService.ts
│   │   ├── scripts/            # Utility scripts
│   │   └── package.json
│   │
│   └── frontend/               # SvelteKit web UI
│       ├── src/
│       │   ├── routes/         # SvelteKit file-based routing
│       │   │   ├── (dashboard)/
│       │   │   │   ├── +page.svelte           # Dashboard
│       │   │   │   ├── sessions/
│       │   │   │   │   ├── +page.svelte       # Sessions list
│       │   │   │   │   └── [id]/+page.svelte  # Session detail
│       │   │   │   ├── alerts/+page.svelte
│       │   │   │   ├── notifications/+page.svelte
│       │   │   │   └── capture/+page.svelte
│       │   │   └── +layout.svelte
│       │   └── lib/
│       │       ├── components/ # Reusable components
│       │       ├── stores/     # State management
│       │       ├── api.ts      # API client
│       │       └── types.ts    # TypeScript types
│       └── package.json
│
├── docs/                       # Documentation
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_GUIDE.md (this file)
│   ├── EMAIL_SETUP_GUIDE.md
│   └── screenshots/
│
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

---

## Core Concepts

### 1. Session Data Model

A **Session** represents a single HTTP transaction (request + optional response).

```typescript
interface Session {
  _id: string;                  // MongoDB ObjectId
  sessionId: string;             // Unique identifier from capture agent
  timestamp: Date;               // When request was captured

  // Request data
  method: string;                // HTTP method (GET, POST, etc.)
  uri: string;                   // Request URI
  httpVersion: string;           // HTTP/1.1, HTTP/2, etc.
  headers: Record<string, string>; // Request headers
  body?: string;                 // Request body (if present)

  // Response data (optional - may be pending)
  statusCode?: number;           // HTTP status code
  statusMessage?: string;        // Status text
  responseHeaders?: Record<string, string>;
  responseBody?: string;

  // Network info
  sourceIp: string;              // Client IP
  sourcePort: number;            // Client port
  destIp: string;                // Server IP
  destPort: number;              // Server port

  // Metadata
  isPending: boolean;            // True if no response received
  createdAt: Date;
  updatedAt: Date;
}
```

**Key Points:**
- Sessions can exist without responses (`isPending: true`)
- All field names use camelCase for consistency
- Headers are stored as flat objects (not arrays)
- Large bodies may be truncated by capture agent

### 2. Alert System

The alert system evaluates incoming sessions against user-defined rules.

**Alert Rule Structure:**
```typescript
interface AlertRule {
  _id: string;
  name: string;                  // User-friendly name
  description?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;

  conditions: AlertCondition[];  // ALL must match (AND logic)
  cooldownMinutes: number;       // Min time between triggers
  lastTriggeredAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface AlertCondition {
  type: 'status_code' | 'status_range' | 'response_time' | 'method' | 'url_pattern';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'regex';
  value: string;
}
```

**Evaluation Logic (`alertService.ts`):**
```typescript
async evaluate(session: ISession): Promise<void> {
  const rules = await Alert.find({ enabled: true });

  for (const rule of rules) {
    // Check cooldown
    if (this.isInCooldown(rule)) continue;

    // Evaluate all conditions (AND logic)
    const matches = rule.conditions.every(condition =>
      this.evaluateCondition(session, condition)
    );

    if (matches) {
      await this.triggerAlert(rule, session);
    }
  }
}
```

### 3. Email Notification Service

Event-driven service that listens for alert notifications and sends emails.

**Integration Pattern:**
```typescript
// In index.ts
const emailService = new EmailNotificationService();

alertService.on("notification", async (notification) => {
  // Non-blocking - doesn't slow down alert processing
  await emailService.sendNotificationEmail(notification);
});
```

**Key Features:**
- SMTP configuration from environment variables
- Retry logic with exponential backoff (3 attempts, 2s/4s delays)
- HTML email templates with color-coded severity badges
- Database tracking (emailSent, emailSentAt, emailError)
- Graceful degradation if SMTP not configured

### 4. WebSocket Communication

Two WebSocket endpoints serve different purposes:

**Endpoint 1: `/api/v1/realtime` - Session Updates**
```typescript
// Broadcasts new sessions to all connected clients
sessionWatcher.on('new-session', (session) => {
  ws.send(JSON.stringify({
    type: 'new-session',
    data: session
  }));
});
```

**Endpoint 2: `/api/v1/capture/stream` - Capture Terminal**
```typescript
// Two-way communication with C++ agent
ws.on('message', (msg) => {
  captureManager.sendInput(msg);  // Forward to C++ stdin
});

captureManager.on('output', (data) => {
  ws.send(data);  // Forward C++ stdout to browser
});
```

### 5. Capture Manager

Manages the C++ capture agent process lifecycle.

**Key Responsibilities:**
- Start/stop/restart the capture agent
- Forward stdin/stdout between WebSocket and process
- Monitor process health (PID, uptime, crashes)
- Handle graceful shutdown (SIGTERM with SIGKILL fallback)

```typescript
class CaptureManager extends EventEmitter {
  private process: ChildProcess | null = null;

  async start(): Promise<void> {
    this.process = spawn('./capture-agent/build/capture_agent', [], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    this.process.stdout.on('data', (data) => {
      this.emit('output', data.toString());
    });
  }

  async stop(): Promise<void> {
    if (!this.process) return;

    this.process.kill('SIGTERM');  // Graceful shutdown

    setTimeout(() => {
      if (this.process && !this.process.killed) {
        this.process.kill('SIGKILL');  // Force kill
      }
    }, 5000);
  }
}
```

---

## Adding New Features

### Adding a New API Endpoint

**Example: Add a "Clear All Sessions" endpoint**

1. **Add route handler** in `services/backend-api/src/routes/sessions.ts`:
   ```typescript
   import { Elysia } from 'elysia';
   import { Session } from '../models/Session';

   export const sessionsRouter = new Elysia({ prefix: '/api/v1/sessions' })
     .delete('/clear-all', async () => {
       const result = await Session.deleteMany({});
       return {
         success: true,
         deletedCount: result.deletedCount
       };
     });
   ```

2. **Register route** in `services/backend-api/src/index.ts`:
   ```typescript
   import { sessionsRouter } from './routes/sessions';

   app.use(sessionsRouter);
   ```

3. **Add frontend API call** in `services/frontend/src/lib/api.ts`:
   ```typescript
   export async function clearAllSessions(): Promise<void> {
     const response = await fetch(`${API_BASE_URL}/sessions/clear-all`, {
       method: 'DELETE'
     });

     if (!response.ok) {
       throw new Error('Failed to clear sessions');
     }
   }
   ```

4. **Use in component**:
   ```svelte
   <script lang="ts">
   import { clearAllSessions } from '$lib/api';

   async function handleClearAll() {
     if (confirm('Delete all sessions?')) {
       await clearAllSessions();
       // Refresh list or redirect
     }
   }
   </script>

   <button on:click={handleClearAll}>Clear All</button>
   ```

### Adding a New Alert Condition Type

**Example: Add "request_body_contains" condition**

1. **Update type definition** in `services/backend-api/src/models/Alert.ts`:
   ```typescript
   export type AlertConditionType =
     | 'status_code'
     | 'status_range'
     | 'response_time'
     | 'method'
     | 'url_pattern'
     | 'request_body_contains';  // NEW
   ```

2. **Add evaluation logic** in `services/backend-api/src/services/alertService.ts`:
   ```typescript
   private evaluateCondition(session: ISession, condition: IAlertCondition): boolean {
     switch (condition.type) {
       // ... existing cases ...

       case 'request_body_contains':
         if (!session.body) return false;
         const searchValue = condition.value.toLowerCase();
         return session.body.toLowerCase().includes(searchValue);

       default:
         return false;
     }
   }
   ```

3. **Update frontend type** in `services/frontend/src/lib/types.ts`:
   ```typescript
   export type AlertConditionType =
     | 'status_code'
     | 'status_range'
     | 'response_time'
     | 'method'
     | 'url_pattern'
     | 'request_body_contains';  // NEW
   ```

4. **Add UI option** in alert creation form:
   ```svelte
   <select bind:value={condition.type}>
     <option value="status_code">Status Code</option>
     <option value="status_range">Status Range</option>
     <option value="response_time">Response Time</option>
     <option value="method">HTTP Method</option>
     <option value="url_pattern">URL Pattern</option>
     <option value="request_body_contains">Request Body Contains</option>
   </select>
   ```

### Adding a New Service

**Example: Add a "Statistics Service" for analytics**

1. **Create service file** `services/backend-api/src/services/statisticsService.ts`:
   ```typescript
   import { EventEmitter } from 'node:events';
   import { Session } from '../models/Session';

   export class StatisticsService extends EventEmitter {
     async getOverview() {
       const totalSessions = await Session.countDocuments();
       const errorRate = await this.calculateErrorRate();
       const avgResponseTime = await this.calculateAvgResponseTime();

       return { totalSessions, errorRate, avgResponseTime };
     }

     private async calculateErrorRate(): Promise<number> {
       const total = await Session.countDocuments({ isPending: false });
       const errors = await Session.countDocuments({
         statusCode: { $gte: 500 }
       });
       return total > 0 ? (errors / total) * 100 : 0;
     }

     private async calculateAvgResponseTime(): Promise<number> {
       const result = await Session.aggregate([
         { $match: { responseTime: { $exists: true } } },
         { $group: { _id: null, avg: { $avg: '$responseTime' } } }
       ]);
       return result[0]?.avg || 0;
     }
   }
   ```

2. **Initialize in index.ts**:
   ```typescript
   import { StatisticsService } from './services/statisticsService';

   const statsService = new StatisticsService();
   ```

3. **Create route** `services/backend-api/src/routes/statistics.ts`:
   ```typescript
   import { Elysia } from 'elysia';

   export const createStatisticsRouter = (statsService: StatisticsService) => {
     return new Elysia({ prefix: '/api/v1/statistics' })
       .get('/overview', async () => {
         return await statsService.getOverview();
       });
   };
   ```

4. **Register route**:
   ```typescript
   const statsRouter = createStatisticsRouter(statsService);
   app.use(statsRouter);
   ```

---

## Testing

### Backend Testing

**Unit Tests (Bun Test):**
```bash
cd services/backend-api
bun test
```

**Example test file** `services/backend-api/src/services/alertService.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'bun:test';
import { AlertService } from './alertService';

describe('AlertService', () => {
  let alertService: AlertService;

  beforeEach(() => {
    alertService = new AlertService();
  });

  it('should evaluate status_code condition correctly', () => {
    const session = { statusCode: 404, /* ... */ };
    const condition = { type: 'status_code', operator: 'equals', value: '404' };

    expect(alertService.evaluateCondition(session, condition)).toBe(true);
  });

  it('should respect cooldown period', async () => {
    const rule = {
      cooldownMinutes: 5,
      lastTriggeredAt: new Date(Date.now() - 3 * 60 * 1000)  // 3 min ago
    };

    expect(alertService.isInCooldown(rule)).toBe(true);
  });
});
```

### Frontend Testing

**Component Tests (Vitest + Testing Library):**
```bash
cd services/frontend
npm test
```

**Example test** `services/frontend/src/lib/components/SessionCard.test.ts`:
```typescript
import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SessionCard from './SessionCard.svelte';

describe('SessionCard', () => {
  it('renders session method and URI', () => {
    const session = {
      method: 'GET',
      uri: '/api/users',
      statusCode: 200,
      /* ... */
    };

    render(SessionCard, { props: { session } });

    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('/api/users')).toBeInTheDocument();
  });

  it('shows pending badge when no response', () => {
    const session = {
      method: 'POST',
      uri: '/api/data',
      isPending: true
    };

    render(SessionCard, { props: { session } });

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
```

### Manual Testing

**Email Service Test:**
```bash
cd services/backend-api
bun run scripts/test-email.ts
```

**Capture Agent Test:**
```bash
cd services/capture-agent
./build/capture_agent
# Select interface, verify output files
```

### Integration Testing

**Test Full Alert Flow:**
1. Start all services (backend, frontend, MongoDB)
2. Create an alert rule via UI (e.g., status code = 500)
3. Trigger the condition (make a request that returns 500)
4. Verify:
   - Notification appears in UI
   - Email is sent (check Ethereal inbox)
   - Database updated correctly

---

## Deployment

### Production Build

**Backend:**
```bash
cd services/backend-api
bun install --production
bun build src/index.ts --target=bun --outfile=dist/index.js
```

**Frontend:**
```bash
cd services/frontend
npm run build
# Output in build/ directory
```

**Capture Agent:**
```bash
cd services/capture-agent
make release  # Optimized build
```

### Environment Variables

**Production .env example:**
```bash
# Server
NODE_ENV=production
PORT=8000

# MongoDB
MONGODB_URI=mongodb://username:password@mongo-host:27017/rewind?authSource=admin

# Email (Production SMTP)
EMAIL_ENABLED=true
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=Rewind Alerts <alerts@yourdomain.com>
EMAIL_RECIPIENT=admin@yourdomain.com
FRONTEND_URL=https://rewind.yourdomain.com

# Security
CORS_ORIGIN=https://rewind.yourdomain.com
```

### Deployment Options

**Option 1: Docker (Recommended)**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: changeme

  backend:
    build: ./services/backend-api
    ports:
      - "8000:8000"
    environment:
      - MONGODB_URI=mongodb://admin:changeme@mongodb:27017/rewind?authSource=admin
    depends_on:
      - mongodb
    cap_add:
      - NET_ADMIN
      - NET_RAW

  frontend:
    build: ./services/frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongodb_data:
```

Deploy:
```bash
docker-compose up -d
```

**Option 2: Traditional Server (Ubuntu)**

```bash
# Install dependencies
sudo apt-get update
sudo apt-get install -y mongodb bun

# Start MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Deploy backend
cd /opt/rewind/services/backend-api
bun install --production
sudo bun run dist/index.js  # Use process manager like PM2

# Deploy frontend with Nginx
cd /opt/rewind/services/frontend
npm run build
sudo cp -r build/* /var/www/html/
```

**Option 3: Cloud Platforms**

- **Backend**: Deploy to Railway, Render, or Fly.io (supports Bun)
- **Frontend**: Deploy to Vercel, Netlify, or Cloudflare Pages
- **MongoDB**: Use MongoDB Atlas (managed)
- **Capture Agent**: Must run on VM/server with packet capture access

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB with authentication
- [ ] Configure production SMTP (Gmail, SendGrid, etc.)
- [ ] Set up HTTPS/TLS certificates
- [ ] Configure CORS for production domain
- [ ] Set up DNS records (SPF, DKIM for email)
- [ ] Enable MongoDB authentication
- [ ] Set up backup strategy for MongoDB
- [ ] Configure log rotation
- [ ] Set up monitoring (e.g., Prometheus + Grafana)
- [ ] Test email delivery in production
- [ ] Document deployment steps
- [ ] Set up CI/CD pipeline (optional)

---

## Contributing

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/rewind.git
   cd rewind
   git remote add upstream https://github.com/sreekarnv/rewind.git
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes**
   - Follow existing code style and patterns
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes**
   ```bash
   # Backend tests
   cd services/backend-api && bun test

   # Frontend tests
   cd services/frontend && npm test

   # Manual testing
   # Start all services and verify functionality
   ```

5. **Commit with meaningful messages**
   ```bash
   git add .
   git commit -m "feat: add request body search in alert conditions"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   # Open PR on GitHub with description of changes
   ```

### Code Style Guidelines

**TypeScript/JavaScript:**
- Use TypeScript for type safety
- Prefer `async/await` over promises
- Use camelCase for variables/functions
- Use PascalCase for classes/types
- Add JSDoc comments for complex functions

**Svelte:**
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Keep components focused and small
- Use TailwindCSS for styling
- Avoid inline styles

**General:**
- Follow existing patterns in the codebase
- Keep functions small and focused
- Add error handling
- Log important events and errors

### Pull Request Guidelines

**PR Title Format:**
```
<type>: <description>

Types: feat, fix, docs, style, refactor, test, chore
```

**Examples:**
- `feat: add request body filtering in alert system`
- `fix: resolve WebSocket reconnection issue`
- `docs: update email setup guide with AWS SES`

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] All existing tests pass

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows project style
- [ ] Documentation updated
- [ ] No console errors
- [ ] Tested on multiple browsers (frontend changes)
```

---

## Debugging Tips

### Backend Debugging

**Enable verbose logging:**
```typescript
// In index.ts
if (process.env.DEBUG === 'true') {
  console.log('Session received:', session);
}
```

**Debug email issues:**
```bash
# Test email configuration
bun run scripts/test-email.ts

# Check logs for SMTP errors
tail -f logs/backend.log | grep "email"
```

### Frontend Debugging

**Use browser DevTools:**
- Network tab: Monitor API calls and WebSocket messages
- Console: Check for JavaScript errors
- Vue/Svelte DevTools: Inspect component state

**Debug WebSocket:**
```typescript
// In frontend/src/lib/api.ts
const ws = new WebSocket('ws://localhost:8000/api/v1/realtime');

ws.onopen = () => console.log('WebSocket connected');
ws.onerror = (err) => console.error('WebSocket error:', err);
ws.onmessage = (msg) => console.log('WebSocket message:', msg.data);
```

### Capture Agent Debugging

**Run manually with verbose output:**
```bash
cd services/capture-agent
./build/capture_agent --verbose
```

**Check output files:**
```bash
ls -la output/
cat output/session_*.json | jq
```

---

## Performance Optimization

### Backend

- **Database Indexing**: Ensure indexes on frequently queried fields
  ```typescript
  SessionSchema.index({ timestamp: -1 });
  SessionSchema.index({ statusCode: 1 });
  ```

- **Pagination**: Implement pagination for large result sets
  ```typescript
  const sessions = await Session.find()
    .sort({ timestamp: -1 })
    .limit(50)
    .skip(page * 50);
  ```

- **Caching**: Use in-memory cache for frequently accessed data
  ```typescript
  const cache = new Map<string, any>();
  ```

### Frontend

- **Lazy Loading**: Load components on demand
  ```svelte
  <script>
  import { onMount } from 'svelte';
  let SessionDetail;

  onMount(async () => {
    SessionDetail = (await import('./SessionDetail.svelte')).default;
  });
  </script>
  ```

- **Virtual Scrolling**: For large lists (use `svelte-virtual-list`)
- **Debounce Search**: Prevent excessive API calls
  ```typescript
  let searchTimeout;
  function handleSearch(query: string) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 300);
  }
  ```

---

## Common Issues

### Issue: "WebSocket connection failed"

**Cause**: Backend not running or CORS issues

**Solution:**
1. Verify backend is running: `curl http://localhost:8000/api/v1/capture/status`
2. Check CORS configuration in `index.ts`
3. Verify WebSocket URL in frontend (`ws://` not `wss://` for local dev)

### Issue: "Email not sending"

**Cause**: Invalid SMTP configuration or credentials

**Solution:**
1. Verify environment variables: `echo $EMAIL_SMTP_HOST`
2. Test with Ethereal Email first
3. Check backend logs for SMTP errors
4. Run test script: `bun run scripts/test-email.ts`

### Issue: "Capture agent crashes immediately"

**Cause**: Insufficient permissions or invalid interface

**Solution:**
1. Run backend with sudo/admin: `sudo bun run dev`
2. Select valid network interface in UI
3. Check capture agent logs in terminal

### Issue: "MongoDB connection timeout"

**Cause**: MongoDB not running or wrong connection string

**Solution:**
1. Start MongoDB: `mongod --dbpath /path/to/data`
2. Verify connection: `mongosh mongodb://localhost:27017`
3. Check `MONGODB_URI` in `.env`

---

## Additional Resources

- **Bun Documentation**: https://bun.sh/docs
- **Elysia Documentation**: https://elysiajs.com
- **SvelteKit Documentation**: https://kit.svelte.dev
- **PcapPlusPlus Documentation**: https://pcapplusplus.github.io
- **MongoDB Documentation**: https://www.mongodb.com/docs
- **Nodemailer Documentation**: https://nodemailer.com

---

**Happy Coding! 🚀**

For questions or issues, please open a GitHub issue or discussion.
