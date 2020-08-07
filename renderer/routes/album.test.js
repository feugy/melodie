'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import albumRoute from './album.svelte'
import { albums as mockedAlbums, load, list } from '../stores/albums'
import { add } from '../stores/track-queue'
import { translate, sleep } from '../tests'

jest.mock('svelte-spa-router')
jest.mock('../stores/track-queue')
jest.mock('../stores/albums', () => ({
  albums: {},
  load: jest.fn(),
  list: jest.fn()
}))

describe('album route', () => {
  const albums = []

  beforeEach(() => {
    location.hash = '#/album'
    albums.splice(
      0,
      albums.length,
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar(),
        linked: [faker.name.findName(), faker.name.findName()]
      },
      {
        id: faker.random.uuid(),
        name: faker.commerce.productName(),
        media: faker.image.avatar(),
        linked: [faker.name.findName()]
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
    expect(list).not.toHaveBeenCalled()
  })

  it('loads and play tracks of an album', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      album.tracks = tracks
      return album
    })
    const album = albums[0]

    render(html`<${albumRoute} />`)
    const play = screen
      .getByText(album.name)
      .closest('article')
      .querySelector('[data-testid="play"]')
    await fireEvent.click(play)

    expect(load).toHaveBeenCalledWith(album.id)
    expect(add).toHaveBeenCalledWith(tracks, true)
  })

  it('loads and enqueus tracks of an album', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      album.tracks = tracks
      return album
    })
    const album = albums[0]

    render(html`<${albumRoute} />`)
    const enqueue = screen
      .getByText(album.name)
      .closest('article')
      .querySelector('[data-testid="enqueue"]')
    await fireEvent.click(enqueue)

    expect(load).toHaveBeenCalledWith(album.id)
    expect(add).toHaveBeenCalledWith(tracks, false)
  })

  it('does not load tracks when already there', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    const album = albums[0]
    album.tracks = tracks

    render(html`<${albumRoute} />`)
    const play = screen
      .getByText(album.name)
      .closest('article')
      .querySelector('button')
    await fireEvent.click(play)

    expect(load).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
  })

  it('navigates to album details page', async () => {
    const album = albums[1]

    render(html`<${albumRoute} />`)
    const album2 = screen.getByText(album.name)
    await fireEvent.click(album2)
    await sleep()

    expect(location.hash).toEqual(`#/album/${album.id}`)
    expect(load).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })
})
