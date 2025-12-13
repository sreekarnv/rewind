import type { SessionSummary, Stats } from './types';

export interface RealtimeUpdate {
	type: 'init' | 'update';
	data: {
		sessions: SessionSummary[];
		stats: Stats;
		timestamp: number;
	};
}

export type RealtimeCallback = (update: RealtimeUpdate) => void;

export class RealtimeClient {
	private ws: WebSocket | null = null;
	private url: string;
	private callbacks: Set<RealtimeCallback> = new Set();
	private reconnectInterval: number = 5000;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private shouldReconnect: boolean = true;

	constructor(url: string = 'ws://localhost:8000/api/v1/realtime') {
		this.url = url;
	}

	/**
	 * Connect to WebSocket server
	 */
	connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				console.log('Connecting to real-time server...');
				this.ws = new WebSocket(this.url);

				this.ws.onopen = () => {
					console.log('Connected to real-time server');
					this.shouldReconnect = true;
					resolve();
				};

				this.ws.onmessage = (event) => {
					try {
						const update: RealtimeUpdate = JSON.parse(event.data);
						this.notifyCallbacks(update);
					} catch (error) {
						console.error('Error parsing WebSocket message:', error);
					}
				};

				this.ws.onerror = (error) => {
					console.error('WebSocket error:', error);
					reject(error);
				};

				this.ws.onclose = () => {
					console.log('Disconnected from real-time server');
					this.ws = null;

					if (this.shouldReconnect) {
						this.scheduleReconnect();
					}
				};
			} catch (error) {
				console.error('Error creating WebSocket:', error);
				reject(error);
			}
		});
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect() {
		this.shouldReconnect = false;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}

	/**
	 * Schedule a reconnection attempt
	 */
	private scheduleReconnect() {
		if (this.reconnectTimer) {
			return;
		}

		console.log(`Reconnecting in ${this.reconnectInterval / 1000}s...`);
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect().catch(() => {
			});
		}, this.reconnectInterval);
	}

	/**
	 * Subscribe to real-time updates
	 */
	subscribe(callback: RealtimeCallback): () => void {
		this.callbacks.add(callback);

		return () => {
			this.callbacks.delete(callback);
		};
	}

	/**
	 * Notify all callbacks with an update
	 */
	private notifyCallbacks(update: RealtimeUpdate) {
		this.callbacks.forEach((callback) => {
			try {
				callback(update);
			} catch (error) {
				console.error('Error in realtime callback:', error);
			}
		});
	}

	/**
	 * Check if connected
	 */
	isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	/**
	 * Send a ping to keep connection alive
	 */
	ping() {
		if (this.isConnected() && this.ws) {
			this.ws.send(JSON.stringify({ type: 'ping' }));
		}
	}
}

let realtimeClient: RealtimeClient | null = null;

/**
 * Get or create the singleton realtime client
 */
export function getRealtimeClient(): RealtimeClient {
	if (!realtimeClient) {
		realtimeClient = new RealtimeClient();
	}
	return realtimeClient;
}
