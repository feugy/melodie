'use strict'

import { screen, render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import faker from 'faker'
import Artist from './Artist.svelte'
import { artistData } from './Artist.testdata'
import { load } from '../../stores/artists'
import { add } from '../../stores/track-queue'
import { sleep } from '../../tests'

jest.mock('../../stores/track-queue')
jest.mock('../../stores/artists')

describe('Artist component', () => {
  beforeEach(() => {
    location.hash = '#/'
    jest.clearAllMocks()
  })

  it('navigates to artist details page', async () => {
    render(html`<${Artist} src=${artistData} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${artistData.id}`)
    expect(load).not.toHaveBeenCalled()
    expect(add).not.toHaveBeenCalled()
  })

  it('loads and play all tracks', async () => {
    const artist = { ...artistData, tracks: undefined }
    const tracks = [
      { id: faker.datatype.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      artist.tracks = tracks
      return artist
    })

    render(html`<${Artist} src=${artist} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).toHaveBeenCalledWith(artist.id)
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toEqual(`#/`)
  })

  it('loads and enqueus all tracks', async () => {
    const artist = { ...artistData, tracks: undefined }
    const tracks = [
      { id: faker.datatype.uuid(), path: faker.system.directoryPath() }
    ]
    load.mockImplementation(async () => {
      artist.tracks = tracks
      return artist
    })

    render(html`<${Artist} src=${artist} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByTestId('enqueue'))
    await sleep()

    expect(load).toHaveBeenCalledWith(artist.id)
    expect(add).toHaveBeenCalledWith(tracks, false)
    expect(location.hash).toEqual(`#/`)
  })

  it('does not load tracks when already there', async () => {
    const tracks = [
      { id: faker.datatype.uuid(), path: faker.system.directoryPath() }
    ]
    const artist = { ...artistData, tracks }

    render(html`<${Artist} src=${artist} />`)
    await userEvent.hover(screen.getByRole('article'))
    userEvent.click(screen.getByTestId('play'))
    await sleep()

    expect(load).not.toHaveBeenCalled()
    expect(add).toHaveBeenCalledWith(tracks, true)
    expect(location.hash).toEqual(`#/`)
  })
})
