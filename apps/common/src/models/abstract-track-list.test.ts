import type { Database } from 'bun:sqlite'
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	mock
} from 'bun:test'
import { faker } from '@faker-js/faker'
import ms from 'ms'
import { cleanTestTB, initTestDB, serializedModels } from '../tests/database.ts'
import type { DBConf, PartialWithReq } from '../types.ts'
import type { Reference } from '../utils/refs.ts'
import { buildUpsert, whereIn } from '../utils/sqlite.ts'
import { AbstractTrackList } from './abstract-track-list.ts'

const modelName = 'test'

const computeRefs = mock()

interface TestModel {
	id: number
	trackIds: number[]
	refs: Reference[]
	removedTrackIds?: number[]
	name?: string
	media: string | null
	mediaCount: number
	mtimeMs: number
}

class Test extends AbstractTrackList<TestModel> {
	constructor() {
		super({ name: modelName })
	}

	computeRefs<Record extends {}, Result>(ids: number[]) {
		return computeRefs(ids)
	}
}

describe('Abstract track list', () => {
	let db: Database
	let conf: DBConf
	const tested = new Test()
	const lastProcessed = Date.now() - ms('1d')
	const models = [
		{
			id: faker.number.int(),
			name: faker.person.fullName(),
			media: null,
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
			]),
			mtimeMs: 0
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
			]),
			mtimeMs: 0
		},
		{
			id: faker.number.int(),
			name: faker.person.fullName(),
			media: null,
			mediaCount: 0,
			trackIds: JSON.stringify([]),
			refs: JSON.stringify([]),
			mtimeMs: lastProcessed
		}
	]

	beforeAll(async () => {
		;({ conf, db } = await initTestDB())
		db.exec(
			`CREATE TABLE ${modelName} (
					id BIGINT PRIMARY KEY, 
					name TEXT, 
					mtimeMs FLOAT,
					media TEXT NULLABLE, 
					mediaCount INTEGER DEFAULT 1, 
					trackIds JSON, 
					refs JSON
				)`
		)
		await tested.init(conf)
	})

	beforeEach(async () => {
		computeRefs.mockClear()
		await tested.reset()
		const insert = db.prepare(buildUpsert(modelName, models))
		db.transaction(models => {
			for (const model of models) {
				insert.run(model)
			}
		})(models)
	})

	afterAll(async () => {
		await Test.release()
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
					media: null,
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
			computeRefs.mockReturnValueOnce(refs)
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
			expect(
				db
					.query(`SELECT * FROM ${modelName} WHERE id = :id`)
					.all({ id: model.id })
			).toEqual(serializedModels([{ ...savedModel, media: null }], tested))
			expect(computeRefs).toHaveBeenCalledWith(model.trackIds)
			expect(computeRefs).toHaveBeenCalledTimes(1)
		})

		it('saves multiple models', async () => {
			const refs1 = [[faker.number.int(), faker.person.fullName()]]
			const refs2 = [[faker.number.int(), faker.person.fullName()]]
			computeRefs.mockReturnValueOnce(refs1).mockReturnValueOnce(refs2)
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
			expect(
				db
					.query(`SELECT * FROM ${modelName} WHERE ${whereIn('id', models)}`)
					.all(...models.map(({ id }) => id))
			).toEqual(
				expect.arrayContaining(
					serializedModels(
						savedModels.map(model => ({ ...model, media: null })),
						tested
					)
				)
			)
			expect(computeRefs).toHaveBeenCalledWith(models[0].trackIds)
			expect(computeRefs).toHaveBeenCalledWith(models[1].trackIds)
			expect(computeRefs).toHaveBeenCalledTimes(2)
		})

		it('updates multipe models with sparse data', async () => {
			const refs = [[faker.number.int(), faker.person.fullName()]]
			computeRefs.mockReturnValue(refs)
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
					media: undefined,
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
			expect(
				db
					.query(
						`SELECT * FROM ${modelName} WHERE ${whereIn('id', savedModels)}`
					)
					.all(...savedModels.map(({ id }) => id))
			).toEqual(
				expect.arrayContaining(
					serializedModels(
						savedModels.map((model, i) =>
							i === 2 ? { ...model, media: null } : model
						),
						tested
					)
				)
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
			computeRefs.mockReturnValueOnce(refs)

			const { saved, removedIds } = await tested.save(model)

			const savedModel = {
				...model,
				mtimeMs: 0,
				trackIds: JSON.parse(models[1].trackIds).concat(model.trackIds),
				refs
			}

			expect(saved).toEqual([savedModel])
			expect(removedIds).toEqual([])
			expect(
				db
					.query(`SELECT * FROM ${modelName} WHERE id = :id`)
					.all({ id: model.id })
			).toEqual(serializedModels([savedModel], tested))
			expect(computeRefs).toHaveBeenCalledWith(savedModel.trackIds)
			expect(computeRefs).toHaveBeenCalledTimes(1)
		})

		it('updates existing model and removes track ids and refs', async () => {
			const model: PartialWithReq<TestModel, 'id' | 'trackIds'> = {
				...models[2],
				media: models[2].media as string,
				refs: undefined,
				mtimeMs: 0,
				removedTrackIds: JSON.parse(models[2].trackIds).slice(1, 2),
				trackIds: [faker.number.int()]
			}
			const refs = [[faker.number.int(), faker.person.fullName()]]
			computeRefs.mockReturnValueOnce(refs)

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
			expect(
				db
					.query(`SELECT * FROM ${modelName} WHERE id = :id`)
					.all({ id: model.id })
			).toEqual(serializedModels([savedModel], tested))
			expect(computeRefs).toHaveBeenCalledWith(savedModel.trackIds)
			expect(computeRefs).toHaveBeenCalledTimes(1)
		})

		it('updates existing and removes duplicates', async () => {
			const model: PartialWithReq<TestModel, 'id'> = {
				...models[2],
				trackIds: JSON.parse(models[2].trackIds)
			} as unknown as TestModel
			const refs = null
			computeRefs.mockReturnValueOnce(refs)

			const { saved, removedIds } = await tested.save(model)

			expect(saved).toEqual([{ ...model, refs }])
			expect(removedIds).toEqual([])
			expect(
				db
					.query(`SELECT * FROM ${modelName} WHERE id = :id`)
					.all({ id: model.id })
			).toEqual(serializedModels([{ ...model, refs }], tested))
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
			expect(
				db
					.query(`SELECT * FROM ${modelName} WHERE id = :id`)
					.all({ id: model.id })
			).toEqual([])
		})
	})
})
