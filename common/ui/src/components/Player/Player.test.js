'use strict'

import { screen, render, fireEvent, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'
import html from 'svelte-htm'
import faker from 'faker'
import Player from './Player.svelte'
import { trackListData } from './Player.testdata'
import {
  add,
  clear,
  current,
  jumpTo,
  isShuffling,
  playNext
} from '../../stores/track-queue'
import * as playlistStore from '../../stores/playlists'
import { invoke } from '../../utils'

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
    jest.resetAllMocks()
    mediaElementSource = { connect: jest.fn() }
    gainNode = {
      connect: jest.fn(),
      gain: { value: 1 },
      get context() {
        return audioContext
      }
    }
    audioContext = {
      createMediaElementSource: jest.fn().mockReturnValue(mediaElementSource),
      createGain: jest.fn().mockReturnValue(gainNode)
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

    await userEvent.click(await screen.findByText('pause'))

    expect(get(current)).toEqual(trackListData[0])

    await userEvent.click(screen.getByText('play_arrow'))

    expect(get(current)).toEqual(trackListData[0])
  })

  it('mutes and unmute volume', async () => {
    add(trackListData)

    const audio = renderPlayer()
    expect(audio.muted).toEqual(false)
    await userEvent.click(screen.getByText('volume_up'))
    expect(audio.muted).toEqual(true)

    await userEvent.click(screen.getByText('volume_off'))
    expect(audio.muted).toEqual(false)
  })

  it('goes to next track', async () => {
    add(trackListData)

    renderPlayer()
    await userEvent.click(screen.getByText('skip_next'))

    expect(get(current)).toEqual(trackListData[1])
  })

  it('goes to previous track', async () => {
    add(trackListData)
    jumpTo(2)
    expect(get(current)).toEqual(trackListData[2])

    renderPlayer()
    await userEvent.click(screen.getByText('skip_previous'))

    expect(get(current)).toEqual(trackListData[1])
  })

  it('can change volume', async () => {
    add(trackListData)

    const audio = renderPlayer()
    const slider = screen.queryAllByRole('slider')[1]
    await fireEvent.input(slider, { target: { value: '50' } })

    expect(audio.volume).toEqual(0.5)

    await fireEvent.input(slider, { target: { value: '100' } })
    expect(audio.volume).toEqual(1)
  })

  it(`navigates to current track's album`, async () => {
    add(trackListData)

    renderPlayer()
    await userEvent.click(screen.getByRole('img'))
    await waitFor(() =>
      expect(location.hash).toEqual(`#/album/${trackListData[0].albumRef[0]}`)
    )
  })

  it(`navigates to current track's artist`, async () => {
    add(trackListData)

    renderPlayer()
    await userEvent.click(screen.getByText(trackListData[0].artistRefs[0][1]))
    await waitFor(() =>
      expect(location.hash).toEqual(
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

    expect(await screen.findByText('pause')).toBeInTheDocument()
    expect(screen.queryByText('play_arrow')).not.toBeInTheDocument()
  })

  it('stops when last track has ended', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = renderPlayer()
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[3])

    expect(await screen.findByText('play_arrow')).toBeInTheDocument()
    expect(screen.queryByText('pause')).not.toBeInTheDocument()
  })

  it('restarts to first track when repeat is on and last track has ended', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = renderPlayer()
    await userEvent.click(screen.getByText('repeat'))
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[0])

    expect(await screen.findByText('pause')).toBeInTheDocument()
    expect(screen.queryByText('play_arrow')).not.toBeInTheDocument()
  })

  it('repeat current track when repeat one is on', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = renderPlayer()
    await userEvent.click(screen.getByText('repeat'))
    await userEvent.click(screen.getByText('repeat'))

    expect(get(current)).toEqual(trackListData[3])
    expect(await screen.findByText('pause')).toBeInTheDocument()

    audio.dispatchEvent(new Event('ended'))

    expect(await screen.findByText('pause')).toBeInTheDocument()
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))

    expect(await screen.findByText('pause')).toBeInTheDocument()
    expect(get(current)).toEqual(trackListData[3])
  })

  it('retries downloading data on network error', async () => {
    add(trackListData)
    const audio = renderPlayer()
    expect(await screen.findByText('pause')).toBeInTheDocument()

    await audio.dispatchEvent(new Event('error'))
    expect(await screen.findByText('play_arrow')).toBeInTheDocument()
    expect(screen.queryByText('pause')).not.toBeInTheDocument()

    // in 100ms src will be automatically reset
    expect(await screen.findByText('pause')).toBeInTheDocument()
    expect(screen.queryByText('play_arrow')).not.toBeInTheDocument()
  })

  it('shuffles and unshuffles current track when repeat one is on', async () => {
    renderPlayer()
    await userEvent.click(screen.getByText('shuffle'))
    expect(get(isShuffling)).toEqual(true)

    await userEvent.click(screen.getByText('shuffle'))
    expect(get(isShuffling)).toEqual(false)
  })

  describe('given some playlist', () => {
    const playlists = [
      {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.datatype.number(), faker.datatype.number()]
      },
      {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.datatype.number(), faker.datatype.number()]
      },
      {
        id: faker.datatype.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.datatype.number(), faker.datatype.number()]
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
      expect(await screen.findByText('pause')).toBeInTheDocument()
      jest.resetAllMocks()

      const playlist = faker.random.arrayElement(playlists)

      await userEvent.click(screen.queryByText('library_add'))
      await userEvent.click(screen.queryByText(playlist.name))

      playNext()

      await userEvent.click(screen.queryByText('library_add'))
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
