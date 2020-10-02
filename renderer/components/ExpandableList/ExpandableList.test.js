'use strict'

import { render, screen, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import ExpandableList, {
  ALBUMS,
  ARTISTS,
  TRACKS
} from './ExpandableList.svelte'
import { albumData } from '../Album/Album.stories'
import { tracksData } from '../TracksTable/TracksTable.stories'
import { sleep, translate } from '../../tests'
import { createClickToAddObservable } from '../../stores/track-queue'
import { artistData } from '../Artist/Artist.stories'

jest.mock('../../stores/track-queue')

describe('ExpandableList component', () => {
  const clicks$ = {
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
    next: jest.fn()
  }

  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    createClickToAddObservable.mockReturnValue(clicks$)
  })

  it('does not allow unknown type', async () => {
    expect(() => render(html`<${ExpandableList} kind="whatever" />`)).toThrow(
      /unsupported kind: whatever/
    )
  })

  it('displays nothing when item list is empty', async () => {
    render(
      html`<${ExpandableList} kind=${ARTISTS} items=${new BehaviorSubject()} />`
    )

    expect(screen.queryByRole('list')).toBeNull()
  })

  it('show all albums of a short list', () => {
    const albums = [
      { ...albumData, id: 1 },
      { ...albumData, id: 2 }
    ]
    render(
      html`<${ExpandableList}
        kind=${ALBUMS}
        items=${new BehaviorSubject(albums)}
      />`
    )

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(albums.length)
    for (const [i, album] of albums.entries()) {
      expect(items[i].querySelector('a[href]')).toHaveAttribute(
        'href',
        `#/album/${album.id}`
      )
    }
  })

  it('does not intercept single clicks on albums', async () => {
    render(
      html`<${ExpandableList}
        kind=${ALBUMS}
        items=${new BehaviorSubject([albumData])}
      />`
    )

    fireEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/album/${albumData.id}`)
    expect(clicks$.next).toHaveBeenCalled()
    expect(clicks$.subscribe).not.toHaveBeenCalled()
  })

  it('does not intercept single clicks on artists', async () => {
    render(
      html`<${ExpandableList}
        kind=${ARTISTS}
        items=${new BehaviorSubject([artistData])}
      />`
    )

    fireEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${artistData.id}`)
    expect(clicks$.next).toHaveBeenCalled()
    expect(clicks$.subscribe).not.toHaveBeenCalled()
  })

  describe('given a long list of tracks', () => {
    const tracks = tracksData.slice(0, 5)
    const items = new BehaviorSubject()

    beforeEach(() => {
      Element.prototype.getBoundingClientRect = function () {
        return {
          right: Array.from(this.parentNode.children).indexOf(this) * 100
        }
      }
      items.next(tracks)
      // hack: do not use svelte-htm as it wrapps the returned component.
      const { component } = render(ExpandableList, { kind: TRACKS, items })
      component.$set({ _width: 280 })
    })

    it('shows them all when expanded', async () => {
      const button = screen.getByText(translate('show all'))
      expect(button).toBeVisible()

      for (const [
        i,
        {
          tags: { title }
        }
      ] of tracks.entries()) {
        const text = screen.getByText(title)
        if (i <= 2) {
          expect(text).toBeVisible()
        } else {
          expect(text).not.toBeVisible()
        }
      }

      await fireEvent.click(button)

      expect(screen.getByText(translate('show less'))).toBeVisible()
      for (const {
        tags: { title }
      } of tracks) {
        expect(screen.getByText(title)).toBeVisible()
      }
      expect(location.hash).toEqual(`#/`)
    })

    it('shows only the first line when collapsed', async () => {
      await fireEvent.click(screen.getByText(translate('show all')))
      for (const {
        tags: { title }
      } of tracks) {
        expect(screen.getByText(title)).toBeVisible()
      }

      await fireEvent.click(screen.getByText(translate('show less')))
      for (const [
        i,
        {
          tags: { title }
        }
      ] of tracks.entries()) {
        const text = screen.getByText(title)
        if (i <= 2) {
          expect(text).toBeVisible()
        } else {
          expect(text).not.toBeVisible()
        }
      }
      expect(screen.getByText(translate('show all'))).toBeVisible()
      expect(location.hash).toEqual(`#/`)
    })

    it('resets state when receiving new list', async () => {
      await fireEvent.click(screen.getByText(translate('show all')))

      expect(screen.getByText(translate('show less'))).toBeVisible()

      items.next(tracksData.slice(5, 10))
      await sleep()

      expect(screen.getByText(translate('show all'))).toBeVisible()
    })

    it('proxies tracks clicks to track-queue store', async () => {
      const track = tracks[1]
      fireEvent.click(screen.getByText(track.tags.title))

      expect(clicks$.next).toHaveBeenCalledWith(track)
      expect(clicks$.subscribe).toHaveBeenCalled()
      expect(location.hash).toEqual(`#/`)
    })
  })
})
