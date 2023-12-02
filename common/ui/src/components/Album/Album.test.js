import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { load } from '../../stores/albums'
import { add } from '../../stores/track-queue'
import { sleep } from '../../tests'
import Album from './Album.svelte'
import { albumData } from './Album.testdata'

vi.mock('../../stores/track-queue')
vi.mock('../../stores/albums')

describe('Album component', () => {
  beforeEach(() => {
    location.hash = '#/'
    vi.clearAllMocks()
  })

  it('navigates to album details page', async () => {
    render(html`<${Album} src=${albumData} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toBe(`#/album/${albumData.id}`)
    expect(load).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })

  it('loads and play all tracks', async () => {
    const album = { ...albumData, tracks: undefined }
    const tracks = [
      { id: faker.string.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      album.tracks = tracks
      return album
    })

    render(html`<${Album} src=${album} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).toHaveBeenCalledWith(album.id)
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toBe(`#/`)
  })

  it('loads and enqueus all tracks', async () => {
    const album = { ...albumData, tracks: undefined }
    const tracks = [
      { id: faker.string.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      album.tracks = tracks
      return album
    })

    render(html`<${Album} src=${album} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByTestId('enqueue'))
    await sleep()

    expect(load).toHaveBeenCalledWith(album.id)
    expect(add).toHaveBeenCalledWith(tracks, false)
    expect(location.hash).toBe(`#/`)
  })

  it('does not load tracks when already there', async () => {
    const tracks = [
      { id: faker.string.uuid(), path: faker.system.directoryPath() }
    ]
    const album = { ...albumData, tracks }

    render(html`<${Album} src=${album} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toBe(`#/`)
  })

  it('has links to artists', async () => {
    const [id, name] = albumData.refs[0]
    render(html`<${Album} src=${albumData} />`)
    await userEvent.hover(screen.getByRole('tab'))
    await userEvent.click(screen.getByText(name))
    await sleep()

    expect(location.hash).toBe(`#/artist/${id}`)
  })
})
