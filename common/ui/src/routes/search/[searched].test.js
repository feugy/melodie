import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import { tick } from 'svelte'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { albumData } from '../../components/Album/Album.testdata'
import { artistData } from '../../components/Artist/Artist.testdata'
import { tracksData } from '../../components/TracksTable/TracksTable.testdata'
import { albums, artists, current, search, tracks } from '../../stores/search'
import { translate } from '../../tests'
import searchRoute from './[searched].svelte'

vi.mock('svelte-spa-router')
vi.mock('../../stores/playlists')
vi.mock('../../stores/search', () => {
  const { Subject, BehaviorSubject } = require('rxjs')
  return {
    search: vi.fn(),
    albums: new Subject(),
    artists: new Subject(),
    tracks: new Subject(),
    current: new Subject(),
    total: new BehaviorSubject(0)
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

  beforeEach(() => vi.resetAllMocks())

  it('handles no results', async () => {
    const artists$ = new BehaviorSubject([])
    artists.subscribe = artists$.subscribe.bind(artists$)
    const albums$ = new BehaviorSubject([])
    albums.subscribe = albums$.subscribe.bind(albums$)
    const tracks$ = new BehaviorSubject([])
    tracks.subscribe = tracks$.subscribe.bind(tracks$)
    const current$ = new BehaviorSubject()
    current.subscribe = current$.subscribe.bind(current$)

    render(html`<${searchRoute} params=${{ searched }} />`)

    expect(await screen.findByText(translate('no results'))).toBeInTheDocument()
    expect(
      screen.queryByText(translate('_ albums', { total: 0 }))
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(translate('_ artists', { total: 0 }))
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(translate('_ tracks', { total: 0 }))
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('triggers search with escapted characters', async () => {
    const searched = 'é < à'
    const artists$ = new BehaviorSubject([])
    artists.subscribe = artists$.subscribe.bind(artists$)
    const albums$ = new BehaviorSubject([])
    albums.subscribe = albums$.subscribe.bind(albums$)
    const tracks$ = new BehaviorSubject([])
    tracks.subscribe = tracks$.subscribe.bind(tracks$)
    const current$ = new BehaviorSubject()
    current.subscribe = current$.subscribe.bind(current$)

    render(
      html`<${searchRoute}
        params=${{ searched: encodeURIComponent(searched) }}
      />`
    )
    await tick()

    expect(search).toHaveBeenCalledWith(searched)
    expect(
      screen.getByText(translate('results for _', { searched }))
    ).toBeInTheDocument()
  })

  it('does not trigger search when matching current', async () => {
    const artists$ = new BehaviorSubject([])
    artists.subscribe = artists$.subscribe.bind(artists$)
    const albums$ = new BehaviorSubject([])
    albums.subscribe = albums$.subscribe.bind(albums$)
    const tracks$ = new BehaviorSubject([])
    tracks.subscribe = tracks$.subscribe.bind(tracks$)
    const current$ = new BehaviorSubject(searched)
    current.subscribe = current$.subscribe.bind(current$)

    render(html`<${searchRoute} params=${{ searched }} />`)
    await tick()

    expect(search).not.toHaveBeenCalled()
    expect(
      screen.getByText(translate('results for _', { searched }))
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
      const current$ = new BehaviorSubject()
      current.subscribe = current$.subscribe.bind(current$)

      render(html`<${searchRoute} params=${{ searched }} />`)
      await tick()

      expect(search).toHaveBeenCalledWith(searched)
    })

    it('triggers search on load', async () => {
      expect(search).toHaveBeenCalledWith(searched)
      expect(
        screen.getByText(translate('results for _', { searched }))
      ).toBeInTheDocument()
    })

    it('displays found tracks, albums and artists', async () => {
      expect(
        screen.getByText(translate('_ albums', { total: albumsData.length }))
      ).toBeInTheDocument()
      for (const { name } of albumsData) {
        expect(screen.getByText(name)).toBeInTheDocument()
      }

      expect(
        screen.getByText(translate('_ artists', { total: artistsData.length }))
      ).toBeInTheDocument()
      for (const { name } of artistsData) {
        expect(screen.getByText(name)).toBeInTheDocument()
      }

      expect(
        screen.getByText(translate('_ tracks', { total: tracksData.length }))
      ).toBeInTheDocument()
      for (const {
        tags: { title }
      } of tracksData) {
        expect(screen.getByText(title)).toBeInTheDocument()
      }

      expect(screen.getByText(translate('track details'))).not.toBeVisible()
    })

    it('displays track details', async () => {
      await userEvent.click(
        screen
          .queryByText(tracksData[0].tags.title)
          .closest('.root')
          .querySelector('.i-mdi-dots-vertical')
      )
      await userEvent.click(screen.queryByText(translate('show details')))

      expect(screen.getByText(translate('track details'))).toBeVisible()
    })
  })
})
