'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import electron from 'electron'
import TracksTable from './TracksTable.svelte'
import { tracksData, current$Data } from './TracksTable.stories'
import { sleep, translate } from '../../tests'
import { add, createClickToAddObservable } from '../../stores/track-queue'

jest.mock('../../stores/track-queue')
jest.mock('electron', () => {
  const { EventEmitter } = require('events')
  const ipcRenderer = new EventEmitter()
  ipcRenderer.invoke = jest.fn()
  return { shell: { showItemInFolder: jest.fn() }, ipcRenderer }
})

describe('TracksTable component', () => {
  const clicks$ = {
    subscribe: () => ({ unsubscribe: jest.fn() }),
    next: jest.fn()
  }

  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    createClickToAddObservable.mockReturnValue(clicks$)
  })

  it('has links to artists', async () => {
    const [id, artist] = faker.random.arrayElement(tracksData).artistRefs[0]
    render(
      html`<${TracksTable} tracks=${tracksData} current=${current$Data} />`
    )

    fireEvent.click(faker.random.arrayElement(screen.getAllByText(artist)))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${id}`)
  })

  it('has links to album', async () => {
    const [id, album] = faker.random.arrayElement(tracksData).albumRef
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    fireEvent.click(faker.random.arrayElement(screen.getAllByText(album)))
    await sleep()

    expect(location.hash).toEqual(`#/album/${id}`)
  })

  it('proxies table clicks to click track-queue store', async () => {
    const track = faker.random.arrayElement(tracksData)
    render(
      html`<${TracksTable}
        tracks=${tracksData}
        current=${current$Data}
        withAlbum
      />`
    )

    fireEvent.click(screen.getByText(track.tags.title))

    expect(clicks$.next).toHaveBeenCalledWith(track)
    expect(clicks$.next).toHaveBeenCalledTimes(1)
    expect(location.hash).toEqual(`#/`)
  })

  describe('given the dropdown menu opened', () => {
    let track

    beforeEach(async () => {
      track = faker.random.arrayElement(tracksData)
      render(
        html`<${TracksTable}
          tracks=${tracksData}
          current=${current$Data}
          withAlbum
        />`
      )

      fireEvent.click(
        screen.getByText(track.tags.title).closest('tr').querySelector('button')
      )
    })

    it('plays track with dropdown', async () => {
      fireEvent.click(screen.getByText('play_arrow'))
      await sleep()

      expect(add).toHaveBeenCalledWith(track, true)
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(location.hash).toEqual(`#/`)
    })

    it('enqueues track with dropdown', async () => {
      fireEvent.click(screen.getByText('playlist_add'))
      await sleep()

      expect(add).toHaveBeenCalledWith(track)
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(location.hash).toEqual(`#/`)
    })

    it('opens parent folder', async () => {
      fireEvent.click(screen.getByText('launch'))
      await sleep()

      expect(electron.shell.showItemInFolder).toHaveBeenCalledWith(track.path)
      expect(add).not.toHaveBeenCalled()
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(location.hash).toEqual(`#/`)
    })

    it('opens track details dialogue', async () => {
      fireEvent.click(screen.getByText('local_offer'))
      await sleep()

      expect(screen.getByText(translate('track details'))).toBeVisible()
      expect(add).not.toHaveBeenCalled()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(location.hash).toEqual(`#/`)
    })
  })
})
