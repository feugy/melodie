'use strict'

import { get } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Player from './Player.svelte'
import { trackListData } from './Player.stories'
import { add, clear, current, jumpTo } from '../../stores/track-queue'
import { sleep } from '../../tests'

const { play, pause } = HTMLMediaElement.prototype

describe('Player component', () => {
  let mediaElementSource
  let gainNode

  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    window.AudioContext = function () {
      return {
        createMediaElementSource: jest.fn().mockReturnValue(mediaElementSource),
        createGain: jest.fn().mockReturnValue(gainNode)
      }
    }
    mediaElementSource = { connect: jest.fn() }
    gainNode = { connect: jest.fn(), gain: { value: 1 } }
    clear()
  })

  it('plays and pause track', async () => {
    add(trackListData)
    expect(play).not.toHaveBeenCalled()
    play.mockImplementation(function () {
      this.dispatchEvent(new Event('play'))
    })

    render(html`<${Player} />`)

    const audio = screen.getByTestId('audio')
    expect(audio).toHaveAttribute('src', trackListData[0].path)

    await fireEvent.click(screen.getByText('play_arrow'))

    expect(get(current)).toEqual(trackListData[0])
    expect(play).toHaveBeenCalled()

    pause.mockImplementation(function () {
      this.dispatchEvent(new Event('pause'))
    })

    await fireEvent.click(screen.getByText('pause'))

    expect(get(current)).toEqual(trackListData[0])
    expect(pause).toHaveBeenCalled()
  })

  it('mutes and unmute volume', async () => {
    add(trackListData)

    render(html`<${Player} />`)
    const audio = screen.getByTestId('audio')

    expect(audio.muted).toEqual(false)
    await fireEvent.click(screen.getByText('volume_up'))
    expect(audio.muted).toEqual(true)

    await fireEvent.click(screen.getByText('volume_off'))
    expect(audio.muted).toEqual(false)
  })

  it('goes to next track', async () => {
    add(trackListData)

    render(html`<${Player} />`)

    await fireEvent.click(screen.getByText('skip_next'))

    expect(get(current)).toEqual(trackListData[1])
  })

  it('goes to previous track', async () => {
    add(trackListData)
    jumpTo(2)
    expect(get(current)).toEqual(trackListData[2])

    render(html`<${Player} />`)

    await fireEvent.click(screen.getByText('skip_previous'))

    expect(get(current)).toEqual(trackListData[1])
  })

  it('dispatch event for playlist', async () => {
    const handleTogglePlaylist = jest.fn()

    render(html`<${Player} on:togglePlaylist=${handleTogglePlaylist} />`)

    await fireEvent.click(screen.getByText('queue_music'))

    expect(handleTogglePlaylist).toHaveBeenCalledTimes(1)
  })

  it('can change volume', async () => {
    add(trackListData)

    render(html`<${Player} />`)
    const audio = screen.getByTestId('audio')

    const slider = screen.queryAllByRole('slider')[1]
    await fireEvent.input(slider, { target: { value: '50' } })

    expect(audio.volume).toEqual(0.5)

    await fireEvent.input(slider, { target: { value: '100' } })
    expect(audio.volume).toEqual(1)
  })

  it(`navigates to current track's album`, async () => {
    add(trackListData)

    render(html`<${Player} />`)
    await fireEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/album/${trackListData[0].albumRef[0]}`)
  })

  it(`navigates to current track's artist`, async () => {
    add(trackListData)

    render(html`<${Player} />`)
    await fireEvent.click(screen.getByText(trackListData[0].artistRefs[0][1]))
    await sleep()

    expect(location.hash).toEqual(
      `#/artist/${trackListData[0].artistRefs[0][0]}`
    )
  })

  it('applies track and album ReplayGain when available', async () => {
    add(trackListData)

    render(html`<${Player} />`)

    expect(gainNode.gain.value).toEqual(1)

    jumpTo(1)
    expect(gainNode.gain.value).toEqual(
      trackListData[1].tags.replaygain_track_gain.ratio
    )

    jumpTo(2)
    expect(gainNode.gain.value).toEqual(
      trackListData[2].tags.replaygain_album_gain.ratio
    )

    jumpTo(3)
    expect(gainNode.gain.value).toEqual(
      trackListData[3].tags.replaygain_track_gain.ratio
    )

    jumpTo(0)
    expect(gainNode.gain.value).toEqual(1)
  })
})
