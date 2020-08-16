'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import { replace } from 'svelte-spa-router'
import faker from 'faker'
import artistRoute from './[id].svelte'
import {
  artists as mockedArtists,
  changes,
  removals,
  load
} from '../../stores/artists'
import { add } from '../../stores/track-queue'
import { hash } from '../../utils'
import { translate, sleep } from '../../tests'

jest.mock('svelte-spa-router')
jest.mock('../../stores/track-queue', () => ({
  add: jest.fn(),
  current: {
    subscribe: () => ({ unsubscribe: () => {} })
  }
}))
jest.mock('../../stores/artists', () => {
  const { Subject } = require('rxjs')
  return {
    load: jest.fn(),
    changes: new Subject(),
    removals: new Subject(),
    artists: {
      subscribe: () => ({ unsubscribe: () => {} })
    }
  }
})

describe('artist details route', () => {
  const album1 = {
    name: faker.commerce.productName(),
    media: faker.image.avatar()
  }
  const album2 = {
    name: faker.commerce.productName(),
    media: faker.image.avatar()
  }
  const album3 = {
    name: faker.commerce.productName(),
    media: faker.image.avatar()
  }
  const artistName = faker.name.findName()

  const artist = {
    id: faker.random.number(),
    name: artistName,
    linked: [album1.name, album2.name],
    media: faker.image.avatar(),
    tracks: [
      {
        id: faker.random.uuid(),
        media: album1.media,
        tags: {
          title: faker.commerce.productName(),
          artists: [artistName],
          album: album1.name,
          duration: 265
        }
      },
      {
        id: faker.random.uuid(),
        media: album1.media,
        tags: {
          title: faker.commerce.productName(),
          artists: [artistName],
          album: album1.name,
          duration: 270
        }
      },
      {
        id: faker.random.uuid(),
        media: album2.media,
        tags: {
          title: faker.commerce.productName(),
          artists: [artistName],
          album: album2.name,
          duration: 281
        }
      }
    ]
  }

  beforeEach(async () => {
    const artists = new BehaviorSubject([artist])
    mockedArtists.subscribe = artists.subscribe.bind(artists)
    jest.resetAllMocks()
  })

  it('redirects to artist list on unknown album', async () => {
    load.mockResolvedValueOnce(null)

    render(html`<${artistRoute} params=${{ id: artist.id }} />`)
    await sleep()

    expect(load).toHaveBeenCalledWith(artist.id)
    expect(replace).toHaveBeenCalledWith('/artist')
  })

  describe('given an artist', () => {
    beforeEach(async () => {
      location.hash = `#/artist/${artist.id}`
      load.mockResolvedValueOnce(artist)
      render(html`<${artistRoute} params=${{ id: artist.id }} />`)
      await sleep()
    })

    it('displays artist name, image and all albums', async () => {
      expect(screen.queryByText(artist.name)).toBeInTheDocument()
      const images = Array.from(
        screen.queryAllByRole('img').filter(node => node.hasAttribute('src'))
      )

      expect(
        images.find(node => node.getAttribute('src').includes(artist.media))
      ).toBeInTheDocument()
      expect(
        images.find(node => node.getAttribute('src').includes(album1.media))
      ).toBeInTheDocument()
      expect(
        images.find(node => node.getAttribute('src').includes(album2.media))
      ).toBeInTheDocument()
      expect(images).toHaveLength(3)

      expect(load).toHaveBeenCalledWith(artist.id)
    })

    it('enqueues all tracks', async () => {
      await fireEvent.click(screen.getByText(translate('enqueue all')))

      expect(add).toHaveBeenCalledWith(artist.tracks)
      expect(add).toHaveBeenCalledTimes(1)
    })

    it('plays all tracks', async () => {
      await fireEvent.click(screen.getByText(translate('play all')))

      expect(add).toHaveBeenCalledWith(artist.tracks, true)
      expect(add).toHaveBeenCalledTimes(1)
    })

    it('navigates to album details page', async () => {
      await fireEvent.click(screen.getByText(album2.name))
      await sleep(250)

      expect(add).not.toHaveBeenCalled()
      expect(location.hash).toEqual(`#/album/${hash(album2.name)}`)
    })

    it('updates on artist change', async () => {
      load.mockReset()

      const newName = faker.name.findName()
      changes.next({
        ...artist,
        name: newName,
        tracks: [
          ...artist.tracks,
          {
            id: faker.random.uuid(),
            media: album3.media,
            tags: {
              title: faker.commerce.productName(),
              artists: [artistName],
              album: album3.name,
              duration: 354
            }
          }
        ]
      })
      await sleep()

      expect(screen.queryByText(artist.name)).toBeFalsy()
      expect(screen.getByText(newName)).toBeInTheDocument()

      const images = Array.from(
        screen.queryAllByRole('img').filter(node => node.hasAttribute('src'))
      )
      expect(
        images.find(node => node.getAttribute('src').includes(album1.media))
      ).toBeInTheDocument()
      expect(
        images.find(node => node.getAttribute('src').includes(album2.media))
      ).toBeInTheDocument()
      expect(
        images.find(node => node.getAttribute('src').includes(album3.media))
      ).toBeInTheDocument()
      expect(images).toHaveLength(4)

      expect(load).not.toHaveBeenCalled()
    })

    it('ignores changes on other artists', async () => {
      load.mockReset()

      changes.next({ ...artist, id: faker.random.number(), tracks: undefined })
      await sleep()

      expect(load).not.toHaveBeenCalled()
    })

    it('reloads tracks on album change', async () => {
      load.mockReset().mockResolvedValueOnce(artist)

      changes.next({ ...artist, tracks: undefined })
      await sleep()

      expect(load).toHaveBeenCalledWith(artist.id)

      const images = Array.from(
        screen.queryAllByRole('img').filter(node => node.hasAttribute('src'))
      )
      expect(
        images.find(node => node.getAttribute('src').includes(album1.media))
      ).toBeInTheDocument()
      expect(
        images.find(node => node.getAttribute('src').includes(album2.media))
      ).toBeInTheDocument()
      expect(images).toHaveLength(3)

      expect(load).toHaveBeenCalledTimes(1)
    })

    it('redirects to artist list on removal', async () => {
      removals.next(artist.id)

      expect(replace).toHaveBeenCalledWith('/artist')
    })

    it('ignores other artist removals', async () => {
      removals.next(faker.random.number())

      expect(replace).not.toHaveBeenCalledWith('/artist')
    })

    it('opens media selector on image click', async () => {
      const artistImage = Array.from(screen.queryAllByRole('img')).find(
        node =>
          node.hasAttribute('src') &&
          node.getAttribute('src').includes(artist.media)
      )

      await fireEvent.click(artistImage)

      expect(await screen.findByText(translate('choose avatar'))).toBeVisible()
    })
  })
})
