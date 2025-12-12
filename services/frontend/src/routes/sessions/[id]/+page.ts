import { api } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	try {
		const data = await api.getSessionById(params.id);
		return {
			session: data.session
		};
	} catch (err) {
		console.error('Failed to load session:', err);
		throw error(404, {
			message: 'Session not found'
		});
	}
};
