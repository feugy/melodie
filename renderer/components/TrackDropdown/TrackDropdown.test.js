'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import electron from 'electron'
import TrackDropdown from './TrackDropdown.svelte'
import { add } from '../../stores/track-queue'

jest.mock('../../stores/playlists')
jest.mock('../../stores/track-queue')
jest.mock('electron', () => {
  const { EventEmitter } = require('events')
  const ipcRenderer = new EventEmitter()
  ipcRenderer.invoke = jest.fn()
  return { shell: { showItemInFolder: jest.fn() }, ipcRenderer }
})

describe('TrackDropdown component', () => {
  beforeEach(jest.resetAllMocks)

  describe('given an opened dropdown', () => {
    const option = { label: 'Custom item', icon: 'close', act: jest.fn() }
    const track = { id: faker.random.number(), path: faker.system.fileName() }
    const handleShowDetails = jest.fn()

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
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
    })

    it('plays track with dropdown', async () => {
      fireEvent.click(screen.getByText('play_arrow'))

      expect(add).toHaveBeenCalledWith(track, true)
      expect(add).toHaveBeenCalledTimes(1)
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
    })

    it('enqueues track with dropdown', async () => {
      fireEvent.click(screen.getByText('playlist_add'))

      expect(add).toHaveBeenCalledWith(track)
      expect(add).toHaveBeenCalledTimes(1)
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
    })

    it('opens parent folder', async () => {
      fireEvent.click(screen.getByText('launch'))

      expect(electron.shell.showItemInFolder).toHaveBeenCalledWith(track.path)
      expect(handleShowDetails).not.toHaveBeenCalled()
      expect(add).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
    })

    it('dispatches event when opening track details', async () => {
      fireEvent.click(screen.getByText('local_offer'))

      expect(handleShowDetails).toHaveBeenCalledWith(
        expect.objectContaining({ detail: track })
      )
      expect(handleShowDetails).toHaveBeenCalledTimes(1)
      expect(add).not.toHaveBeenCalled()
      expect(electron.shell.showItemInFolder).not.toHaveBeenCalled()
      expect(option.act).not.toHaveBeenCalled()
    })
  })
})
