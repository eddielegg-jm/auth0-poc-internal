import type { RequestEvent } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { auth0Config } from '$lib/config/auth0';

export interface SessionData {
	user?: {
		sub: string;
		email: string;
		name: string;
		picture?: string;
		org_id: string;
		org_name?: string;
	};
	accessToken?: string;
	idToken?: string;
	expiresAt?: number;
}

const COOKIE_NAME = 'internal_app_session';
const COOKIE_OPTIONS = {
	httpOnly: true,
	secure: process.env.NODE_ENV === 'production',
	sameSite: 'lax' as const,
	path: '/',
	maxAge: 60 * 60 * 24 * 7 // 7 days
};

export function encryptSession(data: SessionData): string {
	return jwt.sign(data, auth0Config.sessionSecret);
}

export function decryptSession(token: string): SessionData | null {
	try {
		return jwt.verify(token, auth0Config.sessionSecret) as SessionData;
	} catch {
		return null;
	}
}

export function setSession(event: RequestEvent, data: SessionData) {
	const token = encryptSession(data);
	event.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

export function getSession(event: RequestEvent): SessionData | null {
	const token = event.cookies.get(COOKIE_NAME);
	if (!token) return null;
	return decryptSession(token);
}

export function clearSession(event: RequestEvent) {
	event.cookies.delete(COOKIE_NAME, { path: '/' });
}
