import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';

export const load: ServerLoad = async (event) => {
	const session = getSession(event);

	// If no session, redirect to login
	if (!session || !session.user) {
		throw redirect(303, '/api/auth/login');
	}

	// Check for error from Auth0
	const error = event.url.searchParams.get('error');
	if (error) {
		return { error, user: null };
	}

	return {
		user: session.user,
		error: null
	};
};
