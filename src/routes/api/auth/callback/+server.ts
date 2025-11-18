import { redirect, type RequestHandler } from '@sveltejs/kit';
import { auth0Config } from '$lib/config/auth0';
import { setSession } from '$lib/server/session';

export const GET: RequestHandler = async (event) => {
	const { url, cookies } = event;
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');
	const errorDescription = url.searchParams.get('error_description');

	console.log('[Internal App] Callback received');

	// Handle errors from Auth0
	if (error) {
		console.error('[Internal App] Auth0 error:', error, errorDescription);
		throw redirect(303, `/?error=${encodeURIComponent(error)}`);
	}

	// Verify state
	const storedState = cookies.get('auth_state');
	if (!state || state !== storedState) {
		console.error('[Internal App] State mismatch');
		throw redirect(303, '/?error=invalid_state');
	}

	// Get code verifier
	const codeVerifier = cookies.get('auth_code_verifier');
	if (!code || !codeVerifier) {
		console.error('[Internal App] Missing code or verifier');
		throw redirect(303, '/?error=missing_parameters');
	}

	// Exchange code for tokens
	const tokenResponse = await fetch(`https://${auth0Config.domain}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'authorization_code',
			client_id: auth0Config.clientId,
			client_secret: auth0Config.clientSecret,
			code,
			code_verifier: codeVerifier,
			redirect_uri: auth0Config.callbackUrl
		})
	});

	if (!tokenResponse.ok) {
		const errorData = await tokenResponse.text();
		console.error('[Internal App] Token exchange error:', errorData);
		throw redirect(303, '/?error=token_exchange_failed');
	}

	const tokens = await tokenResponse.json();

	// Get user info
	const userInfoResponse = await fetch(`https://${auth0Config.domain}/userinfo`, {
		headers: {
			Authorization: `Bearer ${tokens.access_token}`
		}
	});

	if (!userInfoResponse.ok) {
		console.error('[Internal App] Userinfo failed');
		throw redirect(303, '/?error=userinfo_failed');
	}

	const userInfo = await userInfoResponse.json();

	console.log('[Internal App] User authenticated:', userInfo.email);
	console.log('[Internal App] Organization in token:', userInfo.org_id);

	// Verify user belongs to the correct organization
	if (userInfo.org_id !== auth0Config.organizationId) {
		console.error('[Internal App] User does not belong to this organization');
		throw redirect(303, '/?error=unauthorized_organization');
	}

	// Store session
	setSession(event, {
		user: {
			sub: userInfo.sub,
			email: userInfo.email,
			name: userInfo.name,
			picture: userInfo.picture,
			org_id: userInfo.org_id,
			org_name: userInfo.org_name
		},
		accessToken: tokens.access_token,
		idToken: tokens.id_token,
		expiresAt: Date.now() + tokens.expires_in * 1000
	});

	// Clear temporary cookies
	cookies.delete('auth_state', { path: '/' });
	cookies.delete('auth_code_verifier', { path: '/' });

	console.log('[Internal App] Session created, redirecting to home');
	throw redirect(303, '/');
};
