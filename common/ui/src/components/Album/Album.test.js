'use strict'

import { screen, render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import faker from 'faker'
import Album from './Album.svelte'
import { albumData } from './Album.stories'
import { sleep } from '../../tests'
import { load } from '../../stores/albums'
import { add } from '../../stores/track-queue'

jest.mock('../../stores/track-queue')
jest.mock('../../stores/albums')

describe('Album component', () => {
  beforeEach(() => {
    location.hash = '#/'
    jest.clearAllMocks()
  })

  it('navigates to album details page', async () => {
    render(html`<${Album} src=${albumData} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/album/${albumData.id}`)
    expect(load).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })

  it('loads and play all tracks', async () => {
    const album = { ...albumData, tracks: undefined }
    const tracks = [
      { id: faker.datatype.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      album.tracks = tracks
      return album
    })

    render(html`<${Album} src=${album} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).toHaveBeenCalledWith(album.id)
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toEqual(`#/`)
  })

  it('loads and enqueus all tracks', async () => {
    const album = { ...albumData, tracks: undefined }
    const tracks = [
      { id: faker.datatype.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      album.tracks = tracks
      return album
    })

    render(html`<${Album} src=${album} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByTestId('enqueue'))
    await sleep()

    expect(load).toHaveBeenCalledWith(album.id)
    expect(add).toHaveBeenCalledWith(tracks, false)
    expect(location.hash).toEqual(`#/`)
  })

  it('does not load tracks when already there', async () => {
    const tracks = [
      { id: faker.datatype.uuid(), path: faker.system.directoryPath() }
    ]
    const album = { ...albumData, tracks }

    render(html`<${Album} src=${album} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toEqual(`#/`)
  })

  it('has links to artists', async () => {
    const [id, name] = albumData.refs[0]
    render(html`<${Album} src=${albumData} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByText(name))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${id}`)
  })
})
