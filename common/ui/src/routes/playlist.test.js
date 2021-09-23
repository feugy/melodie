'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import playlistRoute from './playlist.svelte'
import { playlists as mockedPlaylists, list } from '../stores/playlists'
import { translate, makeRef } from '../tests'

jest.mock('svelte-spa-router')
jest.mock('../stores/playlists')

describe('playlist route', () => {
  beforeEach(jest.resetAllMocks)

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
          id: faker.datatype.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          trackIds: [
            faker.datatype.number(),
            faker.datatype.number(),
            faker.datatype.number()
          ],
          refs: [faker.name.findName(), faker.name.findName()].map(makeRef)
        },
        {
          id: faker.datatype.uuid(),
          name: faker.commerce.productName(),
          media: faker.image.avatar(),
          trackIds: [
            faker.datatype.number(),
            faker.datatype.number(),
            faker.datatype.number(),
            faker.datatype.number(),
            faker.datatype.number()
          ],
          refs: [makeRef(faker.name.findName())]
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
