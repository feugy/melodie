import type { Database } from 'bun:sqlite'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { faker } from '@faker-js/faker'
import { cleanTestTB, initTestDB } from '../tests/database.ts'
import type { DBConf } from '../types.ts'
import { type Settings, SettingsModel, settingsModel } from './settings.ts'

describe('Settings model', () => {
	let db: Database
	let conf: DBConf

	beforeAll(async () => {
		;({ conf, db } = await initTestDB())
	})

	afterAll(async () => {
		await SettingsModel.release()
		await cleanTestTB(conf)
	})

	it('creates default settings on init', async () => {
		await settingsModel.init(conf)
		expect(await settingsModel.get()).toEqual({
			id: settingsModel.ID,
			folders: [],
			port: 80
		})
	})

	it('returns settings', async () => {
		const { folders, ...columns } = db
			.query(`SELECT * FROM ${settingsModel.name} WHERE id = :id`)
			.get({ id: settingsModel.ID }) as Settings & { folders: string }

		expect(await settingsModel.get()).toEqual({
			...columns,
			folders: JSON.parse(folders)
		})
	})

	it('returns modified settings on save', async () => {
		const folders = [faker.system.directoryPath(), faker.system.directoryPath()]
		const settings = await settingsModel.get()
		settings.folders.push(...folders)

		expect(await settingsModel.save(settings)).toEqual(settings)
		expect(await settingsModel.get()).toEqual(settings)
	})
})
