import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

if (!env.AUTH0_DOMAIN) throw new Error('AUTH0_DOMAIN is required');
if (!env.AUTH0_CLIENT_ID) throw new Error('AUTH0_CLIENT_ID is required');
if (!env.AUTH0_CLIENT_SECRET) throw new Error('AUTH0_CLIENT_SECRET is required');
if (!env.AUTH0_ORGANIZATION_ID) throw new Error('AUTH0_ORGANIZATION_ID is required');
if (!env.AUTH0_CALLBACK_URL) throw new Error('AUTH0_CALLBACK_URL is required');
if (!env.AUTH0_SESSION_SECRET) throw new Error('AUTH0_SESSION_SECRET is required');

export const auth0Config = {
	domain: env.AUTH0_DOMAIN,
	clientId: env.AUTH0_CLIENT_ID,
	clientSecret: env.AUTH0_CLIENT_SECRET,
	organizationId: env.AUTH0_ORGANIZATION_ID,
	callbackUrl: env.AUTH0_CALLBACK_URL,
	sessionSecret: env.AUTH0_SESSION_SECRET,
	appUrl: publicEnv.PUBLIC_APP_URL || 'http://localhost:3001'
};
