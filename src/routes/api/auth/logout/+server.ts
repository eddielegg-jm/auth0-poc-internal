import { json, type RequestHandler } from '@sveltejs/kit';
import { auth0Config } from '$lib/config/auth0';
import { clearSession } from '$lib/server/session';

export const POST: RequestHandler = async (event) => {
	clearSession(event);

	const logoutUrl = `https://${auth0Config.domain}/v2/logout?${new URLSearchParams({
		client_id: auth0Config.clientId,
		returnTo: auth0Config.appUrl
	})}`;

	return json({ logoutUrl });
};
