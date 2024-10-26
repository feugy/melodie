import { faker } from '@faker-js/faker'
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  appendTracks,
  playlists as mockedPlaylists
} from '../../stores/playlists'
import { isDesktop } from '../../stores/settings'
import { add } from '../../stores/track-queue'
import { translate } from '../../tests'
import { invoke } from '../../utils'
import TrackDropdown from './TrackDropdown.svelte'

vi.mock('../../stores/playlists')
vi.mock('../../stores/track-queue')

describe('TrackDropdown component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    isDesktop.next(true)
  })

  describe('given an opened dropdown', () => {
    const option = { label: 'Custom item', icon: 'close', act: vi.fn() }
    const track = { id: faker.number.int(), path: faker.system.fileName() }
    const handleShowDetails = vi.fn()
    const playlists = [
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      },
      {
        id: faker.number.int(),
        name: faker.commerce.productName(),
        trackIds: [faker.number.int(), faker.number.int()]
      }
    ]
    const store = new BehaviorSubject(playlists)
    mockedPlaylists.subscribe = store.subscribe.bind(store)

    beforeEach(async () => {
      render(
        html`<${TrackDropdown}
          track=${track}
          additionalOptions=${[option]}
          on:showDetails=${handleShowDetails}
        />`
      )

      await userEvent.click(screen.getByRole('button'))
    })

    it('removes track from playlist with dropdown', async () => {
      await userEvent.click(screen.getByText(option.label))

      expect(option.act).toHaveBeenCalledWith(track)
      expect(option.act).toHaveBeenCalledOnce()
      expect(add).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('plays track with dropdown', async () => {
      await userEvent.click(screen.getByText(translate('play now')))

      expect(add).toHaveBeenCalledWith(track, true)
      expect(add).toHaveBeenCalledOnce()
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('enqueues track with dropdown', async () => {
      await userEvent.click(screen.getByText(translate('enqueue')))

      expect(add).toHaveBeenCalledWith(track)
      expect(add).toHaveBeenCalledOnce()
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('invokes service to open parent folder, on desktop', async () => {
      await userEvent.click(screen.getByText(translate('open folder')))

      expect(invoke).toHaveBeenCalledWith(
        'tracks.openContainingFolder',
        track.id
      )
      expect(invoke).toHaveBeenCalledOnce()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(add).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()

      isDesktop.next(false)
      await waitFor(() =>
        expect(
          screen.queryByText(translate('open folder'))
        ).not.toBeInTheDocument()
      )
    })

    it('dispatches event when opening track details', async () => {
      await userEvent.click(screen.getByText(translate('show details')))

      expect(handleShowDetails).toHaveBeenCalledWith(
        expect.objectContaining({ detail: track })
      )
      expect(handleShowDetails).toHaveBeenCalledOnce()
      expect(add).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('adds track to an existing playlist', async () => {
      await userEvent.click(screen.getByText(translate('add to playlist')))
      const name = await screen.findByText(playlists[1].name)
      await userEvent.click(name)
      await waitFor(() =>
        expect(appendTracks).toHaveBeenCalledWith({
          id: playlists[1].id,
          tracks: [track]
        })
      )
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(add).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    })
  })
})
