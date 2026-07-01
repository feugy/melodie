import { randomBytes } from 'node:crypto'
import { createSigner, createVerifier } from 'fast-jwt'

export const JWT_EXPIRES_IN = '15m' as const

export async function generateJWTKey() {
	// https://lucia-auth.com/sessions/basic
	const alphabet = 'abcdefghijklmnpqrstuvwxyz23456789'
	const bytes = randomBytes(64)
	let id = ''
	for (let i = 0; i < bytes.length; i++) {
		id += alphabet[bytes[i] >> 3]
	}
	return id
}

let signer: ((payload: Record<string, unknown>) => string) | undefined
let verifier: ((token: string) => Record<string, unknown>) | undefined

export async function createJWT(payload: Record<string, unknown> = {}) {
	if (!signer) {
		const { settingsModel } = await import('../models/settings.ts')
		const { jwtKey } = await settingsModel.get()
		signer = createSigner({
			key: jwtKey,
			expiresIn: JWT_EXPIRES_IN,
			algorithm: 'HS512'
		})
	}
	return signer(payload)
}

export async function verifyJWT<T>(token: string) {
	if (!verifier) {
		const { settingsModel } = await import('../models/settings.ts')
		const { jwtKey } = await settingsModel.get()
		verifier = createVerifier({
			key: jwtKey,
			cache: true,
			algorithms: ['HS512']
		})
	}
	return verifier(token) as T & { exp: number; iat: number }
}
