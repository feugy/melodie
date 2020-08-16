'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import TracksTable from './TracksTable.svelte'
import { tracksData, current$Data } from './TracksTable.stories'
import { hash } from '../../utils'
import { sleep } from '../../tests'
import { add } from '../../stores/track-queue'

jest.mock('../../stores/track-queue')

describe('TracksTable component', () => {
  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
  })

  it('has links to artists', async () => {
    const artist = faker.random.arrayElement(tracksData).tags.artists[0]
    render(
      html`<${TracksTable} tracks=${tracksData} current=${current$Data} />`
    )

    fireEvent.click(faker.random.arrayElement(screen.getAllByText(artist)))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${hash(artist)}`)
  })

  it('has links to album', async () => {
    const album = faker.random.arrayElement(tracksData).tags.album
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    fireEvent.click(faker.random.arrayElement(screen.getAllByText(album)))
    await sleep()

    expect(location.hash).toEqual(`#/album/${hash(album)}`)
  })

  it('enqueues track on single click', async () => {
    const track = faker.random.arrayElement(tracksData)
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    await fireEvent.click(screen.getByText(track.tags.title))
    await sleep(300)

    expect(add).toHaveBeenCalledWith(track)
    expect(location.hash).toEqual(`#/`)
  })

  it('plays track on double-click', async () => {
    const track = faker.random.arrayElement(tracksData)
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    const row = screen.getByText(track.tags.title)
    fireEvent.click(row)
    fireEvent.click(row)
    await sleep(300)

    expect(add).toHaveBeenCalledWith(track, true)
    expect(location.hash).toEqual(`#/`)
  })

  it('plays track with button', async () => {
    const track = faker.random.arrayElement(tracksData)
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    await fireEvent.click(
      screen.getByText(track.tags.title).closest('tr').querySelector('button')
    )
    await sleep()

    expect(add).toHaveBeenCalledWith(track, true)
    expect(location.hash).toEqual(`#/`)
  })
})
