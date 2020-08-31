'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import Playlist from './Playlist.svelte'
import { playlistData } from './Playlist.stories'
import { sleep } from '../../tests'
import { load } from '../../stores/playlists'
import { add } from '../../stores/track-queue'

jest.mock('../../stores/track-queue')
jest.mock('../../stores/playlists')

describe('Album component', () => {
  beforeEach(() => {
    location.hash = '#/'
    jest.clearAllMocks()
  })

  it('navigates to playlist details page', async () => {
    render(html`<${Playlist} src=${playlistData} />`)

    fireEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/playlist/${playlistData.id}`)
    expect(load).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })

  it('loads and play all tracks', async () => {
    const playlist = { ...playlistData, tracks: undefined }
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      playlist.tracks = tracks
      return playlist
    })

    render(html`<${Playlist} src=${playlist} />`)
    await fireEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).toHaveBeenCalledWith(playlist.id)
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toEqual(`#/`)
  })

  it('loads and enqueus all tracks', async () => {
    const playlist = { ...playlistData, tracks: undefined }
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      playlist.tracks = tracks
      return playlist
    })

    render(html`<${Playlist} src=${playlist} />`)
    await fireEvent.click(screen.getByTestId('enqueue'))
    await sleep()

    expect(load).toHaveBeenCalledWith(playlist.id)
    expect(add).toHaveBeenCalledWith(tracks, false)
    expect(location.hash).toEqual(`#/`)
  })

  it('does not load tracks when already there', async () => {
    const tracks = [
      { id: faker.random.uuid(), path: faker.system.directoryPath() }
    ]
    const playlist = { ...playlistData, tracks }

    render(html`<${Playlist} src=${playlist} />`)
    await fireEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toEqual(`#/`)
  })
})
