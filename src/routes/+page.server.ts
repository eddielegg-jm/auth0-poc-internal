import { redirect, type ServerLoad } from '@sveltejs/kit';
import { getSession } from '$lib/server/session';

export const load: ServerLoad = async (event) => {
	const session = getSession(event);
	
	// Check for error from Auth0 first (before checking session)
	const error = event.url.searchParams.get('error');
	if (error) {
		// Show error page even without session
		return { 
			error, 
			errorDescription: event.url.searchParams.get('error_description'),
			user: null 
		};
	}

	// If no session and no error, redirect to login
	if (!session || !session.user) {
		throw redirect(303, '/api/auth/login');
	}

	return {
		user: session.user,
		error: null,
		errorDescription: null
	};
};
