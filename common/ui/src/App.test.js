'use strict'

import { screen, render, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'
import html from 'svelte-htm'
import faker from 'faker'
import App from './App.svelte'
import { init, isDesktop } from './stores/settings'
import { totp } from './stores/totp'
import { makeRef, sleep, translate } from './tests'
import { initConnection, invoke, releaseWakeLock, stayAwake } from './utils'

jest.mock('./utils/wake-lock')

const fetch = jest.spyOn(global, 'fetch')

describe('App component', () => {
  beforeEach(async () => {
    jest.resetAllMocks()
    location.hash = '#/'
    // disable slot warnings
    jest.spyOn(console, 'warn').mockImplementation(() => {})

    Element.prototype.scroll = jest.fn()
    Element.prototype.scrollIntoView = jest.fn()
    window.Notification = jest.fn()
    window.MediaMetadata = jest.fn()
    stayAwake.mockResolvedValue()
    releaseWakeLock.mockResolvedValue()
  })

  const albumName = faker.commerce.productName()
  const artists = [faker.name.findName(), faker.name.findName()]

  const albums = [
    {
      id: faker.datatype.number(),
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
      id: faker.datatype.number(),
      name: faker.commerce.productName(),
      media: faker.image.avatar(),
      refs: [makeRef(faker.name.findName())]
    }
  ]

  describe('given first launch', () => {
    beforeEach(async () => {
      isDesktop.next(true)
      invoke.mockResolvedValue({})
      initConnection.mockResolvedValue({
        locale: 'en',
        folders: [],
        openCount: 0,
        providers: { audiodb: {}, discogs: {} },
        enqueueBehaviour: {},
        isBroadcasting: false
      })
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
      isDesktop.next(true)
      initConnection.mockResolvedValue({
        locale: 'en',
        folders: ['/home/music'],
        openCount: 1,
        providers: { audiodb: {}, discogs: {} },
        enqueueBehaviour: {},
        isBroadcasting: false
      })
      invoke.mockImplementation(async invoked =>
        invoked === 'tracks.list'
          ? {
              total: 2,
              results: albums
            }
          : invoked === 'tracks.fetchWithTracks'
          ? albums[0]
          : {}
      )
      await init('')
    })

    it('triggers comparison once listing is over on desktop', async () => {
      render(html`<${App} />`)
      await sleep()

      expect(
        screen.queryByText(translate('_ albums', { total: albums.length }))
      ).toBeInTheDocument()
      expect(screen.queryByText(albums[0].name))
      expect(screen.queryByText(albums[1].name))
      expect(invoke).toHaveBeenLastCalledWith('tracks.compare')
      expect(stayAwake).not.toHaveBeenCalled()
    })

    it('does not triggers comparison but stays awake on web', async () => {
      isDesktop.next(false)
      render(html`<${App} />`)
      await sleep()

      expect(
        screen.queryByText(translate('_ albums', { total: albums.length }))
      ).toBeInTheDocument()
      expect(screen.queryByText(albums[0].name))
      expect(screen.queryByText(albums[1].name))
      expect(invoke).not.toHaveBeenLastCalledWith('tracks.compare')
      expect(stayAwake).toHaveBeenCalledBefore(releaseWakeLock)
    })

    it('closes tracks queue when navigating on small displays', async () => {
      render(html`<${App} />`)
      await sleep()

      const aside = screen.queryByRole('complementary').parentElement
      const albumThumbnail = screen.queryByText(albums[0].name).parentElement
        .parentElement
      await userEvent.hover(albumThumbnail)
      userEvent.click(within(albumThumbnail).queryByText('play_arrow'))

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
        within(aside.firstElementChild).getAllByRole('button', {
          name: 'close'
        })
      ).toHaveLength(2)

      const [album] = screen.queryAllByText(albumName)
      await userEvent.hover(album)
      userEvent.click(album)
      await sleep(500)
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument()
    })

    it('displays modal when loosing server connection', async () => {
      isDesktop.next(false)
      render(html`<${App} />`)
      await sleep()

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // invoke lost connection callbak
      await initConnection.mock.calls[0][2]()

      const dialog = screen.queryByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(
        within(dialog).queryByRole('heading', { level: 1 })
      ).toHaveTextContent(translate('connection lost'))
    })

    it('reconnects with provided one-time password', async () => {
      isDesktop.next(false)
      const token = faker.datatype.uuid()
      fetch.mockReturnValue({ ok: true, text: async () => token })
      init('')
      const otp = Math.floor(Math.random() * 1000)
      render(html`<${App} />`)
      await sleep()
      expect(get(totp)).toBeNull()
      expect(initConnection).toHaveBeenCalledTimes(1)

      // invoke lost connection callbak
      await initConnection.mock.calls[0][2]()

      const dialog = screen.queryByRole('dialog')
      expect(dialog).toBeInTheDocument()
      userEvent.type(within(dialog).getByRole('spinbutton'), `${otp}{enter}`)
      await sleep()

      expect(get(totp)).toEqual(otp.toString())
      expect(initConnection).toHaveBeenNthCalledWith(
        1,
        '',
        null,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenNthCalledWith(
        2,
        '',
        token,
        expect.any(Function),
        expect.any(Function)
      )
      expect(initConnection).toHaveBeenCalledTimes(2)
    })
  })

  describe('given unreachable server', () => {
    beforeEach(async () => {
      initConnection.mockImplementation(
        async (address, totp, onConnectionLost) => {
          setTimeout(onConnectionLost, 0)
        }
      )
      init('')
    })

    it('displays modal when loosing server connection', async () => {
      render(html`<${App} />`)
      await sleep()

      const dialog = screen.queryByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(
        within(dialog).queryByRole('heading', { level: 1 })
      ).toHaveTextContent(translate('connection lost'))
    })
  })
})
