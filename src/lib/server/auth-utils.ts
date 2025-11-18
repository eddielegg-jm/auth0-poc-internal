import { webcrypto } from 'crypto';

export function generateState(): string {
	const array = new Uint8Array(32);
	webcrypto.getRandomValues(array);
	return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function generateCodeVerifier(): string {
	const array = new Uint8Array(32);
	webcrypto.getRandomValues(array);
	return base64UrlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(verifier);
	const hash = await webcrypto.subtle.digest('SHA-256', data);
	return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer: Uint8Array): string {
	const base64 = Buffer.from(buffer).toString('base64');
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
