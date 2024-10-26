import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { load } from '../../stores/playlists'
import { add } from '../../stores/track-queue'
import { sleep } from '../../tests'
import Playlist from './Playlist.svelte'
import { playlistData } from './Playlist.testdata'

vi.mock('../../stores/track-queue')
vi.mock('../../stores/playlists')

describe('Playlist component', () => {
  beforeEach(() => {
    location.hash = '#/'
    vi.clearAllMocks()
  })

  it('navigates to playlist details page', async () => {
    render(html`<${Playlist} src=${playlistData} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByText(playlistData.name))
    await sleep()

    expect(location.hash).toBe(`#/playlist/${playlistData.id}`)
    expect(load).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })

  it('loads and play all tracks', async () => {
    const playlist = { ...playlistData, tracks: undefined }
    const tracks = [
      { id: faker.string.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      playlist.tracks = tracks
      return playlist
    })

    render(html`<${Playlist} src=${playlist} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).toHaveBeenCalledWith(playlist.id)
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toBe(`#/`)
  })

  it('loads and enqueus all tracks', async () => {
    const playlist = { ...playlistData, tracks: undefined }
    const tracks = [
      { id: faker.string.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      playlist.tracks = tracks
      return playlist
    })

    render(html`<${Playlist} src=${playlist} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByTestId('enqueue'))
    await sleep()

    expect(load).toHaveBeenCalledWith(playlist.id)
    expect(add).toHaveBeenCalledWith(tracks, false)
    expect(location.hash).toBe(`#/`)
  })

  it('does not load tracks when already there', async () => {
    const tracks = [
      { id: faker.string.uuid(), path: faker.system.directoryPath() }
    ]
    const playlist = { ...playlistData, tracks }

    render(html`<${Playlist} src=${playlist} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toBe(`#/`)
  })
})
