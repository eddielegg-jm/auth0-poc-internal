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
	// Pass along invitation and organization parameters if present
	if (!session || !session.user) {
		const invitation = event.url.searchParams.get('invitation');
		const organization = event.url.searchParams.get('organization');
		const organizationName = event.url.searchParams.get('organization_name');
		
		const loginParams = new URLSearchParams();
		if (invitation) loginParams.set('invitation', invitation);
		if (organization) loginParams.set('organization', organization);
		if (organizationName) loginParams.set('organization_name', organizationName);
		
		const loginUrl = loginParams.toString() 
			? `/api/auth/login?${loginParams.toString()}`
			: '/api/auth/login';
			
		throw redirect(303, loginUrl);
	}

	return {
		user: session.user,
		error: null,
		errorDescription: null
	};
};
