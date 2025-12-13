const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

export interface CaptureState {
	status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
	pid?: number;
	startedAt?: number;
	stoppedAt?: number;
	error?: string;
	uptime?: number;
}

export interface CaptureResponse {
	message: string;
	state: CaptureState;
}

class CaptureApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	async getStatus(): Promise<CaptureState> {
		const response = await fetch(`${this.baseUrl}/api/v1/capture/status`);
		if (!response.ok) {
			throw new Error('Failed to get capture status');
		}
		return response.json();
	}

	async start(): Promise<CaptureResponse> {
		const response = await fetch(`${this.baseUrl}/api/v1/capture/start`, {
			method: 'POST'
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Failed to start capture');
		}

		return data;
	}

	async stop(): Promise<CaptureResponse> {
		const response = await fetch(`${this.baseUrl}/api/v1/capture/stop`, {
			method: 'POST'
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Failed to stop capture');
		}

		return data;
	}

	async restart(): Promise<CaptureResponse> {
		const response = await fetch(`${this.baseUrl}/api/v1/capture/restart`, {
			method: 'POST'
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.message || 'Failed to restart capture');
		}

		return data;
	}
}

export const captureApi = new CaptureApiClient();
