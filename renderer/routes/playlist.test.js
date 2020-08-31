'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import playlistRoute from './playlist.svelte'
import { playlists as mockedPlaylists } from '../stores/playlists'
import { translate, makeRef } from '../tests'

jest.mock('svelte-spa-router')
jest.mock('../stores/playlists')

describe('playlist route', () => {
  it('handles no playlists', async () => {
    const store = new BehaviorSubject([])
    mockedPlaylists.subscribe = store.subscribe.bind(store)

    render(html`<${playlistRoute} />`)

    expect(
      screen.getByText(translate('_ playlists', { total: 0 }))
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        translate('how to create playlist').replace(/<.+>/, ''),
        {
          exact: false
        }
      )
    ).toBeInTheDocument()
  })

  describe('given some playlists', () => {
    const playlists = []

    beforeEach(() => {
      location.hash = '#/album'
      playlists.splice(
        0,
        playlists.length,
        {
          id: faker.random.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          trackIds: [
            faker.random.number(),
            faker.random.number(),
            faker.random.number()
          ],
          refs: [faker.name.findName(), faker.name.findName()].map(makeRef)
        },
        {
          id: faker.random.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          trackIds: [
            faker.random.number(),
            faker.random.number(),
            faker.random.number(),
            faker.random.number(),
            faker.random.number()
          ],
          refs: [makeRef(faker.name.findName())]
        }
      )
      const store = new BehaviorSubject(playlists)
      mockedPlaylists.subscribe = store.subscribe.bind(store)
      jest.resetAllMocks()
    })

    it('displays all playlists', async () => {
      render(html`<${playlistRoute} />`)

      expect(
        screen.getByText(translate('_ playlists', { total: playlists.length }))
      ).toBeInTheDocument()
      expect(screen.getByText(playlists[0].name)).toBeInTheDocument()
      expect(screen.getByText(playlists[1].name)).toBeInTheDocument()
    })
  })
})
