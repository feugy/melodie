'use strict'

import { screen, render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import faker from 'faker'
import { BehaviorSubject } from 'rxjs'
import TrackDropdown from './TrackDropdown.svelte'
import { add } from '../../stores/track-queue'
import {
  playlists as mockedPlaylists,
  appendTracks
} from '../../stores/playlists'
import { isDesktop } from '../../stores/settings'
import { invoke } from '../../utils'
import { translate, sleep } from '../../tests'

jest.mock('../../stores/playlists')
jest.mock('../../stores/track-queue')

describe('TrackDropdown component', () => {
  beforeEach(jest.resetAllMocks)

  afterEach(() => isDesktop.next(true))

  describe('given an opened dropdown', () => {
    const option = { label: 'Custom item', icon: 'close', act: jest.fn() }
    const track = { id: faker.random.number(), path: faker.system.fileName() }
    const handleShowDetails = jest.fn()
    const playlists = [
      {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.random.number(), faker.random.number()]
      },
      {
        id: faker.random.number(),
        name: faker.commerce.productName(),
        trackIds: [faker.random.number(), faker.random.number()]
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

      await userEvent.click(screen.getByText('more_vert'))
    })

    it('removes track from playlist with dropdown', async () => {
      userEvent.click(screen.getByText(option.label))

      expect(option.act).toHaveBeenCalledWith(track)
      expect(option.act).toHaveBeenCalledTimes(1)
      expect(add).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('plays track with dropdown', async () => {
      userEvent.click(screen.getByText('play_arrow'))

      expect(add).toHaveBeenCalledWith(track, true)
      expect(add).toHaveBeenCalledTimes(1)
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('enqueues track with dropdown', async () => {
      userEvent.click(screen.getByText('playlist_add'))

      expect(add).toHaveBeenCalledWith(track)
      expect(add).toHaveBeenCalledTimes(1)
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('invokes service to open parent folder, on desktop', async () => {
      userEvent.click(screen.getByText('launch'))

      expect(invoke).toHaveBeenCalledWith(
        'tracks.openContainingFolder',
        track.id
      )
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(add).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()

      isDesktop.next(false)
      await sleep(100)
      expect(screen.queryByText('launch')).not.toBeInTheDocument()
    })

    it('dispatches event when opening track details', async () => {
      userEvent.click(screen.getByText('local_offer'))

      expect(handleShowDetails).toHaveBeenCalledWith(
        expect.objectContaining({ detail: track })
      )
      expect(handleShowDetails).toHaveBeenCalledTimes(1)
      expect(add).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('adds track to an existing playlist', async () => {
      userEvent.click(screen.getByText(translate('add to playlist')))
      await sleep(350)
      userEvent.click(screen.getByText(playlists[1].name))
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({
        id: playlists[1].id,
        tracks: [track]
      })
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(add).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    })
  })
})
