'use strict'

import { screen, render, fireEvent, within } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import { invoke } from './utils'
import { makeRef, sleep, translate } from './tests'
import { init } from './stores/settings'
import App from './App.svelte'

describe('App component', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    location.hash = '#/'
    // disable slot warnings
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    Element.prototype.scroll = jest.fn()
    Element.prototype.scrollIntoView = jest.fn()
    window.Notification = jest.fn()
    window.MediaMetadata = jest.fn()
  })

  const albumName = faker.commerce.productName()
  const artists = [faker.name.findName(), faker.name.findName()]

  const albums = [
    {
      id: faker.random.number(),
      name: albumName,
      media: faker.image.avatar(),
      refs: artists.map(makeRef),
      tracks: [
        {
          tags: {
            title: faker.commerce.productName(),
            artists,
            album: albumName
          },
          albumRef: makeRef(albumName),
          artistRefs: artists.map(makeRef)
        }
      ]
    },
    {
      id: faker.random.number(),
      name: faker.commerce.productName(),
      media: faker.image.avatar(),
      refs: [makeRef(faker.name.findName())]
    }
  ]

  describe('given first launch', () => {
    beforeEach(async () => {
      invoke.mockImplementation(async invoked =>
        invoked === 'settings.get'
          ? {
              locale: 'en',
              folders: [],
              openCount: 0,
              providers: { audiodb: {}, discogs: {} },
              enqueueBehaviour: {},
              isBroadcasting: false
            }
          : {}
      )
      await init('')
      render(html`<${App} />`)
      await sleep()
    })

    it('navigates to settings with tutorial on first load', async () => {
      expect(screen.queryByText(translate('settings'))).toBeInTheDocument()
      expect(
        screen.queryByText('Welcome to Mélodie', { exact: false })
      ).toBeInTheDocument()
    })
  })

  describe('given initialized settings', () => {
    beforeEach(async () => {
      invoke.mockImplementation(async invoked =>
        invoked === 'settings.get'
          ? {
              locale: 'en',
              folders: ['/home/music'],
              openCount: 1,
              providers: { audiodb: {}, discogs: {} },
              enqueueBehaviour: {},
              isBroadcasting: false
            }
          : invoked === 'tracks.list'
          ? {
              total: 2,
              results: albums
            }
          : invoked === 'tracks.fetchWithTracks'
          ? albums[0]
          : {}
      )
      await init('')
      render(html`<${App} />`)
      await sleep()
    })

    it('triggers comparison once listing is over', async () => {
      expect(
        screen.queryByText(translate('_ albums', { total: albums.length }))
      ).toBeInTheDocument()
      expect(screen.queryByText(albums[0].name))
      expect(screen.queryByText(albums[1].name))
      expect(invoke).toHaveBeenLastCalledWith('tracks.compare')
    })

    it('closes tracks queue when navigating on small displays', async () => {
      const aside = screen.queryByRole('complementary').parentElement
      const albumThumbnail = screen.queryByText(albums[0].name).parentElement
        .parentElement
      fireEvent.click(within(albumThumbnail).queryByText('play_arrow'))

      expect(screen.queryByText(translate('queue'))).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'close' })
      ).not.toBeInTheDocument()
      expect(aside).toHaveStyle({ minWidth: '30%' })

      window.innerWidth = 300
      window.dispatchEvent(new Event('resize'))
      await sleep(200)

      expect(aside).toHaveStyle({ minWidth: '100%' })
      expect(
        within(aside.firstElementChild.firstElementChild).getByRole('button', {
          name: 'close'
        })
      ).toBeInTheDocument()

      fireEvent.click(screen.queryAllByText(albumName)[0])
      await sleep(500)
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })
  })
})
