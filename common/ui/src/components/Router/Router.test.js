'use strict'

import { screen, render } from '@testing-library/svelte'
import faker from 'faker'
import html from 'svelte-htm'
import Router from './Router.svelte'
import { translate } from '../../tests'
import * as search from '../../stores/search'
import * as albums from '../../stores/albums'
import * as artists from '../../stores/artists'
import * as playlists from '../../stores/playlists'
import { albumData } from '../Album/Album.stories'
import { artistData } from '../Artist/Artist.stories'
import { playlistData } from '../Playlist/Playlist.stories'
import { sleep, mockInvoke } from '../../tests'

jest.mock('../../stores/albums', () => {
  const { Subject, BehaviorSubject } = require('rxjs')
  return {
    list: jest.fn(),
    load: jest.fn(),
    changes: new Subject(),
    removals: new Subject(),
    isListing: new BehaviorSubject(false),
    albums: new BehaviorSubject([])
  }
})
jest.mock('../../stores/artists', () => {
  const { Subject, BehaviorSubject } = require('rxjs')
  return {
    list: jest.fn(),
    load: jest.fn(),
    changes: new Subject(),
    removals: new Subject(),
    isListing: new BehaviorSubject(false),
    artists: new BehaviorSubject([])
  }
})
jest.mock('../../stores/playlists', () => {
  const { Subject, BehaviorSubject } = require('rxjs')
  return {
    list: jest.fn(),
    load: jest.fn(),
    changes: new Subject(),
    removals: new Subject(),
    isListing: new BehaviorSubject(false),
    playlists: new BehaviorSubject([])
  }
})
jest.mock('../../stores/search', () => {
  const { BehaviorSubject } = require('rxjs')
  return {
    current: new BehaviorSubject(''),
    total: new BehaviorSubject(0),
    tracks: new BehaviorSubject([]),
    albums: new BehaviorSubject([]),
    artists: new BehaviorSubject([])
  }
})
jest.mock('../../stores/settings', () => {
  const { BehaviorSubject } = require('rxjs')
  return {
    settings: new BehaviorSubject({
      locale: 'en',
      folders: [],
      providers: { audiodb: {}, discogs: {} },
      enqueueBehaviour: { clearBefore: false, onClick: true }
    }),
    saveLocale: jest.fn()
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
    scrollable.scroll = jest.fn()
    jest.clearAllMocks()
  })

  it('renders album list', async () => {
    location.hash = '#/album'
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(
      screen.queryByText(translate('_ albums', { total: 0 }))
    ).toBeVisible()
  })

  it('renders album details', async () => {
    albums.load.mockResolvedValue(albumData)
    location.hash = `#/album/${albumData.id}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(screen.queryByText(albumData.name)).toBeVisible()
  })

  it('renders artist list', async () => {
    location.hash = '#/artist'
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(
      screen.queryByText(translate('_ artists', { total: 0 }))
    ).toBeVisible()
  })

  it('renders artist details', async () => {
    artists.load.mockResolvedValue({ ...artistData, tracks: [] })
    location.hash = `#/artist/${artistData.id}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(screen.queryByText(artistData.name)).toBeVisible()
  })

  it('renders playlist list', async () => {
    location.hash = '#/playlist'
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(
      screen.queryByText(translate('_ playlists', { total: 0 }))
    ).toBeVisible()
  })

  it('renders playlist details', async () => {
    playlists.load.mockResolvedValue(playlistData)
    location.hash = `#/playlist/${playlistData.id}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(screen.queryByText(playlistData.name)).toBeVisible()
  })

  it('renders search results', async () => {
    const searched = faker.lorem.word()
    search.current.next(searched)
    location.hash = `#/search/${searched}`
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(
      screen.queryByText(translate('results for _', { searched }))
    ).toBeVisible()
  })

  it('renders settings', async () => {
    mockInvoke.mockResolvedValue({})
    location.hash = `#/settings`
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(screen.queryByText(translate('settings'))).toBeVisible()
  })

  it('defaults to album list', async () => {
    location.hash = '#/unsupported'
    render(html`<${Router} scrollable=${scrollable} />`)
    await sleep()
    expect(
      screen.queryByText(translate('_ albums', { total: 0 }))
    ).toBeVisible()
  })

  it.todo('memorizes scroll position')
})
