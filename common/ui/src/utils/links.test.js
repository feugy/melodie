import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { translate } from '../tests'
import { wrapWithLinks } from './links'

describe('link utilities', () => {
  beforeEach(vi.clearAllMocks)

  it('wraps references with links of a given kind', async () => {
    const refs = [
      [faker.number.int(), faker.person.firstName()],
      [faker.number.int(), faker.person.firstName()]
    ]
    const kind = faker.helpers.arrayElement(['album', 'artist'])
    const results = wrapWithLinks(kind, refs)
    for (const [i, [id, name]] of refs.entries()) {
      expect(results[i]).toEqual(
        expect.stringContaining(`<a
    onclick="event.stopPropagation()"
    href="#/${kind}/${id}"
    class="underlined">${name}</a>`)
      )
    }
  })

  it('handles unknown names', async () => {
    const refs = [[faker.number.int(), null]]
    const kind = faker.helpers.arrayElement(['album', 'artist'])
    const results = wrapWithLinks(kind, refs)
    for (const [i, [id]] of refs.entries()) {
      expect(results[i]).toEqual(
        expect.stringContaining(`<a
    onclick="event.stopPropagation()"
    href="#/${kind}/${id}"
    class="underlined">${translate('unknown')}</a>`)
      )
    }
  })

  it('adds specific class', async () => {
    const refs = [[faker.number.int(), faker.person.firstName()]]
    const kind = faker.helpers.arrayElement(['album', 'artist'])
    const className = faker.lorem.word()

    const results = wrapWithLinks(kind, refs, className)
    for (const [i, [id, name]] of refs.entries()) {
      expect(results[i]).toEqual(
        expect.stringContaining(`<a
    onclick="event.stopPropagation()"
    href="#/${kind}/${id}"
    class="${className} underlined">${name}</a>`)
      )
    }
  })
})
