import { Database } from 'bun:sqlite'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AbstractModel } from '../models/abstract-model.ts'
import type { DBConf } from '../types.ts'

export async function initTestDB() {
	const conf: DBConf = {
		filename: join(await mkdtemp(join(tmpdir(), 'melodie-')), 'db.sqlite3')
	}
	return { conf, db: new Database(conf.filename, { strict: true }) }
}

export async function cleanTestTB(conf: DBConf) {
	AbstractModel.release()
	await rm(conf.filename, { force: true })
}

export function serializedModel<T extends { id: number }>(
	model: Record<string, unknown>,
	modelClass: AbstractModel<T>
) {
	const serialized: Record<string, unknown> = { ...model }
	for (const col of modelClass.jsonColumns) {
		serialized[col] = JSON.stringify(serialized[col])
	}
	return serialized
}

export function serializedModels<T extends { id: number }>(
	models: Record<string, unknown>[],
	modelClass: AbstractModel<T>
) {
	return models.map(model => serializedModel(model, modelClass))
}
