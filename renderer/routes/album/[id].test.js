'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import { replace } from 'svelte-spa-router'
import faker from 'faker'
import albumRoute from './[id].svelte'
import {
  albums as mockedAlbums,
  changes,
  removals,
  load
} from '../../stores/albums'
import { add } from '../../stores/track-queue'
import { translate, sleep } from '../../tests'

jest.mock('svelte-spa-router')
jest.mock('../../stores/track-queue', () => ({
  add: jest.fn(),
  current: {
    subscribe: () => ({ unsubscribe: () => {} })
  }
}))
jest.mock('../../stores/albums', () => {
  const { Subject } = require('rxjs')
  return {
    load: jest.fn(),
    changes: new Subject(),
    removals: new Subject(),
    albums: {
      subscribe: () => ({ unsubscribe: () => {} })
    }
  }
})

describe('album details route', () => {
  const album = {
    id: faker.random.number(),
    name: faker.commerce.productName(),
    media: faker.image.avatar(),
    tracks: [
      {
        id: faker.random.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()],
          album: faker.lorem.words()
        }
      },
      {
        id: faker.random.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()],
          album: faker.lorem.words()
        }
      },
      {
        id: faker.random.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()],
          album: faker.lorem.words()
        }
      }
    ]
  }

  function expectDisplayedTracks() {
    expect(screen.getByText(album.name)).toBeInTheDocument()
    const image = screen.getByRole('img')
    expect(image).toBeInTheDocument()
    // eslint-disable-next-line jest-dom/prefer-to-have-attribute
    expect(image.getAttribute('src')).toEqual(album.media)
    for (const track of album.tracks) {
      expect(screen.getByText(track.tags.artists[0])).toBeInTheDocument()
      expect(screen.getByText(track.tags.album)).toBeInTheDocument()
      expect(screen.getByText(track.tags.title)).toBeInTheDocument()
    }
  }

  beforeEach(() => {
    const albums = new BehaviorSubject([album])
    mockedAlbums.subscribe = albums.subscribe.bind(albums)
    jest.resetAllMocks()
  })

  it('redirects to album list on unknown album', async () => {
    load.mockResolvedValueOnce(null)

    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    expect(load).toHaveBeenCalledWith(album.id)
    expect(replace).toHaveBeenCalledWith('/albums')
  })

  it('loads tracks and display them', async () => {
    load.mockResolvedValueOnce(album)

    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    expect(load).toHaveBeenCalledWith(album.id)
    expectDisplayedTracks()
    expect(replace).not.toHaveBeenCalled()
  })

  it('enqueues whole album', async () => {
    load.mockResolvedValueOnce(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    await fireEvent.click(screen.getByText(translate('enqueue all')))

    expect(add).toHaveBeenCalledWith(album.tracks)
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('plays whole album', async () => {
    load.mockResolvedValueOnce(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    await fireEvent.click(screen.getByText(translate('play all')))

    expect(add).toHaveBeenCalledWith(album.tracks, true)
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('enqueues clicked tracks', async () => {
    load.mockResolvedValueOnce(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    await fireEvent.click(screen.getByText(album.tracks[1].tags.title))
    await sleep(250)

    expect(add).toHaveBeenCalledWith(album.tracks[1])
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('plays double-clicked tracks', async () => {
    load.mockResolvedValueOnce(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    const row = screen.getByText(album.tracks[2].tags.title)

    // TODO test glitch: without 3 event, double click isn't detected
    await fireEvent.click(row)
    await fireEvent.click(row)
    await fireEvent.click(row)
    await sleep(250)

    expect(add).toHaveBeenCalledWith(album.tracks[2], true)
    expect(add).toHaveBeenCalledTimes(2)
  })

  it('plays tracks on play button', async () => {
    load.mockResolvedValueOnce(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    await fireEvent.click(
      screen
        .getByText(album.tracks[0].tags.title)
        .closest('tr')
        .querySelector('button')
    )

    expect(add).toHaveBeenCalledWith(album.tracks[0], true)
    expect(add).toHaveBeenCalledTimes(1)
  })

  it('updates on album change', async () => {
    load.mockResolvedValue(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()
    load.mockReset()

    const newName = faker.commerce.productName()
    changes.next({ ...album, name: newName })
    await sleep()

    expect(screen.queryByText(album.name)).toBeFalsy()
    expect(screen.getByText(newName)).toBeInTheDocument()
    expect(load).not.toHaveBeenCalled()
  })

  it('ignores changes on other albums', async () => {
    load.mockResolvedValue(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()
    load.mockReset()

    changes.next({ ...album, id: faker.random.number(), tracks: undefined })
    await sleep()

    expectDisplayedTracks()
    expect(load).not.toHaveBeenCalled()
  })

  it('reloads tracks on album change', async () => {
    load.mockResolvedValue(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()
    load.mockClear()

    changes.next({ ...album, tracks: undefined })
    await sleep()

    expect(load).toHaveBeenCalledWith(album.id)
    expectDisplayedTracks()
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('redirects to albums list on removal', async () => {
    load.mockResolvedValue(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    removals.next(album.id)

    expect(replace).toHaveBeenCalledWith('/albums')
  })

  it('ignores other album removals', async () => {
    load.mockResolvedValue(album)
    render(html`<${albumRoute} params=${{ id: album.id }} />`)
    await sleep()

    removals.next(faker.random.number())

    expect(replace).not.toHaveBeenCalledWith('/albums')
  })
})
