import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { list, playlists as mockedPlaylists } from '../stores/playlists'
import { makeRef, translate } from '../tests'
import playlistRoute from './playlist.svelte'

vi.mock('svelte-spa-router')
vi.mock('../stores/playlists')

describe('playlist route', () => {
  beforeEach(() => vi.resetAllMocks())

  it('handles no playlists', async () => {
    const store = new BehaviorSubject([])
    mockedPlaylists.subscribe = store.subscribe.bind(store)

    render(html`<${playlistRoute} />`)

    expect(
      screen.getByText(translate('_ playlists', { total: 0 }))
    ).toBeInTheDocument()
    const text = translate('how to create playlist')
    expect(
      screen.getByText(
        (content, element) => element.tagName === 'P' && text.includes(content)
      )
    ).toBeInTheDocument()
    expect(list).toHaveBeenCalled()
  })

  describe('given some playlists', () => {
    const playlists = []

    beforeEach(() => {
      location.hash = '#/album'
      playlists.splice(
        0,
        playlists.length,
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          trackIds: [
            faker.number.int(),
            faker.number.int(),
            faker.number.int()
          ],
          refs: [faker.person.firstName(), faker.person.firstName()].map(
            makeRef
          )
        },
        {
          id: faker.string.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          trackIds: [
            faker.number.int(),
            faker.number.int(),
            faker.number.int(),
            faker.number.int(),
            faker.number.int()
          ],
          refs: [makeRef(faker.person.firstName())]
        }
      )
      const store = new BehaviorSubject(playlists)
      mockedPlaylists.subscribe = store.subscribe.bind(store)
    })

    it('displays all playlists', async () => {
      render(html`<${playlistRoute} />`)

      expect(
        screen.getByText(translate('_ playlists', { total: playlists.length }))
      ).toBeInTheDocument()
      expect(screen.getByText(playlists[0].name)).toBeInTheDocument()
      expect(screen.getByText(playlists[1].name)).toBeInTheDocument()
      expect(list).not.toHaveBeenCalled()
    })
  })
})
