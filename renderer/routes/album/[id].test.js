'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import albumRoute from './[id].svelte'
import { albums as mockedAlbums, loadTracks } from '../../stores/albums'
import trackList from '../../stores/track-list'
import { translate, sleep } from '../../tests'

jest.mock('svelte-spa-router')
jest.mock('../../stores/track-list')
jest.mock('../../stores/albums', () => ({
  albums: {},
  loadTracks: jest.fn()
}))

describe('album details route', () => {
  const album = {
    id: faker.random.number(),
    name: faker.commerce.productName(),
    media: faker.image.avatar()
  }

  const tracks = [
    {
      id: faker.random.uuid(),
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()],
        album: faker.lorem.word()
      }
    },
    {
      id: faker.random.uuid(),
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()],
        album: faker.lorem.word()
      }
    },
    {
      id: faker.random.uuid(),
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()],
        album: faker.lorem.word()
      }
    }
  ]

  function expectDisplayedTracks() {
    expect(screen.getByText(album.name)).toBeInTheDocument()
    const image = screen.getByRole('img')
    expect(image).toBeInTheDocument()
    // eslint-disable-next-line jest-dom/prefer-to-have-attribute
    expect(image.getAttribute('src')).toEqual(album.media)
    for (const track of tracks) {
      expect(screen.getByText(track.tags.artists[0])).toBeInTheDocument()
      expect(screen.getByText(track.tags.album)).toBeInTheDocument()
      expect(screen.getByText(track.tags.title)).toBeInTheDocument()
    }
  }

  beforeEach(() => {
    const store = new BehaviorSubject([album])
    mockedAlbums.subscribe = store.subscribe.bind(store)
    jest.resetAllMocks()
  })

  it('loads tracks and display them', async () => {
    loadTracks.mockImplementation(async () => {
      album.tracks = tracks
    })

    render(html`<${albumRoute} params=${{ id: album.id }} />`)

    expect(loadTracks).toHaveBeenCalledWith(album)
    expectDisplayedTracks()
  })

  it('does not load tracks when available', async () => {
    album.tracks = tracks
    render(html`<${albumRoute} params=${{ id: album.id }} />`)

    expect(loadTracks).not.toHaveBeenCalled()
    expectDisplayedTracks()
  })

  it('enqueues whole album', async () => {
    album.tracks = tracks
    render(html`<${albumRoute} params=${{ id: album.id }} />`)

    await fireEvent.click(screen.getByText(translate('enqueue all')))

    expect(trackList.add).toHaveBeenCalledWith(tracks)
    expect(trackList.add).toHaveBeenCalledTimes(1)
  })

  it('plays whole album', async () => {
    album.tracks = tracks
    render(html`<${albumRoute} params=${{ id: album.id }} />`)

    await fireEvent.click(screen.getByText(translate('play all')))

    expect(trackList.add).toHaveBeenCalledWith(tracks, true)
    expect(trackList.add).toHaveBeenCalledTimes(1)
  })

  it('enqueues clicked tracks', async () => {
    album.tracks = tracks
    render(html`<${albumRoute} params=${{ id: album.id }} />`)

    await fireEvent.click(screen.getByText(tracks[1].tags.title))

    await sleep(250)
    expect(trackList.add).toHaveBeenCalledWith(tracks[1])
    expect(trackList.add).toHaveBeenCalledTimes(1)
  })

  it('plays double-clicked tracks', async () => {
    album.tracks = tracks
    render(html`<${albumRoute} params=${{ id: album.id }} />`)

    const row = screen.getByText(tracks[2].tags.title)

    // TODO test glitch: without 3 event, double click isn't detected
    await fireEvent.click(row)
    await fireEvent.click(row)
    await fireEvent.click(row)

    await sleep(250)
    expect(trackList.add).toHaveBeenCalledWith(tracks[2], true)
    expect(trackList.add).toHaveBeenCalledTimes(2)
  })

  it('plays tracks on play button', async () => {
    album.tracks = tracks
    render(html`<${albumRoute} params=${{ id: album.id }} />`)

    await fireEvent.click(
      screen
        .getByText(tracks[0].tags.title)
        .closest('tr')
        .querySelector('button')
    )

    expect(trackList.add).toHaveBeenCalledWith(tracks[0], true)
    expect(trackList.add).toHaveBeenCalledTimes(1)
  })
})
