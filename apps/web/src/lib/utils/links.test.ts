import { faker } from '@faker-js/faker'
import type { Reference } from '@melodie/common/utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { translate } from '../tests/translate'
import { wrapWithLinks } from './links'

describe('link utilities', () => {
	beforeEach(() => vi.clearAllMocks())

	it('wraps references with links of a given kind', async () => {
		const refs: Reference[] = [
			[faker.number.int(), faker.music.artist()],
			[faker.number.int(), faker.music.artist()]
		]
		const kind = faker.helpers.arrayElement(['album', 'artist'])
		const results = wrapWithLinks(kind, refs)
		for (const [i, [id, name]] of refs.entries()) {
			expect(results[i]).toEqual(`<a
    onclick="event.stopPropagation()"
    href="/${kind}s/${id}"
    class="underlined">${name}</a>`)
		}
	})

	it('handles unknown names', async () => {
		const refs: Reference[] = [[faker.number.int(), null]]
		const kind = faker.helpers.arrayElement(['album', 'artist'])
		const results = wrapWithLinks(kind, refs)
		for (const [i, [id]] of refs.entries()) {
			expect(results[i]).toEqual(`<a
    onclick="event.stopPropagation()"
    href="/${kind}s/${id}"
    class="underlined">${translate('unknown')}</a>`)
		}
	})

	it('adds specific class', async () => {
		const refs: Reference[] = [[faker.number.int(), faker.music.artist()]]
		const kind = faker.helpers.arrayElement(['album', 'artist'])
		const className = faker.lorem.word()

		const results = wrapWithLinks(kind, refs, className)
		for (const [i, [id, name]] of refs.entries()) {
			expect(results[i]).toEqual(`<a
    onclick="event.stopPropagation()"
    href="/${kind}s/${id}"
    class="${className} underlined">${name}</a>`)
		}
	})
})
