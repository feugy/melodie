'use strict'

import faker from 'faker'
import { wrapWithLinks } from './links'
import { translate } from '../tests'

describe('link utilities', () => {
  beforeEach(jest.clearAllMocks)

  it('wraps references with links of a given kind', async () => {
    const refs = [
      [faker.random.number(), faker.name.findName()],
      [faker.random.number(), faker.name.findName()]
    ]
    const kind = faker.random.arrayElement(['album', 'artist'])
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
    const refs = [[faker.random.number(), null]]
    const kind = faker.random.arrayElement(['album', 'artist'])
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
    const refs = [[faker.random.number(), faker.name.findName()]]
    const kind = faker.random.arrayElement(['album', 'artist'])
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
