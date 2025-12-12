import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { FileStorageService } from './services/fileStorage';
import { RealtimeWatcher } from './services/realtimeWatcher';
import { CaptureManager } from './services/captureManager';
import { sessionsRoute } from './routes/sessions';
import { realtimeRoute } from './routes/realtime';
import { captureRoute } from './routes/capture';

const PORT = process.env.PORT || 8000;
const DATA_DIR = process.env.DATA_DIR || '../capture-agent/output';
const CAPTURE_AGENT_PATH = process.env.CAPTURE_AGENT_PATH;
const CONFIG_PATH = process.env.CONFIG_PATH;

const storage = new FileStorageService(DATA_DIR);
const watcher = new RealtimeWatcher(DATA_DIR);
const captureManager = new CaptureManager(CAPTURE_AGENT_PATH, CONFIG_PATH);

const app = new Elysia()
	.use(
		cors({
			origin: true,
			methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
			credentials: true,
		})
	)
	.onError(({ code, error, set }) => {
		console.error('Error:', error);

		if (code === 'NOT_FOUND') {
			set.status = 404;
			return {
				error: 'Not Found',
				message: 'The requested resource was not found',
				statusCode: 404,
			};
		}

		if (code === 'VALIDATION') {
			set.status = 400;
			return {
				error: 'Bad Request',
				message: 'Invalid request parameters',
				statusCode: 400,
			};
		}

		set.status = 500;
		return {
			error: 'Internal Server Error',
			message: (error as any).message || 'An unexpected error occurred',
			statusCode: 500,
		};
	})

	.get('/health', () => ({
		status: 'ok',
		timestamp: new Date().toISOString(),
		service: 'rewind-backend-api',
	}))

	.use(sessionsRoute(storage))
	.use(realtimeRoute(watcher, storage))
	.use(captureRoute(captureManager))

	.listen(PORT);

console.log(`
🚀 Rewind Backend API is running!

📍 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/health
📚 API Base: http://localhost:${PORT}/api/v1

Available endpoints:
  GET  /api/v1/sessions           - List all sessions
  GET  /api/v1/sessions/:id       - Get session details
  GET  /api/v1/sessions/:id/requests - Get session requests
  GET  /api/v1/stats              - Get statistics
  WS   /api/v1/realtime           - Real-time updates (WebSocket)
  GET  /api/v1/realtime/status    - Real-time connection status
  GET  /api/v1/capture/status     - Get capture agent status
  POST /api/v1/capture/start      - Start capture agent
  POST /api/v1/capture/stop       - Stop capture agent
  POST /api/v1/capture/restart    - Restart capture agent

Data directory: ${DATA_DIR}
🔄 Real-time updates: ENABLED
🎮 Capture controls: ENABLED
`);

export type App = typeof app;
