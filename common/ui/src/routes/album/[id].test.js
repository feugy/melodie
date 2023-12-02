import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { replace } from 'svelte-spa-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  albums as mockedAlbums,
  changes,
  load,
  removals
} from '../../stores/albums'
import { add } from '../../stores/track-queue'
import { addRefs, sleep, translate } from '../../tests'
import albumRoute from './[id].svelte'

vi.mock('svelte-spa-router')
vi.mock('../../stores/track-queue', () => ({
  add: vi.fn(),
  createClickToAddObservable() {
    return { subscribe: () => ({ unsubscribe: vi.fn() }), next: vi.fn() }
  },
  current: {
    subscribe: () => ({ unsubscribe: () => {} })
  }
}))
vi.mock('../../stores/albums', () => {
  const { Subject } = require('rxjs')
  return {
    load: vi.fn(),
    changes: new Subject(),
    removals: new Subject(),
    albums: {
      subscribe: () => ({ unsubscribe: () => {} })
    }
  }
})

describe('album details route', () => {
  const album = {
    id: faker.number.int(),
    name: faker.commerce.productName(),
    refs: [
      [faker.number.int(), faker.person.firstName()],
      [faker.number.int(), faker.person.firstName()]
    ],
    media: faker.image.avatar(),
    tracks: [
      {
        id: faker.string.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.person.firstName()],
          album: faker.lorem.words(),
          duration: 265,
          year: faker.number.int({ min: 1970, max: 2030 })
        }
      },
      {
        id: faker.string.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.person.firstName()],
          album: faker.lorem.words(),
          duration: 270
        }
      },
      {
        id: faker.string.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.person.firstName()],
          album: faker.lorem.words(),
          duration: 281
        }
      }
    ].map(addRefs)
  }

  function expectDisplayedTracks() {
    for (const track of album.tracks) {
      expect(screen.getByText(track.tags.artists[0])).toBeInTheDocument()
      expect(screen.queryByText(track.tags.album)).not.toBeInTheDocument()
      expect(screen.getByText(track.tags.title)).toBeInTheDocument()
    }
  }

  beforeEach(() => {
    const albums = new BehaviorSubject([album])
    mockedAlbums.subscribe = albums.subscribe.bind(albums)
    vi.resetAllMocks()
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

    it('displays album title, image, artists, total duration and year', async () => {
      expect(screen.getByText(album.name)).toBeInTheDocument()
      const image = screen.queryAllByRole('img')
      expect(
        image.filter(
          node =>
            node.hasAttribute('src') &&
            node.getAttribute('src').includes(album.media)
        )
      ).toBeDefined()

      expect(screen.getByText(album.refs[0][1])).toBeInTheDocument()
      expect(screen.getByText(album.refs[1][1])).toBeInTheDocument()

      expect(
        screen.getByText(translate('total duration _', { total: '13:36' }))
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          translate('year _', { year: album.tracks[0].tags.year })
        )
      ).toBeInTheDocument()

      expect(load).toHaveBeenCalledWith(album.id)
    })

    it('has links to artists', async () => {
      const [id, artist] = faker.helpers.arrayElement(album.refs)
      // first occurence is in album header, then we have tracks
      await userEvent.click(screen.getAllByText(artist)[0])
      await sleep()

      expect(add).not.toHaveBeenCalled()
      expect(location.hash).toBe(`#/artist/${id}`)
    })

    it('loads tracks and display them', async () => {
      expect(load).toHaveBeenCalledWith(album.id)
      expectDisplayedTracks()
      expect(replace).not.toHaveBeenCalled()
    })

    it('enqueues whole album', async () => {
      await userEvent.click(screen.getByText(translate('enqueue all')))

      expect(add).toHaveBeenCalledWith(album.tracks)
      expect(add).toHaveBeenCalledOnce()
    })

    it('plays whole album', async () => {
      await userEvent.click(screen.getByText(translate('play all')))
      await sleep()

      expect(add).toHaveBeenCalledWith(album.tracks, true)
      expect(add).toHaveBeenCalledOnce()
      expect(location.hash).toBe(`#/album/${album.id}`)
    })

    it('updates on album change', async () => {
      load.mockReset()

      const newName = faker.commerce.productName()
      changes.next([{ ...album, name: newName }])
      await sleep()

      expect(screen.queryByText(album.name)).not.toBeInTheDocument()
      expect(screen.getByText(newName)).toBeInTheDocument()
      expect(load).not.toHaveBeenCalled()
    })

    it('ignores changes on other albums', async () => {
      load.mockReset()

      changes.next([{ ...album, id: faker.number.int(), tracks: undefined }])
      await sleep()

      expectDisplayedTracks()
      expect(load).not.toHaveBeenCalled()
    })

    it('reloads tracks on album change', async () => {
      load.mockReset().mockResolvedValueOnce(album)

      changes.next([{ ...album, tracks: undefined }])
      await sleep()

      expect(load).toHaveBeenCalledWith(album.id)
      expectDisplayedTracks()
      expect(load).toHaveBeenCalledOnce()
    })

    it('redirects to albums list on removal', async () => {
      removals.next([album.id])

      expect(replace).toHaveBeenCalledWith('/album')
    })

    it('ignores other album removals', async () => {
      removals.next([faker.number.int()])

      expect(replace).not.toHaveBeenCalledWith('/album')
    })

    it('opens media selector on image click', async () => {
      const albumImage = Array.from(screen.queryAllByRole('img')).find(
        node =>
          node.hasAttribute('src') &&
          node.getAttribute('src').includes(album.media)
      )

      await userEvent.click(albumImage)

      expect(await screen.findByText(translate('choose cover'))).toBeVisible()
    })
  })
})
