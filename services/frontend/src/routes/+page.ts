import { api } from '$lib/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	try {
		const data = await api.getSessions();
		return {
			sessions: data.sessions,
			total: data.total
		};
	} catch (error) {
		console.error('Failed to load sessions:', error);
		return {
			sessions: [],
			total: 0,
			error: error instanceof Error ? error.message : 'Failed to load sessions'
		};
	}
};
