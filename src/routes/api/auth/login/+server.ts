import { redirect, type RequestHandler } from '@sveltejs/kit';
import { auth0Config } from '$lib/config/auth0';
import { generateState, generateCodeVerifier, generateCodeChallenge } from '$lib/server/auth-utils';

export const GET: RequestHandler = async ({ cookies }) => {
	console.log('[Internal App] Login initiated for organization:', auth0Config.organizationId);

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
		organization: auth0Config.organizationId // 👈 Forces this specific org
	});

	const authorizationUrl = `https://${auth0Config.domain}/authorize?${params.toString()}`;

	console.log('[Internal App] Redirecting to Auth0 with organization:', auth0Config.organizationId);
	throw redirect(302, authorizationUrl);
};
