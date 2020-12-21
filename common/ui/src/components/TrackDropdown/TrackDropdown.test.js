'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import { BehaviorSubject } from 'rxjs'
import TrackDropdown from './TrackDropdown.svelte'
import { add } from '../../stores/track-queue'
import {
  playlists as mockedPlaylists,
  appendTracks
} from '../../stores/playlists'
import { invoke } from '../../utils'
import { translate, sleep } from '../../tests'

jest.mock('../../stores/playlists')
jest.mock('../../stores/track-queue')

describe('TrackDropdown component', () => {
  beforeEach(jest.resetAllMocks)

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

      await fireEvent.click(screen.getByText('more_vert'))
    })

    it('removes track from playlist with dropdown', async () => {
      fireEvent.click(screen.getByText(option.label))

      expect(option.act).toHaveBeenCalledWith(track)
      expect(option.act).toHaveBeenCalledTimes(1)
      expect(add).not.toHaveBeenCalled()
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('plays track with dropdown', async () => {
      fireEvent.click(screen.getByText('play_arrow'))

      expect(add).toHaveBeenCalledWith(track, true)
      expect(add).toHaveBeenCalledTimes(1)
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('enqueues track with dropdown', async () => {
      fireEvent.click(screen.getByText('playlist_add'))

      expect(add).toHaveBeenCalledWith(track)
      expect(add).toHaveBeenCalledTimes(1)
      expect(invoke).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('invokes service to open parent folder', async () => {
      fireEvent.click(screen.getByText('launch'))

      expect(invoke).toHaveBeenCalledWith('tracks.openContainingFolder', track)
      expect(invoke).toHaveBeenCalledTimes(1)
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(add).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
      expect(appendTracks).not.toHaveBeenCalled()
    })

    it('dispatches event when opening track details', async () => {
      fireEvent.click(screen.getByText('local_offer'))

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
      await fireEvent.click(screen.getByText(translate('add to playlist')))
      fireEvent.click(screen.getByText(playlists[1].name))
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
