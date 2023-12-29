import { faker } from '@faker-js/faker'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { get } from 'svelte/store'
import html from 'svelte-htm'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as playlistStore from '../../stores/playlists'
import {
  add,
  clear,
  current,
  isShuffling,
  jumpTo,
  playNext
} from '../../stores/track-queue'
import { invoke } from '../../utils'
import Player from './Player.svelte'
import { trackListData } from './Player.testdata'

const { play, pause, load } = HTMLMediaElement.prototype

describe('Player component', () => {
  let mediaElementSource
  let gainNode
  let audioContext
  let observer

  function renderPlayer() {
    render(html`<${Player} />`)
    const audio = screen.getByTestId('audio')
    // simulate audio events
    observer = new MutationObserver(mutations => {
      for (const { attributeName } of mutations) {
        if (attributeName === 'src' && audio.src) {
          audio.dispatchEvent(new Event('loadeddata'))
          setTimeout(() => audio.dispatchEvent(new Event('play')), 1)
        }
      }
    })
    observer.observe(audio, { attributes: true })
    if (audio.src) {
      audio.dispatchEvent(new Event('loadeddata'))
      setTimeout(() => audio.dispatchEvent(new Event('play')), 1)
    }
    return audio
  }

  beforeEach(() => {
    location.hash = '#/'
    vi.resetAllMocks()
    mediaElementSource = { connect: vi.fn() }
    gainNode = {
      connect: vi.fn(),
      gain: { value: 1 },
      get context() {
        return audioContext
      }
    }
    audioContext = {
      createMediaElementSource: vi.fn().mockReturnValue(mediaElementSource),
      createGain: vi.fn().mockReturnValue(gainNode)
    }
    window.AudioContext = function () {
      return audioContext
    }

    load.mockImplementation(function () {
      setTimeout(() => this.dispatchEvent(new Event('loading')), 1)
    })
    play.mockImplementation(function () {
      this.dispatchEvent(new Event('play'))
    })
    pause.mockImplementation(function () {
      this.dispatchEvent(new Event('pause'))
    })
    clear()
    invoke.mockResolvedValueOnce({ total: 0, results: [] })
  })

  afterEach(() => {
    delete window.dlUrl
    if (observer) {
      observer.disconnect()
    }
  })

  it('plays and pause track', async () => {
    add(trackListData)

    const audio = renderPlayer()
    expect(audio).toHaveAttribute('src', trackListData[0].data)

    expect(get(current)).toEqual(trackListData[0])

    const button = screen.queryByTestId('play-button')
    await userEvent.click(button)

    expect(button.querySelector('i')).toHaveClass('i-mdi-play')
    expect(get(current)).toEqual(trackListData[0])

    await userEvent.click(button)

    expect(button.querySelector('i')).toHaveClass('i-mdi-pause')
    expect(get(current)).toEqual(trackListData[0])
  })

  it('mutes and unmute volume', async () => {
    add(trackListData)

    const audio = renderPlayer()
    const button = screen.queryByTestId('mute-button')
    expect(audio.muted).toBe(false)

    await userEvent.click(button)
    expect(button.querySelector('i')).toHaveClass('i-mdi-volume-off')
    expect(audio.muted).toBe(true)

    await userEvent.click(button)
    expect(button.querySelector('i')).toHaveClass('i-mdi-volume')
    expect(audio.muted).toBe(false)
  })

  it('goes to next track', async () => {
    add(trackListData)

    renderPlayer()
    await userEvent.click(screen.getByTestId('next-button'))

    expect(get(current)).toEqual(trackListData[1])
  })

  it('goes to previous track', async () => {
    add(trackListData)
    jumpTo(2)
    expect(get(current)).toEqual(trackListData[2])

    renderPlayer()
    await userEvent.click(screen.queryByTestId('previous-button'))

    expect(get(current)).toEqual(trackListData[1])
  })

  it('can change volume', async () => {
    add(trackListData)

    const audio = renderPlayer()
    const slider = screen.queryAllByRole('slider')[1]
    fireEvent.input(slider, { target: { value: '50' } })
    await tick()

    expect(audio.volume).toEqual(0.5)

    fireEvent.input(slider, { target: { value: '100' } })
    await tick()
    expect(audio.volume).toBe(1)
  })

  it(`navigates to current track's album`, async () => {
    add(trackListData)

    renderPlayer()
    await userEvent.click(screen.getByRole('img').closest('a'))
    await waitFor(() =>
      expect(location.hash).toBe(`#/album/${trackListData[0].albumRef[0]}`)
    )
  })

  it(`navigates to current track's artist`, async () => {
    add(trackListData)

    renderPlayer()
    await userEvent.click(screen.getByText(trackListData[0].artistRefs[0][1]))
    await waitFor(() =>
      expect(location.hash).toBe(
        `#/artist/${trackListData[0].artistRefs[0][0]}`
      )
    )
  })

  it('applies track and album ReplayGain when available', async () => {
    add(trackListData)

    renderPlayer()
    expect(gainNode.gain).toEqual({ value: 1 })

    jumpTo(1)
    await waitFor(() =>
      expect(gainNode.gain).toEqual({
        value: trackListData[1].tags.replaygain_track_gain.ratio
      })
    )

    jumpTo(2)
    await waitFor(() =>
      expect(gainNode.gain).toEqual({
        value: trackListData[2].tags.replaygain_album_gain.ratio
      })
    )

    jumpTo(3)
    await waitFor(() =>
      expect(gainNode.gain).toEqual({
        value: trackListData[3].tags.replaygain_track_gain.ratio
      })
    )

    jumpTo(0)
    await waitFor(() => expect(gainNode.gain).toEqual({ value: 1 }))
  })

  it('goes to next track on track end', async () => {
    add(trackListData)
    const audio = renderPlayer()
    expect(get(current)).toEqual(trackListData[0])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[1])

    expect(screen.queryByTestId('play-button').querySelector('i')).toHaveClass(
      'i-mdi-play'
    )
  })

  it('stops when last track has ended', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = renderPlayer()
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[3])

    expect(screen.queryByTestId('play-button').querySelector('i')).toHaveClass(
      'i-mdi-play'
    )
  })

  it('restarts to first track when repeat is on and last track has ended', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = renderPlayer()
    await userEvent.click(screen.getByTestId('repeat-button'))
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[0])

    expect(screen.queryByTestId('play-button').querySelector('i')).toHaveClass(
      'i-mdi-pause'
    )
  })

  it('repeat current track when repeat one is on', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = renderPlayer()
    const repeatButton = screen.getByTestId('repeat-button')
    const playButton = screen.getByTestId('play-button')
    await userEvent.click(repeatButton)
    await userEvent.click(repeatButton)

    expect(get(current)).toEqual(trackListData[3])
    expect(playButton.querySelector('i')).toHaveClass('i-mdi-pause')

    audio.dispatchEvent(new Event('ended'))

    expect(playButton.querySelector('i')).toHaveClass('i-mdi-pause')
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))

    expect(playButton.querySelector('i')).toHaveClass('i-mdi-pause')
    expect(get(current)).toEqual(trackListData[3])
  })

  it('retries downloading data on network error', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    add(trackListData)
    const audio = renderPlayer()
    const button = screen.queryByTestId('play-button')
    expect(button.querySelector('i')).toHaveClass('i-mdi-play')

    await audio.dispatchEvent(new Event('error'))
    expect(button.querySelector('i')).toHaveClass('i-mdi-play')

    // in 100ms src will be automatically reset
    expect(button.querySelector('i')).toHaveClass('i-mdi-play')
    expect(console.log).toHaveBeenCalledWith(
      'player error',
      undefined,
      undefined
    )
  })

  it('shuffles and unshuffles current track when repeat one is on', async () => {
    renderPlayer()
    const button = screen.getByTestId('shuffle-button')
    await userEvent.click(button)
    expect(get(isShuffling)).toBe(true)

    await userEvent.click(button)
    expect(get(isShuffling)).toBe(false)
  })

  describe('given some playlist', () => {
    const playlists = [
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      },
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      },
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      }
    ]

    beforeEach(async () => {
      invoke.mockReset()
      playlistStore.reset()
      invoke.mockResolvedValue({
        total: playlists.length,
        size: playlists.length,
        from: 0,
        results: playlists
      })
    })

    it('adds current track to existing playlist', async () => {
      add(trackListData)
      jumpTo(3)

      renderPlayer()
      const button = screen.queryByTestId('add-to-playlist-button')
      expect(
        screen.queryByTestId('play-button').querySelector('i')
      ).toHaveClass('i-mdi-play')
      vi.resetAllMocks()

      const playlist = faker.helpers.arrayElement(playlists)

      await userEvent.click(button)
      await userEvent.click(screen.queryByText(playlist.name))

      playNext()

      await userEvent.click(button)
      await userEvent.click(screen.queryByText(playlist.name))

      expect(invoke).toHaveBeenNthCalledWith(
        1,
        'playlists.append',
        playlist.id,
        [trackListData[3].id]
      )
      expect(invoke).toHaveBeenNthCalledWith(
        2,
        'playlists.append',
        playlist.id,
        [trackListData[0].id]
      )
      expect(invoke).toHaveBeenCalledTimes(2)
    })
  })
})
