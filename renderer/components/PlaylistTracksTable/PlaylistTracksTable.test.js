'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import electron from 'electron'
import PlaylistTracksTable from './PlaylistTracksTable.svelte'
import { add } from '../../stores/track-queue'
import { removeTrack, moveTrack } from '../../stores/playlists'
import { sleep, translate } from '../../tests'

jest.mock('../../stores/track-queue')
jest.mock('../../stores/playlists')
jest.mock('electron', () => ({
  shell: {
    showItemInFolder: jest.fn()
  },
  ipcRenderer: new (require('events').EventEmitter)()
}))

const album = 'Cowboy Bebop - NoDisc'
const artists = ['Yoko Kanno', 'the Seatbelts']
const albumRef = [1, album]
const artistRefs = artists.map((artist, id) => [id, artist])

export const playlist = {
  id: 1,
  name: faker.commerce.productName(),
  refs: [albumRef, ...artistRefs],
  media: null,
  tracks: [
    {
      id: 1,
      tags: {
        title: 'American Money',
        artists,
        album,
        duration: 332,
        track: { no: 1 }
      },
      albumRef,
      artistRefs
    },
    {
      id: 2,
      tags: {
        title: 'Fantaisie Sign',
        artists,
        album,
        duration: 215,
        track: { no: 2 }
      },
      albumRef,
      artistRefs
    },
    {
      id: 3,
      tags: {
        title: "Don't Bother None",
        artists,
        album,
        duration: 225,
        disk: { no: 1 },
        track: { no: 3 }
      },
      albumRef,
      artistRefs
    },
    {
      id: 4,
      tags: {
        title: 'Vitamin A',
        artists,
        album,
        duration: 281,
        disk: { no: 1 },
        track: { no: 2 }
      },
      albumRef,
      artistRefs
    },
    {
      id: 5,
      tags: {
        title: 'LIVE in Baghdad',
        artists,
        album,
        duration: 179,
        disk: { no: 2 },
        track: { no: 3 }
      },
      albumRef,
      artistRefs
    }
  ]
}

describe('PlaylistTracksTable component', () => {
  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
  })

  it('has links to artists', async () => {
    const [id, artist] = faker.random.arrayElement(
      playlist.tracks
    ).artistRefs[0]
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    fireEvent.click(faker.random.arrayElement(screen.queryAllByText(artist)))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${id}`)
  })

  it('has links to albums', async () => {
    const [id, album] = faker.random.arrayElement(playlist.tracks).albumRef
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    fireEvent.click(faker.random.arrayElement(screen.queryAllByText(album)))
    await sleep()

    expect(location.hash).toEqual(`#/album/${id}`)
  })

  it('enqueues track on single click', async () => {
    const track = faker.random.arrayElement(playlist.tracks)
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    await fireEvent.click(screen.getByText(track.tags.title))
    await sleep(300)

    expect(add).toHaveBeenCalledWith({ ...track, key: `${track.id}-1` })
    expect(moveTrack).not.toHaveBeenCalled()
    expect(location.hash).toEqual(`#/`)
  })

  it('plays track on double-click', async () => {
    const track = faker.random.arrayElement(playlist.tracks)
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    const row = screen.getByText(track.tags.title)
    fireEvent.click(row)
    fireEvent.click(row)
    await sleep(300)

    expect(add).toHaveBeenCalledWith({ ...track, key: `${track.id}-1` }, true)
    expect(moveTrack).not.toHaveBeenCalled()
    expect(location.hash).toEqual(`#/`)
  })

  it('moves track in the playlist', async () => {
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    const dropped = screen.queryByText(playlist.tracks[2].tags.title)
    const hovered = screen.queryByText(playlist.tracks[1].tags.title)

    await fireEvent.dragStart(screen.queryByText(playlist.tracks[0].tags.title))
    await fireEvent.dragOver(hovered)
    await fireEvent.dragLeave(hovered)
    await fireEvent.dragOver(dropped)
    await fireEvent.drop(dropped)
    await sleep()

    expect(moveTrack).toHaveBeenCalledWith(playlist, { from: 0, to: 2 })
    expect(moveTrack).toHaveBeenCalledTimes(1)
    expect(add).not.toHaveBeenCalled()
    expect(location.hash).toEqual(`#/`)
  })

  describe('given the dropdown menu opened', () => {
    let track

    beforeEach(async () => {
      track = faker.random.arrayElement(playlist.tracks)
      render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

      await fireEvent.click(
        screen.getByText(track.tags.title).closest('tr').querySelector('button')
      )
    })

    it('removes track from playlist with dropdown', async () => {
      await fireEvent.click(screen.getByText(translate('remove from playlist')))
      await sleep()

      expect(removeTrack).toHaveBeenCalledWith(
        playlist,
        playlist.tracks.indexOf(track)
      )
      expect(add).not.toHaveBeenCalled()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(location.hash).toEqual(`#/`)
    })

    it('plays track with dropdown', async () => {
      await fireEvent.click(screen.getByText('play_arrow'))
      await sleep()

      expect(add).toHaveBeenCalledWith({ ...track, key: `${track.id}-1` }, true)
      expect(removeTrack).not.toHaveBeenCalled()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(location.hash).toEqual(`#/`)
    })

    it('enqueues track with dropdown', async () => {
      await fireEvent.click(screen.getByText('playlist_add'))
      await sleep()

      expect(add).toHaveBeenCalledWith({ ...track, key: `${track.id}-1` })
      expect(removeTrack).not.toHaveBeenCalled()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(location.hash).toEqual(`#/`)
    })

    it('opens parent folder', async () => {
      await fireEvent.click(screen.getByText('launch'))
      await sleep()

      expect(electron.shell.showItemInFolder).toHaveBeenCalledWith(track.path)
      expect(add).not.toHaveBeenCalled()
      expect(removeTrack).not.toHaveBeenCalled()
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(location.hash).toEqual(`#/`)
    })

    it('opens track details dialogue', async () => {
      await fireEvent.click(screen.getByText('local_offer'))
      await sleep()

      expect(screen.getByText(translate('track details'))).toBeVisible()
      expect(add).not.toHaveBeenCalled()
      expect(removeTrack).not.toHaveBeenCalled()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(location.hash).toEqual(`#/`)
    })
  })
})
