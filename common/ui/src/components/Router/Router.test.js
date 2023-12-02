import { faker } from '@faker-js/faker'
import { render, screen, waitFor } from '@testing-library/svelte'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as albums from '../../stores/albums'
import * as artists from '../../stores/artists'
import * as playlists from '../../stores/playlists'
import * as search from '../../stores/search'
import { translate } from '../../tests'
import { invoke } from '../../utils'
import { albumData } from '../Album/Album.testdata'
import { artistData } from '../Artist/Artist.testdata'
import { playlistData } from '../Playlist/Playlist.testdata'
import Router from './Router.svelte'

vi.mock('../../stores/albums', () => {
  const { Subject, BehaviorSubject } = require('rxjs')
  return {
    list: vi.fn(),
    load: vi.fn(),
    changes: new Subject(),
    removals: new Subject(),
    isListing: new BehaviorSubject(false),
    albums: new BehaviorSubject([])
  }
})
vi.mock('../../stores/artists', () => {
  const { Subject, BehaviorSubject } = require('rxjs')
  return {
    list: vi.fn(),
    load: vi.fn(),
    changes: new Subject(),
    removals: new Subject(),
    isListing: new BehaviorSubject(false),
    artists: new BehaviorSubject([])
  }
})
vi.mock('../../stores/playlists', () => {
  const { Subject, BehaviorSubject } = require('rxjs')
  return {
    list: vi.fn(),
    load: vi.fn(),
    changes: new Subject(),
    removals: new Subject(),
    isListing: new BehaviorSubject(false),
    playlists: new BehaviorSubject([])
  }
})
vi.mock('../../stores/search', () => {
  const { BehaviorSubject } = require('rxjs')
  return {
    current: new BehaviorSubject(''),
    total: new BehaviorSubject(0),
    tracks: new BehaviorSubject([]),
    albums: new BehaviorSubject([]),
    artists: new BehaviorSubject([])
  }
})
vi.mock('../../stores/settings', () => {
  const { BehaviorSubject, Subject } = require('rxjs')
  return {
    askToAddFolder: vi.fn(),
    isDesktop: new BehaviorSubject(true),
    tokenUpdated: new Subject(),
    settings: new BehaviorSubject({
      locale: 'en',
      folders: [],
      providers: { audiodb: {}, discogs: {} },
      enqueueBehaviour: { clearBefore: false, onClick: true }
    }),
    saveLocale: vi.fn()
  }
})

describe('Router component', () => {
  const scrollable = {}

  beforeEach(() => {
    albums.list.mockResolvedValue([])
    artists.list.mockResolvedValue([])
    playlists.list.mockResolvedValue([])
    location.hash = '#/'
    scrollable.scrollTop = 0
    scrollable.scroll = vi.fn()
    vi.clearAllMocks()
  })

  it('renders album list', async () => {
    location.hash = '#/album'
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(
        screen.queryByText(translate('_ albums', { total: 0 }))
      ).toBeVisible()
    )
  })

  it('renders album details', async () => {
    albums.load.mockResolvedValue(albumData)
    location.hash = `#/album/${albumData.id}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(screen.queryByText(albumData.name)).toBeVisible()
    )
  })

  it('renders artist list', async () => {
    location.hash = '#/artist'
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(
        screen.queryByText(translate('_ artists', { total: 0 }))
      ).toBeVisible()
    )
  })

  it('renders artist details', async () => {
    artists.load.mockResolvedValue({ ...artistData, tracks: [] })
    location.hash = `#/artist/${artistData.id}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(screen.queryByText(artistData.name)).toBeVisible()
    )
  })

  it('renders playlist list', async () => {
    location.hash = '#/playlist'
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(
        screen.queryByText(translate('_ playlists', { total: 0 }))
      ).toBeVisible()
    )
  })

  it('renders playlist details', async () => {
    playlists.load.mockResolvedValue(playlistData)
    location.hash = `#/playlist/${playlistData.id}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(screen.queryByText(playlistData.name)).toBeVisible()
    )
  })

  it('renders search results', async () => {
    const searched = faker.lorem.word()
    search.current.next(searched)
    location.hash = `#/search/${searched}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(
        screen.queryByText(translate('results for _', { searched }))
      ).toBeVisible()
    )
  })

  it('renders settings', async () => {
    invoke.mockResolvedValue({})
    location.hash = `#/settings`
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(screen.queryByText(translate('settings'))).toBeVisible()
    )
  })

  it('defaults to album list', async () => {
    location.hash = '#/unsupported'
    render(html`<${Router} scrollable=${scrollable} />`)
    await waitFor(() =>
      expect(
        screen.queryByText(translate('_ albums', { total: 0 }))
      ).toBeVisible()
    )
  })

  it.todo('memorizes scroll position')
})
