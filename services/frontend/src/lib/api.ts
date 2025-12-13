// API client for backend communication

import type {
	SessionListResponse,
	SessionDetailResponse,
	Stats
} from './types';

const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	private async fetch<T>(endpoint: string): Promise<T> {
		const response = await fetch(`${this.baseUrl}${endpoint}`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'API request failed');
		}

		return response.json();
	}

	async getSessions(): Promise<SessionListResponse> {
		return this.fetch<SessionListResponse>('/api/v1/sessions');
	}

	async getSessionById(id: string): Promise<SessionDetailResponse> {
		return this.fetch<SessionDetailResponse>(`/api/v1/sessions/${encodeURIComponent(id)}`);
	}

	async getStats(): Promise<Stats> {
		return this.fetch<Stats>('/api/v1/stats');
	}

	async checkHealth(): Promise<{ status: string; timestamp: string; service: string }> {
		return this.fetch('/health');
	}
}

export const api = new ApiClient();
