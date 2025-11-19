import { redirect, type RequestHandler } from '@sveltejs/kit';
import { auth0Config } from '$lib/config/auth0';
import { generateState, generateCodeVerifier, generateCodeChallenge } from '$lib/server/auth-utils';

export const GET: RequestHandler = async ({ cookies, url }) => {
	// Check for invitation parameters
	const invitation = url.searchParams.get('invitation');
	const organization = url.searchParams.get('organization');
	const organizationName = url.searchParams.get('organization_name');
	
	console.log('[Internal App] Login initiated for organization:', auth0Config.organizationId);
	if (invitation) {
		console.log('[Internal App] Processing invitation:', invitation, 'for org:', organization);
	}

	// Generate PKCE parameters
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const codeChallenge = await generateCodeChallenge(codeVerifier);

	// Store state and code verifier in cookies
	cookies.set('auth_state', state, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 10 // 10 minutes
	});

	cookies.set('auth_code_verifier', codeVerifier, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 60 * 10 // 10 minutes
	});

	// Build authorization URL with ORGANIZATION parameter (key for single-tenant)
	const params = new URLSearchParams({
		client_id: auth0Config.clientId,
		response_type: 'code',
		redirect_uri: auth0Config.callbackUrl,
		scope: 'openid profile email',
		state,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		organization: organization || auth0Config.organizationId // Use invitation org or default
	});

	// Add invitation parameter if present
	if (invitation) {
		params.set('invitation', invitation);
	}
	if (organizationName) {
		params.set('organization_name', organizationName);
	}

	const authorizationUrl = `https://${auth0Config.domain}/authorize?${params.toString()}`;

	console.log('[Internal App] Redirecting to Auth0 with params:', {
		organization: params.get('organization'),
		invitation: params.get('invitation'),
		hasOrganizationName: !!params.get('organization_name')
	});
	throw redirect(302, authorizationUrl);
};
