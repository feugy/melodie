import { faker } from '@faker-js/faker'
import { type Knex, knex } from 'knex'
import ms from 'ms'
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi
} from 'vitest'
import { cleanTestTB, initTestDB, serializedModels } from '../tests/database.ts'
import type { DBConf, PartialWithReq } from '../types.ts'
import type { Reference } from '../utils/refs.ts'
import { AbstractTrackList } from './abstract-track-list.ts'

const modelName = 'test'

const computeRefs = vi.fn()

interface TestModel {
	id: number
	trackIds: number[]
	refs: Reference[]
	removedTrackIds?: number[]
	name?: string
	media?: string
	mediaCount: number
	mtimeMs: number
}

class Test extends AbstractTrackList<TestModel> {
	constructor() {
		super({ name: modelName })
	}

	async computeRefs<Record extends {}, Result>(
		_: Knex.Transaction<Record, Result>,
		ids: number[]
	) {
		return computeRefs(ids)
	}
}

describe.each([{ kind: 'pg' }, { kind: 'sqlite3' }])(
	'Abstract track list ($kind}',
	({ kind }) => {
		let db: Knex
		let conf: DBConf
		const tested = new Test()
		const lastProcessed = Date.now() - ms('1d')
		const models = [
			{
				id: faker.number.int(),
				name: faker.person.fullName(),
				mediaCount: 0,
				trackIds: JSON.stringify([]),
				refs: JSON.stringify([[faker.number.int(), faker.person.fullName()]]),
				mtimeMs: 0
			},
			{
				id: faker.number.int(),
				name: faker.person.fullName(),
				media: faker.image.url(),
				mediaCount: faker.number.int({ min: 2, max: 10 }),
				trackIds: JSON.stringify([faker.number.int()]),
				refs: JSON.stringify([
					[faker.number.int(), faker.person.fullName()],
					[faker.number.int(), faker.person.fullName()]
				])
			},
			{
				id: faker.number.int(),
				name: faker.person.fullName(),
				media: faker.image.url(),
				mediaCount: faker.number.int({ min: 2, max: 10 }),
				trackIds: JSON.stringify([faker.number.int(), faker.number.int()]),
				refs: JSON.stringify([
					[faker.number.int(), faker.person.fullName()],
					[faker.number.int(), faker.person.fullName()]
				])
			},
			{
				id: faker.number.int(),
				name: faker.person.fullName(),
				mediaCount: 0,
				trackIds: JSON.stringify([]),
				refs: JSON.stringify([]),
				mtimeMs: lastProcessed
			}
		]

		beforeAll(async () => {
			conf = await initTestDB(kind as DBConf['kind'])
			db = knex({
				client: conf.kind,
				connection: conf,
				useNullAsDefault: true
			})
			await tested.init(conf)
			await db.schema.createTable(modelName, table => {
				table.double('id').primary()
				table.string('name')
				table.string('media')
				table.double('mtimeMs')
				table.json('trackIds')
				table.json('refs')
				table.integer('mediaCount').defaultTo(1)
			})
		})

		beforeEach(async () => {
			vi.resetAllMocks()
			await tested.reset()
			await db(modelName).insert(models)
		})

		afterAll(async () => {
			if (await db.schema.hasTable(modelName)) {
				await db.schema.dropTable(modelName)
			}
			await Test.release()
			await db.destroy()
			await cleanTestTB(conf)
		})

		describe('listMedialess()', () => {
			it('does not return models with media', async () => {
				expect(await tested.listMedialess(Date.now())).toEqual(
					[models[0], models[3]]
						.map(model => ({
							...model,
							trackIds: JSON.parse(model.trackIds),
							refs: JSON.parse(model.refs)
						}))
						.sort((a, b) => (a.name < b.name ? -1 : 1))
				)
			})

			it('does not return models younger than given date', async () => {
				expect(await tested.listMedialess(Date.now() - ms('2d'))).toEqual([
					{
						...models[0],
						mtimeMs: 0,
						trackIds: JSON.parse(models[0].trackIds),
						refs: JSON.parse(models[0].refs)
					}
				])
			})
		})

		describe('save()', () => {
			it('adds new model', async () => {
				const refs = [[faker.number.int(), faker.person.fullName()]]
				computeRefs.mockResolvedValueOnce(refs)
				const model: PartialWithReq<TestModel, 'id'> = {
					id: faker.number.int(),
					name: faker.person.fullName(),
					trackIds: [faker.number.int()],
					refs: []
				}

				const { saved, removedIds } = await tested.save(model)

				const savedModel = {
					...model,
					mediaCount: 0,
					mtimeMs: 0,
					refs
				}

				expect(saved).toEqual([savedModel])
				expect(removedIds).toEqual([])
				expect(await db(modelName).where({ id: model.id })).toEqual(
					serializedModels([{ ...savedModel, media: null }], tested)
				)
				expect(computeRefs).toHaveBeenCalledWith(model.trackIds)
				expect(computeRefs).toHaveBeenCalledTimes(1)
			})

			it('saves multiple models', async () => {
				const refs1 = [[faker.number.int(), faker.person.fullName()]]
				const refs2 = [[faker.number.int(), faker.person.fullName()]]
				computeRefs.mockResolvedValueOnce(refs1).mockResolvedValueOnce(refs2)
				const models: PartialWithReq<TestModel, 'id'>[] = [
					{
						id: faker.number.int(),
						name: faker.person.fullName(),
						trackIds: [faker.number.int()],
						refs: []
					},
					{
						id: faker.number.int(),
						name: faker.person.fullName(),
						trackIds: [faker.number.int()]
					}
				]

				const { saved, removedIds } = await tested.save(models)

				const savedModels = [
					{
						...models[0],
						mtimeMs: 0,
						mediaCount: 0,
						refs: refs1
					},
					{
						...models[1],
						mtimeMs: 0,
						mediaCount: 0,
						refs: refs2
					}
				]

				expect(saved).toEqual(savedModels)
				expect(removedIds).toEqual([])
				expect(await db(modelName).where({ id: models[0].id })).toEqual(
					serializedModels([{ ...savedModels[0], media: null }], tested)
				)
				expect(await db(modelName).where({ id: models[1].id })).toEqual(
					serializedModels([{ ...savedModels[1], media: null }], tested)
				)
				expect(computeRefs).toHaveBeenCalledWith(models[0].trackIds)
				expect(computeRefs).toHaveBeenCalledWith(models[1].trackIds)
				expect(computeRefs).toHaveBeenCalledTimes(2)
			})

			it('updates multipe models with sparse data', async () => {
				const refs = [[faker.number.int(), faker.person.fullName()]]
				computeRefs.mockResolvedValue(refs)
				const originals: PartialWithReq<TestModel, 'id'>[] = [
					{
						id: models[0].id,
						name: models[0].name,
						media: faker.image.url(),
						mediaCount: faker.number.int({ min: 2, max: 10 }),
						mtimeMs: 0,
						trackIds: [faker.number.int()],
						refs: []
					},
					{
						id: models[1].id,
						name: models[1].name,
						removedTrackIds: [faker.number.int()],
						trackIds: [],
						refs: []
					},
					{
						id: faker.number.int(),
						name: faker.person.fullName(),
						trackIds: [faker.number.int()],
						refs: []
					}
				]

				const { saved, removedIds } = await tested.save(originals)

				const savedModels = [
					{
						...originals[0],
						trackIds: JSON.parse(models[0].trackIds).concat(
							originals[0].trackIds
						),
						refs
					},
					{
						...models[1],
						mtimeMs: null,
						trackIds: JSON.parse(models[1].trackIds),
						refs
					},
					{
						...originals[2],
						mtimeMs: 0,
						mediaCount: 0,
						refs
					}
				]

				expect(saved).toEqual(savedModels)
				expect(removedIds).toEqual([])
				expect(await db(modelName).where({ id: savedModels[0].id })).toEqual(
					serializedModels([savedModels[0]], tested)
				)
				expect(await db(modelName).where({ id: savedModels[1].id })).toEqual(
					serializedModels([savedModels[1]], tested)
				)
				expect(await db(modelName).where({ id: savedModels[2].id })).toEqual(
					serializedModels([{ ...savedModels[2], media: null }], tested)
				)
				expect(computeRefs).toHaveBeenCalledWith(savedModels[0].trackIds)
				expect(computeRefs).toHaveBeenCalledWith(savedModels[1].trackIds)
				expect(computeRefs).toHaveBeenCalledWith(savedModels[2].trackIds)
				expect(computeRefs).toHaveBeenCalledTimes(3)
			})

			it('updates existing model and appends track ids and refs', async () => {
				const model: PartialWithReq<TestModel, 'id'> = {
					...models[1],
					media: '',
					refs: undefined,
					mtimeMs: 0,
					trackIds: [faker.number.int(), faker.number.int()]
				}
				const refs = [
					[faker.number.int(), faker.person.fullName()],
					[faker.number.int(), faker.person.fullName()]
				]
				computeRefs.mockResolvedValueOnce(refs)

				const { saved, removedIds } = await tested.save(model)

				const savedModel = {
					...model,
					mtimeMs: 0,
					trackIds: JSON.parse(models[1].trackIds).concat(model.trackIds),
					refs
				}

				expect(saved).toEqual([savedModel])
				expect(removedIds).toEqual([])
				expect(await db(modelName).where({ id: model.id })).toEqual(
					serializedModels([savedModel], tested)
				)
				expect(computeRefs).toHaveBeenCalledWith(savedModel.trackIds)
				expect(computeRefs).toHaveBeenCalledTimes(1)
			})

			it('updates existing model and removes track ids and refs', async () => {
				const model: PartialWithReq<TestModel, 'id' | 'trackIds'> = {
					...models[2],
					refs: undefined,
					mtimeMs: 0,
					removedTrackIds: JSON.parse(models[2].trackIds).slice(1, 2),
					trackIds: [faker.number.int()]
				}
				const refs = [[faker.number.int(), faker.person.fullName()]]
				computeRefs.mockResolvedValueOnce(refs)

				const { saved, removedIds } = await tested.save(model)

				const savedModel = {
					...model,
					mtimeMs: 0,
					removedTrackIds: undefined,
					trackIds: [JSON.parse(models[2].trackIds)[0], model.trackIds[0]],
					refs
				}

				expect(saved).toEqual([savedModel])
				expect(removedIds).toEqual([])
				expect(await db(modelName).where({ id: model.id })).toEqual(
					serializedModels([savedModel], tested)
				)
				expect(computeRefs).toHaveBeenCalledWith(savedModel.trackIds)
				expect(computeRefs).toHaveBeenCalledTimes(1)
			})

			it('updates existing and removes duplicates', async () => {
				const model: PartialWithReq<TestModel, 'id'> = {
					...models[2],
					trackIds: JSON.parse(models[2].trackIds)
				} as unknown as TestModel
				const refs = null
				computeRefs.mockResolvedValueOnce(refs)

				const { saved, removedIds } = await tested.save(model)

				expect(saved).toEqual([
					{
						...model,
						mtimeMs: null,
						refs
					}
				])
				expect(removedIds).toEqual([])
				expect(await db(modelName).where({ id: model.id })).toEqual(
					serializedModels([{ ...model, refs, mtimeMs: null }], tested)
				)
				expect(computeRefs).toHaveBeenCalledWith(model.trackIds)
				expect(computeRefs).toHaveBeenCalledTimes(1)
			})

			it('deletes models which track ids are empty', async () => {
				const model = {
					id: models[1].id,
					removedTrackIds: JSON.parse(models[1].trackIds)
				} as unknown as TestModel

				const { saved, removedIds } = await tested.save(model)

				expect(saved).toEqual([])
				expect(removedIds).toEqual([models[1].id])
				expect(await db(modelName).where({ id: model.id })).toEqual([])
			})
		})
	}
)
