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
import { hash } from '../../utils'

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
    linked: [faker.name.findName(), faker.name.findName()],
    media: faker.image.avatar(),
    tracks: [
      {
        id: faker.random.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()],
          album: faker.lorem.words(),
          duration: 265
        }
      },
      {
        id: faker.random.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()],
          album: faker.lorem.words(),
          duration: 270
        }
      },
      {
        id: faker.random.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.name.findName()],
          album: faker.lorem.words(),
          duration: 281
        }
      }
    ]
  }

  function expectDisplayedTracks() {
    for (const track of album.tracks) {
      expect(screen.queryByText(track.tags.artists[0])).toBeInTheDocument()
      expect(screen.queryByText(track.tags.album)).not.toBeInTheDocument()
      expect(screen.queryByText(track.tags.title)).toBeInTheDocument()
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
    expect(replace).toHaveBeenCalledWith('/album')
  })

  describe('given an album', () => {
    beforeEach(async () => {
      location.hash = `#/album/${album.id}`
      load.mockResolvedValueOnce(album)
      render(html`<${albumRoute} params=${{ id: album.id }} />`)
      await sleep()
    })

    it('displays album title, image, artists and total duration', async () => {
      expect(screen.queryByText(album.name)).toBeInTheDocument()
      const image = screen.queryAllByRole('img')
      expect(
        image.filter(
          node =>
            node.hasAttribute('src') &&
            node.getAttribute('src').includes(album.media)
        )
      ).toBeDefined()

      expect(screen.queryByText(album.linked[0])).toBeInTheDocument()
      expect(screen.queryByText(album.linked[1])).toBeInTheDocument()

      expect(
        screen.queryByText(translate('total duration _', { total: '13:36' }))
      ).toBeInTheDocument()

      expect(load).toHaveBeenCalledWith(album.id)
    })

    it('has links to artists', async () => {
      const artist = faker.random.arrayElement(album.linked)
      // first occurence is in album header, then we have tracks
      fireEvent.click(screen.getAllByText(artist)[0])
      await sleep()

      expect(add).not.toHaveBeenCalled()
      expect(location.hash).toEqual(`#/artist/${hash(artist)}`)
    })

    it('loads tracks and display them', async () => {
      expect(load).toHaveBeenCalledWith(album.id)
      expectDisplayedTracks()
      expect(replace).not.toHaveBeenCalled()
    })

    it('enqueues whole album', async () => {
      await fireEvent.click(screen.getByText(translate('enqueue all')))

      expect(add).toHaveBeenCalledWith(album.tracks)
      expect(add).toHaveBeenCalledTimes(1)
    })

    it('plays whole album', async () => {
      await fireEvent.click(screen.getByText(translate('play all')))
      await sleep()

      expect(add).toHaveBeenCalledWith(album.tracks, true)
      expect(add).toHaveBeenCalledTimes(1)
      expect(location.hash).toEqual(`#/album/${album.id}`)
    })

    it('enqueues clicked tracks', async () => {
      await fireEvent.click(screen.getByText(album.tracks[1].tags.title))
      await sleep(250)

      expect(add).toHaveBeenCalledWith(album.tracks[1])
      expect(add).toHaveBeenCalledTimes(1)
      expect(location.hash).toEqual(`#/album/${album.id}`)
    })

    it('plays tracks', async () => {
      await fireEvent.click(
        screen
          .getByText(album.tracks[2].tags.title)
          .closest('tr')
          .querySelector('button')
      )
      await sleep()

      expect(add).toHaveBeenCalledWith(album.tracks[2], true)
      expect(add).toHaveBeenCalledTimes(1)
      expect(location.hash).toEqual(`#/album/${album.id}`)
    })

    it('updates on album change', async () => {
      load.mockReset()

      const newName = faker.commerce.productName()
      changes.next({ ...album, name: newName })
      await sleep()

      expect(screen.queryByText(album.name)).toBeFalsy()
      expect(screen.getByText(newName)).toBeInTheDocument()
      expect(load).not.toHaveBeenCalled()
    })

    it('ignores changes on other albums', async () => {
      load.mockReset()

      changes.next({ ...album, id: faker.random.number(), tracks: undefined })
      await sleep()

      expectDisplayedTracks()
      expect(load).not.toHaveBeenCalled()
    })

    it('reloads tracks on album change', async () => {
      load.mockReset().mockResolvedValueOnce(album)

      changes.next({ ...album, tracks: undefined })
      await sleep()

      expect(load).toHaveBeenCalledWith(album.id)
      expectDisplayedTracks()
      expect(load).toHaveBeenCalledTimes(1)
    })

    it('redirects to albums list on removal', async () => {
      removals.next(album.id)

      expect(replace).toHaveBeenCalledWith('/album')
    })

    it('ignores other album removals', async () => {
      removals.next(faker.random.number())

      expect(replace).not.toHaveBeenCalledWith('/album')
    })

    it('opens media selector on image click', async () => {
      const albumImage = Array.from(screen.queryAllByRole('img')).find(
        node =>
          node.hasAttribute('src') &&
          node.getAttribute('src').includes(album.media)
      )

      await fireEvent.click(albumImage)

      expect(await screen.findByText(translate('choose cover'))).toBeVisible()
    })
  })
})
