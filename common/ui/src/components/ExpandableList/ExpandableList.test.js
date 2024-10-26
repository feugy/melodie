import { render, screen, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import { tick } from 'svelte'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createClickToAddObservable } from '../../stores/track-queue'
import { sleep, translate } from '../../tests'
import { albumData } from '../Album/Album.testdata'
import { artistData } from '../Artist/Artist.testdata'
import { tracksData } from '../TracksTable/TracksTable.testdata'
import ExpandableList, {
  ALBUMS,
  ARTISTS,
  TRACKS
} from './ExpandableList.svelte'

vi.mock('../../stores/track-queue')

describe('ExpandableList component', () => {
  const clicks$ = {
    subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    next: vi.fn()
  }

  beforeEach(() => {
    location.hash = '#/'
    vi.resetAllMocks()
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

    expect(screen.queryByRole('list')).not.toBeInTheDocument()
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

    const items = screen.getByRole('list').children
    expect(items).toHaveLength(albums.length)
    for (const [i, album] of albums.entries()) {
      expect(within(items[i]).getByText(album.name)).toBeInTheDocument()
    }
  })

  it('does not intercept single clicks on albums', async () => {
    render(
      html`<${ExpandableList}
        kind=${ALBUMS}
        items=${new BehaviorSubject([albumData])}
      />`
    )

    await userEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toBe(`#/album/${albumData.id}`)
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

    await userEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toBe(`#/artist/${artistData.id}`)
    expect(clicks$.next).toHaveBeenCalled()
    expect(clicks$.subscribe).not.toHaveBeenCalled()
  })

  describe('given a long list of tracks', () => {
    const tracks = tracksData.slice(0, 5)
    const items = new BehaviorSubject()
    let component

    beforeEach(() => {
      Element.prototype.getBoundingClientRect = function () {
        return {
          right: Array.from(this.parentNode.children).indexOf(this) * 100
        }
      }
      items.next(tracks)
      // hack: do not use svelte-htm as it wrapps the returned component.
      component = render(ExpandableList, { kind: TRACKS, items }).component
    })

    it('shows them all when expanded', async () => {
      component.$set({ _width: 280 })
      await tick()
      const button = screen.getByText(translate('show all'))
      expect(button).toBeVisible()

      for (const [
        i,
        {
          tags: { title }
        }
      ] of tracks.entries()) {
        const text = screen.getByText(title).closest('button')
        if (i <= 2) {
          expect(text).toBeVisible()
        } else {
          expect(text).not.toBeVisible()
        }
      }

      await userEvent.click(button)

      expect(screen.getByText(translate('show less'))).toBeVisible()
      for (const {
        tags: { title }
      } of tracks) {
        expect(screen.getByText(title).closest('button')).toBeVisible()
      }
      expect(location.hash).toBe(`#/`)
    })

    it('shows only the first line when collapsed', async () => {
      component.$set({ _width: 280 })
      await tick()
      await userEvent.click(screen.getByText(translate('show all')))
      for (const {
        tags: { title }
      } of tracks) {
        expect(screen.getByText(title)).toBeVisible()
      }

      await userEvent.click(screen.getByText(translate('show less')))
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
      expect(location.hash).toBe(`#/`)
    })

    it('resets state when receiving new list', async () => {
      await userEvent.click(screen.getByText(translate('show all')))

      expect(screen.getByText(translate('show less'))).toBeVisible()

      items.next(tracksData.slice(5, 10))
      await sleep()

      expect(screen.getByText(translate('show all'))).toBeVisible()
    })

    it('proxies tracks clicks to track-queue store', async () => {
      const track = tracks[1]
      await userEvent.click(screen.getByText(track.tags.title))

      expect(clicks$.next).toHaveBeenCalledWith(track)
      expect(clicks$.subscribe).toHaveBeenCalled()
      expect(location.hash).toBe(`#/`)
    })
  })
})
