'use strict'

import { EventEmitter } from 'events'
import { render } from '@testing-library/svelte'
import html from 'svelte-htm'
import SystemNotifier from './SystemNotifier.svelte'
import { invoke } from '../../utils'
import { clear, add, playNext } from '../../stores/track-queue'
import { isDesktop } from '../../stores/settings'
import { trackListData } from '../Player/Player.testdata'
import { sleep, translate } from '../../tests'

function expectMetadata(track, artwork = [{}]) {
  expect(navigator.mediaSession.metadata).toEqual({
    album: track.albumRef[1],
    artist: track.artistRefs[0][1],
    artwork,
    title: track.tags.title
  })
}

function expectNotification(track) {
  expect(Notification).toHaveBeenCalledWith(
    track.tags.title,
    expect.objectContaining({
      body: `${track.artistRefs[0][1]} - ${track.albumRef[1]}`,
      icon: track.media,
      silent: true
    })
  )
}

describe('SystemNotifier Component', () => {
  beforeEach(async () => {
    clear()
    jest.resetAllMocks()
    isDesktop.next(true)
    window.MediaMetadata = jest.fn().mockImplementation(arg => arg)
    navigator.mediaSession.metadata = null
  })

  it('handles Notification-less platform', async () => {
    window.Notification = jest.fn().mockImplementation(() => {
      throw new TypeError(
        `Failed to construct 'Notification': Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead.`
      )
    })
    window.fetch.mockResolvedValue({
      blob: jest.fn().mockResolvedValue({})
    })
    URL.createObjectURL = jest.fn()

    render(html`<${SystemNotifier} />`)
    add(trackListData)
    await sleep()

    add(trackListData)
    expect(Notification).toHaveBeenCalledTimes(1)
  })

  describe('given a supporting platform', () => {
    beforeEach(async () => {
      window.Notification = jest.fn().mockImplementation((title, opts) => opts)
    })

    afterEach(() => isDesktop.next(true))

    it('handles unfetchable meda media', async () => {
      console.error = jest.fn()

      render(html`<${SystemNotifier} />`)
      add(trackListData)
      await sleep()

      const track = trackListData[0]
      expectMetadata(track, [])
      expectNotification(track)
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `failed to load media ${track.media} for mediaSession`
        )
      )
      expect(console.error).toHaveBeenCalledTimes(1)
    })

    describe('given valid media', () => {
      const emitter = new EventEmitter()

      beforeEach(() => {
        // make sure fetched data will properly translate to blob URL
        window.fetch.mockResolvedValue({
          blob: jest.fn().mockResolvedValue({})
        })
        URL.createObjectURL = jest.fn()

        emitter.removeAllListeners()
        navigator.mediaSession.setActionHandler.mockImplementation(
          (evt, handler) => {
            if (handler) {
              emitter.on(evt, handler)
            }
          }
        )
      })

      it('updates media session metadatas for played track', async () => {
        render(html`<${SystemNotifier} />`)
        add(trackListData)
        await sleep()

        expectMetadata(trackListData[0])
        expectNotification(trackListData[0])
        expect(Notification).toHaveBeenCalledTimes(1)
        expect(invoke).not.toHaveBeenCalled()
      })

      it('handles missing tags', async () => {
        render(html`<${SystemNotifier} />`)
        add([
          {
            id: 1,
            tags: {
              title: null,
              album: null,
              artists: [],
              duration: 218.42
            },
            media: null,
            path: './no-duration.mp3',
            albumRef: null,
            artistRefs: []
          }
        ])
        await sleep()

        const unknown = translate('unknown')
        expect(navigator.mediaSession.metadata).toEqual({
          album: unknown,
          artist: unknown,
          artwork: [],
          title: unknown
        })
        expect(Notification).toHaveBeenCalledWith(
          unknown,
          expect.objectContaining({
            body: `${unknown} - ${unknown}`,
            icon: null,
            silent: true
          })
        )
        expect(Notification).toHaveBeenCalledTimes(1)
        expect(invoke).not.toHaveBeenCalled()
      })

      it('updates media session metadatas when receiving different track', async () => {
        render(html`<${SystemNotifier} />`)
        add(trackListData)
        await sleep()

        expectMetadata(trackListData[0])
        expectNotification(trackListData[0])

        playNext()
        await sleep()

        expectMetadata(trackListData[1])
        expectNotification(trackListData[1])
        expect(Notification).toHaveBeenCalledTimes(2)
        expect(invoke).not.toHaveBeenCalled()
      })

      it('does not update media session metadata when receiving the same track', async () => {
        render(html`<${SystemNotifier} />`)
        add(trackListData.slice(0, 1))
        await sleep()

        expectMetadata(trackListData[0])
        expectNotification(trackListData[0])
        expect(Notification).toHaveBeenCalledTimes(1)
        Notification.mockReset()

        playNext()
        await sleep()

        expectMetadata(trackListData[0])
        expect(Notification).not.toHaveBeenCalled()
        expect(invoke).not.toHaveBeenCalled()
      })

      it('does not update media session metadata when receiving null', async () => {
        render(html`<${SystemNotifier} />`)
        await sleep()

        expect(navigator.mediaSession.metadata).toBeNull()
        expect(Notification).not.toHaveBeenCalled()

        clear()
        await sleep()

        expect(navigator.mediaSession.metadata).toBeNull()
        expect(Notification).not.toHaveBeenCalled()
        expect(invoke).not.toHaveBeenCalled()
      })

      it('does not trigger notification when app is focused', async () => {
        render(html`<${SystemNotifier} />`)
        window.dispatchEvent(new Event('focus'))
        await sleep()

        add(trackListData)
        await sleep()

        expectMetadata(trackListData[0])
        expect(Notification).not.toHaveBeenCalled()

        playNext()
        await sleep()

        expectMetadata(trackListData[1])
        expect(Notification).not.toHaveBeenCalled()

        window.dispatchEvent(new Event('blur'))
        playNext()
        await sleep()

        expectMetadata(trackListData[2])
        expectNotification(trackListData[2])
        expect(Notification).toHaveBeenCalledTimes(1)
        expect(invoke).not.toHaveBeenCalled()
      })

      it('plays next track from media session', async () => {
        render(html`<${SystemNotifier} />`)
        add(trackListData)
        await sleep()

        expectMetadata(trackListData[0])
        expectNotification(trackListData[0])
        expect(Notification).toHaveBeenCalledTimes(1)
        Notification.mockReset()

        emitter.emit('nexttrack')
        await sleep()

        expectMetadata(trackListData[1])
        expectNotification(trackListData[1])
        expect(Notification).toHaveBeenCalledTimes(1)
        expect(invoke).not.toHaveBeenCalled()
      })

      it('plays previous track from media session', async () => {
        render(html`<${SystemNotifier} />`)
        add(trackListData)
        await sleep()

        expectMetadata(trackListData[0])
        expectNotification(trackListData[0])
        expect(Notification).toHaveBeenCalledTimes(1)
        Notification.mockReset()

        emitter.emit('previoustrack')
        await sleep()

        expectMetadata(trackListData[trackListData.length - 1])
        expectNotification(trackListData[trackListData.length - 1])
        expect(Notification).toHaveBeenCalledTimes(1)
        expect(invoke).not.toHaveBeenCalled()
      })

      it('focuses the application on notification click, in ', async () => {
        render(html`<${SystemNotifier} />`)
        add(trackListData)
        await sleep()

        expectNotification(trackListData[0])
        expect(Notification).toHaveBeenCalledTimes(1)

        Notification.mock.calls[0][1].onclick()
        expect(invoke).toHaveBeenCalledWith('core.focusWindow')
        expect(invoke).toHaveBeenCalledTimes(1)

        isDesktop.next(false)
        render(html`<${SystemNotifier} />`)
        add(trackListData)
        await sleep()

        expect(Notification).toHaveBeenCalledTimes(2)
        expect(Notification.mock.calls[1][1].onclick).not.toBeDefined()
      })
    })
  })
})
