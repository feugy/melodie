'use strict'

import {
  screen,
  render,
  fireEvent,
  waitForElementToBeRemoved
} from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import faker from 'faker'
import PlaylistTracksTable from './PlaylistTracksTable.svelte'
import { createClickToAddObservable } from '../../stores/track-queue'
import { removeTrack, moveTrack } from '../../stores/playlists'
import { sleep, translate } from '../../tests'

jest.mock('../../stores/track-queue')
jest.mock('../../stores/playlists')

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
    const [id, artist] = faker.random.arrayElement(playlist.tracks)
      .artistRefs[0]
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    userEvent.click(faker.random.arrayElement(screen.queryAllByText(artist)))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${id}`)
  })

  it('has links to albums', async () => {
    const [id, album] = faker.random.arrayElement(playlist.tracks).albumRef
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    userEvent.click(faker.random.arrayElement(screen.queryAllByText(album)))
    await sleep()

    expect(location.hash).toEqual(`#/album/${id}`)
  })

  it('proxies table clicks to track-queue store', async () => {
    const track = faker.random.arrayElement(playlist.tracks)
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    userEvent.click(screen.getByText(track.tags.title))

    expect(clicks$.next).toHaveBeenCalledWith({
      ...track,
      key: `${track.id}-1`
    })
    expect(clicks$.next).toHaveBeenCalledTimes(1)
    expect(location.hash).toEqual(`#/`)
  })

  it('moves track in the playlist', async () => {
    render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

    const dragged = screen.queryByText(playlist.tracks[0].tags.title)
    const hovered = screen.queryByText(playlist.tracks[2].tags.title)
    const dropped = screen.queryByText(playlist.tracks[3].tags.title)
    const dataTransfer = { setDragImage: jest.fn() }

    fireEvent.dragStart(dragged, { dataTransfer })
    fireEvent.dragEnter(dragged, { dataTransfer })
    fireEvent.dragEnter(hovered.closest('li'), { dataTransfer })
    fireEvent.dragEnter(dropped.closest('li'), { dataTransfer })
    fireEvent.dragEnd(dropped, { dataTransfer })
    await sleep()

    expect(moveTrack).toHaveBeenCalledWith(playlist, { from: 0, to: 3 })
    expect(moveTrack).toHaveBeenCalledTimes(1)
    expect(location.hash).toEqual(`#/`)
  })

  describe('given the dropdown menu opened', () => {
    let track

    beforeEach(async () => {
      track = faker.random.arrayElement(playlist.tracks)
      render(html`<${PlaylistTracksTable} playlist=${playlist} />`)

      userEvent.click(
        screen.getByText(track.tags.title).closest('tr').querySelector('button')
      )
    })

    afterEach(async () =>
      waitForElementToBeRemoved(screen.queryByText('local_offer'))
    )

    it('removes track from playlist with dropdown', async () => {
      await userEvent.click(screen.getByText(translate('remove from playlist')))

      expect(removeTrack).toHaveBeenCalledWith(
        playlist,
        playlist.tracks.indexOf(track)
      )
      expect(screen.getByText(translate('track details'))).not.toBeVisible()
      expect(location.hash).toEqual(`#/`)
    })

    it('opens track details dialogue', async () => {
      await userEvent.click(screen.getByText('local_offer'))

      expect(screen.getByText(translate('track details'))).toBeVisible()
      expect(removeTrack).not.toHaveBeenCalled()
      expect(location.hash).toEqual(`#/`)
    })
  })
})
