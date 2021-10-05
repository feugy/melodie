'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
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
import { sleep } from '../../tests'

const { play, pause } = HTMLMediaElement.prototype

describe('Player component', () => {
  let mediaElementSource
  let gainNode
  let audioContext
  let observer
  let fetch
  const dlUrl = faker.internet.url()

  async function renderPlayer() {
    render(html`<${Player} />`)
    const audio = screen.getByTestId('audio')
    // simulate audio events
    observer = new MutationObserver(mutations => {
      for (const { attributeName } of mutations) {
        if (attributeName === 'src' && audio.src) {
          audio.dispatchEvent(new Event('loadeddata'))
        }
      }
    })
    observer.observe(audio, { attributes: true })
    if (audio.src) {
      audio.dispatchEvent(new Event('loadeddata'))
    }
    await sleep()
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
      createGain: jest.fn().mockReturnValue(gainNode),
      resume: jest.fn()
    }
    window.AudioContext = function () {
      return audioContext
    }
    window.dlUrl = dlUrl

    play.mockImplementation(function () {
      this.dispatchEvent(new Event('play'))
    })
    pause.mockImplementation(function () {
      this.dispatchEvent(new Event('pause'))
    })
    clear()
    invoke.mockResolvedValueOnce({ total: 0, results: [] })
    fetch = jest.spyOn(window, 'fetch')
  })

  afterEach(() => {
    delete window.dlUrl
    if (observer) {
      observer.disconnect()
    }
  })

  it('plays and pause track', async () => {
    add(trackListData)
    expect(play).not.toHaveBeenCalled()

    const audio = await renderPlayer()
    expect(audio).toHaveAttribute(
      'src',
      `${window.dlUrl}${trackListData[0].data}`
    )

    expect(get(current)).toEqual(trackListData[0])
    expect(play).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      `${window.dlUrl}${trackListData[1].data}`
    )

    await userEvent.click(screen.getByText('pause'))

    expect(get(current)).toEqual(trackListData[0])
    expect(play).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByText('play_arrow'))

    expect(get(current)).toEqual(trackListData[0])
    expect(play).toHaveBeenCalledTimes(2)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('mutes and unmute volume', async () => {
    add(trackListData)

    const audio = await renderPlayer()
    expect(audio.muted).toEqual(false)
    await userEvent.click(screen.getByText('volume_up'))
    expect(audio.muted).toEqual(true)

    await userEvent.click(screen.getByText('volume_off'))
    expect(audio.muted).toEqual(false)
  })

  it('goes to next track', async () => {
    add(trackListData)

    await renderPlayer()
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      `${window.dlUrl}${trackListData[1].data}`
    )
    await userEvent.click(screen.getByText('skip_next'))
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${window.dlUrl}${trackListData[2].data}`
    )

    expect(get(current)).toEqual(trackListData[1])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('goes to previous track', async () => {
    add(trackListData)
    jumpTo(2)
    expect(get(current)).toEqual(trackListData[2])

    await renderPlayer()
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      `${window.dlUrl}${trackListData[3].data}`
    )
    await userEvent.click(screen.getByText('skip_previous'))
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      `${window.dlUrl}${trackListData[2].data}`
    )

    expect(get(current)).toEqual(trackListData[1])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('can change volume', async () => {
    add(trackListData)

    const audio = await renderPlayer()
    const slider = screen.queryAllByRole('slider')[1]
    await fireEvent.input(slider, { target: { value: '50' } })

    expect(audio.volume).toEqual(0.5)

    await fireEvent.input(slider, { target: { value: '100' } })
    expect(audio.volume).toEqual(1)
  })

  it(`navigates to current track's album`, async () => {
    add(trackListData)

    await renderPlayer()
    await userEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/album/${trackListData[0].albumRef[0]}`)
  })

  it(`navigates to current track's artist`, async () => {
    add(trackListData)

    await renderPlayer()
    await userEvent.click(screen.getByText(trackListData[0].artistRefs[0][1]))
    await sleep()

    expect(location.hash).toEqual(
      `#/artist/${trackListData[0].artistRefs[0][0]}`
    )
  })

  it('applies track and album ReplayGain when available', async () => {
    add(trackListData)

    await renderPlayer()
    expect(gainNode.gain).toEqual({ value: 1 })

    jumpTo(1)
    expect(gainNode.gain).toEqual({
      value: trackListData[1].tags.replaygain_track_gain.ratio
    })

    jumpTo(2)
    expect(gainNode.gain).toEqual({
      value: trackListData[2].tags.replaygain_album_gain.ratio
    })

    jumpTo(3)
    expect(gainNode.gain).toEqual({
      value: trackListData[3].tags.replaygain_track_gain.ratio
    })

    jumpTo(0)
    expect(gainNode.gain).toEqual({ value: 1 })
  })

  it('goes to next track on track end', async () => {
    add(trackListData)
    const audio = await renderPlayer()
    expect(get(current)).toEqual(trackListData[0])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[1])
    await sleep(10)

    expect(screen.queryByText('pause')).toBeInTheDocument()
    expect(screen.queryByText('play_arrow')).not.toBeInTheDocument()
  })

  it('stops when last track has ended', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = await renderPlayer()
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[3])
    await sleep()

    expect(screen.queryByText('pause')).not.toBeInTheDocument()
    expect(screen.queryByText('play_arrow')).toBeInTheDocument()
  })

  it('restarts to first track when repeat is on and last track has ended', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = await renderPlayer()
    await userEvent.click(screen.getByText('repeat'))
    expect(get(current)).toEqual(trackListData[3])

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[0])
    await sleep()

    expect(screen.queryByText('pause')).toBeInTheDocument()
    expect(screen.queryByText('play_arrow')).not.toBeInTheDocument()
  })

  it('repeat current track when repeat one is on', async () => {
    add(trackListData)
    jumpTo(3)

    const audio = await renderPlayer()
    await userEvent.click(screen.getByText('repeat'))
    await userEvent.click(screen.getByText('repeat'))

    expect(get(current)).toEqual(trackListData[3])
    await sleep()

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[3])
    await sleep()

    audio.dispatchEvent(new Event('ended'))
    expect(get(current)).toEqual(trackListData[3])
    await sleep()

    expect(screen.queryByText('pause')).toBeInTheDocument()
    expect(screen.queryByText('play_arrow')).not.toBeInTheDocument()
  })

  it('retries downloading data on network error', async () => {
    const audio = await renderPlayer()
    await audio.dispatchEvent(new Event('error'))

    expect(screen.queryByText('pause')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'play_arrow' })).toBeDisabled()
    expect(get(current)).toBeUndefined()

    await audio.dispatchEvent(new Event('loadeddata'))
    expect(screen.queryByRole('button', { name: 'pause' })).toBeEnabled()
  })

  it('shuffles and unshuffles current track when repeat one is on', async () => {
    await renderPlayer()
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

      await renderPlayer()
      await sleep()
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
