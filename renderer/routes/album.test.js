'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { push } from 'svelte-spa-router'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import albumRoute from './album.svelte'
import { albums as mockedAlbums, loadTracks } from '../stores/albums'
import { add } from '../stores/track-queue'
import { translate } from '../tests'

jest.mock('svelte-spa-router')
jest.mock('../stores/track-queue')
jest.mock('../stores/albums', () => ({
  albums: {},
  loadTracks: jest.fn()
}))

describe('album route', () => {
  const albums = []

  beforeEach(() => {
    albums.splice(
      0,
      albums.length,
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar()
      },
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar()
      }
    )
    const store = new BehaviorSubject(albums)
    mockedAlbums.subscribe = store.subscribe.bind(store)
    jest.resetAllMocks()
  })

  it('displays all albums', async () => {
    render(html`<${albumRoute} />`)

    expect(
      screen.getByText(translate('_ albums', { total: albums.length }))
    ).toBeInTheDocument()
    expect(screen.getByText(albums[0].name)).toBeInTheDocument()
    expect(screen.getByText(albums[1].name)).toBeInTheDocument()
  })

  it('loads tracks and plays album', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    loadTracks.mockImplementation(async () => {
      album.tracks = tracks
    })
    const album = albums[0]

    render(html`<${albumRoute} />`)
    // TODO find a way to trigger `play` component event instead
    const albumPlay = screen
      .getByText(album.name)
      .closest('article')
      .querySelector('[data-testid="play"]')
    await fireEvent.click(albumPlay)

    expect(loadTracks).toHaveBeenCalledWith(album)
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(push).not.toHaveBeenCalled()
  })

  it('loads tracks and enqueues album', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    loadTracks.mockImplementation(async () => {
      album.tracks = tracks
    })
    const album = albums[0]

    render(html`<${albumRoute} />`)
    // TODO find a way to trigger `enqueue` component event instead
    const albumEnqueue = screen
      .getByText(album.name)
      .closest('article')
      .querySelector('[data-testid="enqueue"]')
    await fireEvent.click(albumEnqueue)

    expect(loadTracks).toHaveBeenCalledWith(album)
    expect(add).toHaveBeenCalledWith(tracks, false)
    expect(push).not.toHaveBeenCalled()
  })

  it('does load tracks when already there', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    const album = albums[0]
    album.tracks = tracks

    render(html`<${albumRoute} />`)
    // TODO find a way to trigger `play` component event instead
    const albumPlay = screen
      .getByText(album.name)
      .closest('article')
      .querySelector('button')
    await fireEvent.click(albumPlay)

    expect(loadTracks).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(push).not.toHaveBeenCalled()
  })

  it('navigates to album details page', async () => {
    const album = albums[1]

    render(html`<${albumRoute} />`)
    const album2 = screen.getByText(album.name)
    // TODO find a way to trigger `select` component event instead
    await fireEvent.click(album2)

    expect(push).toHaveBeenCalledWith(`/album/${album.id}`)
    expect(loadTracks).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })
})
