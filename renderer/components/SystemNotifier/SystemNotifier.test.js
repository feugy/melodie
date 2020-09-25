'use strict'

import { EventEmitter } from 'events'
import { render } from '@testing-library/svelte'
import html from 'svelte-htm'
import SystemNotifier from './SystemNotifier.svelte'
import { toDOMSrc } from '../../utils'
import { sleep, mockInvoke } from '../../tests'
import { clear, add, playNext } from '../../stores/track-queue'
import { trackListData } from '../Player/Player.stories'

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
      icon: toDOMSrc(track.media),
      silent: true
    })
  )
}

describe('SystemNotifier Component', () => {
  beforeEach(async () => {
    clear()
    jest.resetAllMocks()
    window.MediaMetadata = jest.fn().mockImplementation(arg => arg)
    window.Notification = jest.fn().mockImplementation((title, opts) => opts)
    navigator.mediaSession.metadata = null
  })

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
      expect(mockInvoke).not.toHaveBeenCalled()
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
      expect(mockInvoke).not.toHaveBeenCalled()
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
      expect(mockInvoke).not.toHaveBeenCalled()
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
      expect(mockInvoke).not.toHaveBeenCalled()
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
      expect(mockInvoke).not.toHaveBeenCalled()
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
      expect(mockInvoke).not.toHaveBeenCalled()
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
      expect(mockInvoke).not.toHaveBeenCalled()
    })

    it('focuses the application on notification click', async () => {
      render(html`<${SystemNotifier} />`)
      add(trackListData)
      await sleep()

      expectNotification(trackListData[0])
      expect(Notification).toHaveBeenCalledTimes(1)

      Notification.mock.calls[0][1].onclick()
      expect(mockInvoke).toHaveBeenCalledWith('remote', 'core', 'focusWindow')
      expect(mockInvoke).toHaveBeenCalledTimes(1)
    })
  })
})
