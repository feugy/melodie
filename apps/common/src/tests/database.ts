import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { faker } from '@faker-js/faker'
import knex from 'knex'
import type { AbstractModel } from '../models/abstract-model.ts'
import type { DBConf } from '../types.ts'

export async function initTestDB(
	kind: 'sqlite3' | 'pg' = 'sqlite3'
): Promise<DBConf> {
	if (kind === 'sqlite3') {
		return {
			kind,
			filename: join(await mkdtemp(join(tmpdir(), 'melodie-')), 'db.sqlite3')
		}
	}
	const conf = {
		kind,
		host: 'localhost',
		port: 5432,
		user: 'melodie_test',
		password: 'L0ca_l',
		database: `test_${faker.word.adjective()}`
	}
	const db = knex({
		client: kind,
		connection: { ...conf, database: 'postgres' }
	})
	await db.raw('create database ??', [conf.database])
	await db.destroy()
	return conf
}

export async function cleanTestTB(conf: DBConf) {
	if (conf.kind === 'sqlite3') {
		return
	}
	const db = knex({
		client: conf.kind,
		connection: { ...conf, password: 'L0ca_l', database: 'postgres' }
	})
	await db.raw('drop database ??', [conf.database])
	await db.destroy()
}

export function serializedModel<T extends { id: number }>(
	model: Record<string, unknown>,
	modelClass: AbstractModel<T>
) {
	if (modelClass.dbKind === 'pg') return { ...model }

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
