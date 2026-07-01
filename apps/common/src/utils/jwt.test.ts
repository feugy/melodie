import type { Database } from 'bun:sqlite'
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	setSystemTime
} from 'bun:test'
import { faker } from '@faker-js/faker'
import { createDecoder } from 'fast-jwt'
import ms from 'ms'
import { SettingsModel, settingsModel } from '../models/settings.ts'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import type { DBConf } from '../types.ts'
import { JWT_EXPIRES_IN, createJWT, generateJWTKey, verifyJWT } from './jwt.ts'

describe('JWT utilities', () => {
	let conf: DBConf

	beforeAll(async () => {
		;({ conf } = await initTestDB())
		await settingsModel.init(conf)
	})

	afterAll(async () => {
		await SettingsModel.release()
		await cleanTestTB(conf)
	})

	describe('generateJWTKey()', () => {
		it('generates new values', async () => {
			const key1 = await generateJWTKey()
			expect(key1).toEqual(expect.any(String))
			const key2 = await generateJWTKey()
			expect(key2).toEqual(expect.any(String))
			expect(key1).not.toEqual(key2)
		})
	})

	describe('createJWT()', () => {
		it('creates a JWT with a payload', async () => {
			const userId = faker.number.int({ min: 1, max: 1000 })
			const token = await createJWT({ userId })
			const decoded = createDecoder()(token)
			expect(decoded).toEqual({
				userId,
				iat: expect.any(Number),
				exp: expect.any(Number)
			})
			expect(decoded.exp).toBe(
				Math.floor(Date.now() / 1000) + ms(JWT_EXPIRES_IN) / 1000
			)
		})
	})

	describe('verifyJWT()', () => {
		let token: string
		let userId: number

		beforeEach(async () => {
			setSystemTime()
			userId = faker.number.int({ min: 1, max: 1000 })
			token = await createJWT({ userId })
		})

		it('decodes a valid JWT', async () => {
			const decoded = await verifyJWT<{ userId: number }>(token)
			expect(decoded).toEqual({
				userId,
				iat: expect.any(Number),
				exp: expect.any(Number)
			})
			expect(decoded.exp).toBe(
				Math.floor((Date.now() + ms(JWT_EXPIRES_IN)) / 1000)
			)
		})

		it('throws on malfomed JWT', async () => {
			await expect(verifyJWT('malformed.token')).rejects.toThrow(
				'The token is malformed.'
			)
		})

		it('throws on expired JWT', async () => {
			const exp = new Date(
				Math.floor((Date.now() + ms(JWT_EXPIRES_IN)) / 1000) * 1000
			)
			setSystemTime(Date.now() + ms(JWT_EXPIRES_IN) + 1000)
			await expect(verifyJWT(token)).rejects.toThrow(
				`The token has expired at ${exp.toISOString()}.`
			)
		})
	})
})
