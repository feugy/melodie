import { faker } from '@faker-js/faker'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import { tick } from 'svelte'
import html from 'svelte-htm'
import { replace } from 'svelte-spa-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  changes,
  load,
  playlists as mockedPlaylists,
  removals,
  remove,
  save
} from '../../stores/playlists'
import { add } from '../../stores/track-queue'
import { addRefs, translate } from '../../tests'
import { invoke, serverEmitter } from '../../utils'
import playlistRoute from './[id].svelte'

vi.mock('svelte-spa-router')
vi.mock('../../stores/track-queue', () => ({
  add: vi.fn(),
  createClickToAddObservable() {
    return { subscribe: () => ({ unsubscribe: vi.fn() }), next: vi.fn() }
  },
  current: {
    subscribe: () => ({ unsubscribe: () => {} })
  }
}))
vi.mock('../../stores/playlists', () => {
  const { Subject } = require('rxjs')
  return {
    load: vi.fn(),
    changes: new Subject(),
    removals: new Subject(),
    moveTrack: vi.fn(),
    removeTrack: vi.fn(),
    remove: vi.fn(),
    save: vi.fn(),
    playlists: {
      subscribe: () => ({ unsubscribe: () => {} })
    }
  }
})

describe('playlist details route', () => {
  const playlist = {
    id: faker.number.int(),
    name: faker.commerce.productName(),
    refs: [],
    media: null,
    tracks: [
      {
        id: faker.string.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.person.firstName()],
          album: faker.lorem.words(),
          duration: 265
        }
      },
      {
        id: faker.string.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.person.firstName()],
          album: faker.lorem.words(),
          duration: 270
        }
      },
      {
        id: faker.string.uuid(),
        tags: {
          title: faker.commerce.productName(),
          artists: [faker.person.firstName()],
          album: faker.lorem.words(),
          duration: 281
        }
      }
    ].map(addRefs)
  }

  playlist.trackIds = playlist.tracks.map(({ id }) => id)

  function expectDisplayedTracks() {
    for (const track of playlist.tracks) {
      expect(screen.getByText(track.tags.artists[0])).toBeInTheDocument()
      expect(screen.getByText(track.tags.album)).toBeInTheDocument()
      expect(screen.getByText(track.tags.title)).toBeInTheDocument()
    }
  }

  beforeEach(() => {
    const playlists = new BehaviorSubject([playlist])
    mockedPlaylists.subscribe = playlists.subscribe.bind(playlists)
    vi.resetAllMocks()
  })

  it('redirects to playlist list on unknown playlist', async () => {
    load.mockResolvedValueOnce(null)

    render(html`<${playlistRoute} params=${{ id: playlist.id }} />`)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/playlist'))
    expect(load).toHaveBeenCalledWith(playlist.id)
  })

  describe('given a playlist', () => {
    beforeEach(async () => {
      location.hash = `#/playlist/${playlist.id}`
      load.mockResolvedValueOnce(playlist)
      render(html`<${playlistRoute} params=${{ id: playlist.id }} />`)
      await tick()
    })

    it('displays playlist name, total tracks, and total duration', async () => {
      expect(screen.getByText(playlist.name)).toBeInTheDocument()
      expect(
        screen.getByText(
          translate('_ tracks', { total: playlist.trackIds.length }),
          { exact: false }
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText('14 minutes', { exact: false })
      ).toBeInTheDocument()
      expect(load).toHaveBeenCalledWith(playlist.id)
    })

    it('loads tracks and display them', async () => {
      expect(load).toHaveBeenCalledWith(playlist.id)
      expectDisplayedTracks()
      expect(replace).not.toHaveBeenCalled()
    })

    it('enqueues whole playlist', async () => {
      await userEvent.click(screen.getByText(translate('enqueue all')))

      await waitFor(() => expect(add).toHaveBeenCalledWith(playlist.tracks))
      expect(add).toHaveBeenCalledOnce()
      expect(location.hash).toBe(`#/playlist/${playlist.id}`)
    })

    it('plays whole playlist', async () => {
      await userEvent.click(screen.getByText(translate('play all')))

      await waitFor(() =>
        expect(add).toHaveBeenCalledWith(playlist.tracks, true)
      )
      expect(add).toHaveBeenCalledOnce()
      expect(location.hash).toBe(`#/playlist/${playlist.id}`)
    })

    it('can cancel playlist deletion', async () => {
      await userEvent.click(screen.queryByText(translate('delete playlist')))

      expect(screen.queryByText(translate('playlist deletion'))).toBeVisible()
      await userEvent.click(screen.queryByText(translate('no')))

      await waitFor(() =>
        expect(
          screen.queryByText(translate('playlist deletion'))
        ).not.toBeVisible()
      )
      expect(remove).not.toHaveBeenCalled()
    })

    it('deletes the whole playlist', async () => {
      await userEvent.click(screen.queryByText(translate('delete playlist')))

      expect(screen.queryByText(translate('playlist deletion'))).toBeVisible()
      await userEvent.click(screen.queryByText(translate('yes')))
      await waitFor(() => expect(remove).toHaveBeenCalledWith(playlist))
    })

    it('can cancel playlist renamal', async () => {
      await userEvent.click(screen.queryByText(translate('rename playlist')))

      expect(screen.queryByText(translate('playlist renamal'))).toBeVisible()
      await userEvent.click(screen.queryByText(translate('cancel')))

      await waitFor(() =>
        expect(
          screen.queryByText(translate('playlist renamal'))
        ).not.toBeVisible()
      )
      expect(save).not.toHaveBeenCalled()
    })

    it('renames playlist', async () => {
      const name = faker.commerce.productName()
      await userEvent.click(screen.queryByText(translate('rename playlist')))

      expect(screen.queryByText(translate('playlist renamal'))).toBeVisible()
      fireEvent.input(screen.getByRole('textbox'), {
        target: { value: name }
      })
      await userEvent.click(screen.queryByText(translate('save')))
      await waitFor(() =>
        expect(save).toHaveBeenCalledWith({ ...playlist, name })
      )
    })

    it('exports playlist', async () => {
      await userEvent.click(screen.queryByText(translate('export playlist')))

      expect(invoke).toHaveBeenCalledWith(
        'playlists.exportPlaylist',
        playlist.id
      )
      expect(invoke).toHaveBeenCalledOnce()
    })

    it('ignores entered, empty names', async () => {
      await userEvent.click(screen.queryByText(translate('rename playlist')))

      expect(screen.queryByText(translate('playlist renamal'))).toBeVisible()
      fireEvent.input(screen.getByRole('textbox'), {
        target: { value: '' }
      })
      await userEvent.click(screen.queryByText(translate('save')))
      expect(save).not.toHaveBeenCalled()

      await userEvent.click(screen.queryByText(translate('rename playlist')))
      fireEvent.input(screen.getByRole('textbox'), {
        target: { value: '   ' }
      })
      await userEvent.click(screen.queryByText(translate('save')))
      expect(save).not.toHaveBeenCalled()
    })

    it('updates on playlist change', async () => {
      load.mockReset()

      const newName = faker.commerce.productName()
      changes.next([{ ...playlist, name: newName }])

      await waitFor(() =>
        expect(screen.queryByText(playlist.name)).not.toBeInTheDocument()
      )
      expect(screen.getByText(newName)).toBeInTheDocument()
      expect(load).not.toHaveBeenCalled()
    })

    it('ignores changes on other playlist', async () => {
      load.mockReset()

      changes.next([
        {
          ...playlist,
          id: faker.number.int(),
          tracks: undefined
        }
      ])

      await waitFor(() => expectDisplayedTracks())
      expect(load).not.toHaveBeenCalled()
    })

    it('reloads tracks on playlist change', async () => {
      load.mockReset().mockResolvedValueOnce(playlist)

      changes.next([{ ...playlist, tracks: undefined }])

      await waitFor(() => expect(load).toHaveBeenCalledWith(playlist.id))
      expectDisplayedTracks()
      expect(load).toHaveBeenCalledOnce()
    })

    it('redirects to playlist list on removal', async () => {
      removals.next([playlist.id])

      expect(replace).toHaveBeenCalledWith('/playlist')
    })

    it('ignores other playlist removals', async () => {
      removals.next([faker.number.int()])

      expect(replace).not.toHaveBeenCalled()
    })

    it(`updates on playlist's track change`, async () => {
      load.mockReset()
      serverEmitter.next({ event: 'track-changes', args: [playlist.tracks[1]] })
      expect(load).toHaveBeenCalledOnce()
    })

    it('ignores changes on other tracks', async () => {
      load.mockReset()
      serverEmitter.next({
        event: 'track-changes',
        args: [{ id: faker.number.int() }]
      })
      await waitFor(() => expect(load).not.toHaveBeenCalled())
    })
  })
})
