'use strict'

import { tick } from 'svelte'
import { render, screen } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import searchRoute from './[searched].svelte'
import { artists, albums, tracks, search } from '../../stores/search'
import { artistData } from '../../components/Artist/Artist.stories'
import { albumData } from '../../components/Album/Album.stories'
import { tracksData } from '../../components/TracksTable/TracksTable.stories'
import { translate } from '../../tests'

jest.mock('svelte-spa-router')
jest.mock('../../stores/search', () => {
  const { Subject } = require('rxjs')
  return {
    search: jest.fn(),
    albums: new Subject(),
    artists: new Subject(),
    tracks: new Subject()
  }
})

describe('search results route', () => {
  const searched = faker.lorem.word()

  const albumsData = Array.from({ length: 5 }, (_, id) => ({
    ...albumData,
    name: `${albumData.name}-${id}`,
    id
  }))
  const artistsData = Array.from({ length: 3 }, (_, id) => ({
    ...artistData,
    name: `${artistData.name}-${id}`,
    id
  }))

  it('handles no results', async () => {
    const artists$ = new BehaviorSubject([])
    artists.subscribe = artists$.subscribe.bind(artists$)
    const albums$ = new BehaviorSubject([])
    albums.subscribe = albums$.subscribe.bind(albums$)
    const tracks$ = new BehaviorSubject([])
    tracks.subscribe = tracks$.subscribe.bind(tracks$)

    render(html`<${searchRoute} params=${{ searched }} />`)
    await tick()

    expect(screen.queryByText(translate('_ albums', { total: 0 }))).toBeNull()
    expect(screen.queryByText(translate('_ artists', { total: 0 }))).toBeNull()
    expect(screen.queryByText(translate('_ tracks', { total: 0 }))).toBeNull()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.queryByText(translate('no results'))).toBeDefined()
  })

  it('triggers search with escapted characters', async () => {
    const searched = 'é < à'
    const artists$ = new BehaviorSubject([])
    artists.subscribe = artists$.subscribe.bind(artists$)
    const albums$ = new BehaviorSubject([])
    albums.subscribe = albums$.subscribe.bind(albums$)
    const tracks$ = new BehaviorSubject([])
    tracks.subscribe = tracks$.subscribe.bind(tracks$)

    render(
      html`<${searchRoute}
        params=${{ searched: encodeURIComponent(searched) }}
      />`
    )
    await tick()

    expect(search).toHaveBeenCalledWith(searched)
    expect(
      screen.queryByText(translate('results for _', { searched }))
    ).toBeInTheDocument()
  })

  describe('given results', () => {
    beforeEach(async () => {
      const artists$ = new BehaviorSubject(artistsData)
      artists.subscribe = artists$.subscribe.bind(artists$)
      const albums$ = new BehaviorSubject(albumsData)
      albums.subscribe = albums$.subscribe.bind(albums$)
      const tracks$ = new BehaviorSubject(tracksData)
      tracks.subscribe = tracks$.subscribe.bind(tracks$)
      jest.resetAllMocks()

      render(html`<${searchRoute} params=${{ searched }} />`)
      await tick()

      expect(search).toHaveBeenCalledWith(searched)
    })

    it('triggers search on load', async () => {
      expect(search).toHaveBeenCalledWith(searched)
      expect(
        screen.queryByText(translate('results for _', { searched }))
      ).toBeInTheDocument()
    })

    it('displays found tracks, albums and artists', async () => {
      expect(
        screen.queryByText(translate('_ albums', { total: albumsData.length }))
      ).toBeDefined()
      for (const { name } of albumsData) {
        expect(screen.queryByText(name)).not.toBeNull()
      }

      expect(
        screen.queryByText(
          translate('_ artists', { total: artistsData.length })
        )
      ).toBeDefined()
      for (const { name } of artistsData) {
        expect(screen.queryByText(name)).not.toBeNull()
      }

      expect(
        screen.queryByText(translate('_ tracks', { total: tracksData.length }))
      ).toBeDefined()
      for (const {
        tags: { title }
      } of tracksData) {
        expect(screen.queryByText(title)).not.toBeNull()
      }
    })
  })
})
