import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  appendTracks,
  list,
  playlists as mockedPlaylists
} from '../../stores/playlists'
import { sleep, translate } from '../../tests'
import { invoke } from '../../utils'
import AddToPlaylist from './AddToPlaylist.svelte'
import { playlistsData } from './AddToPlaylist.testdata'

vi.mock('../../stores/playlists')

describe('AddToPlaylist component', () => {
  const playlists = []
  const tracks = []
  const store = new BehaviorSubject(playlists)
  mockedPlaylists.subscribe = store.subscribe.bind(store)

  beforeEach(() => {
    tracks.splice(
      0,
      tracks.length,
      { id: faker.number.int() },
      { id: faker.number.int() },
      { id: faker.number.int() },
      { id: faker.number.int() }
    )
    vi.resetAllMocks()
    invoke.mockResolvedValueOnce({})
  })

  it('displays only new list option, and fetch playlist list', async () => {
    render(
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${AddToPlaylist} tracks=${tracks} />`
    )

    await userEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('menuitem')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('paragraph'))
    await sleep(350)

    // TODO animation?
    // expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    expect(list).toHaveBeenCalledOnce()
  })

  describe('given some playlists', () => {
    let handleSelect

    beforeEach(() => {
      handleSelect = vi.fn()
      playlists.splice(
        0,
        playlists.length,
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
      )
      store.next(playlists)
    })

    it('displays all existing playlists', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      for (const { name } of playlists) {
        expect(screen.getByText(name)).toBeInTheDocument()
      }
      expect(screen.queryAllByRole('menuitem')).toHaveLength(
        playlists.length + 1
      )
      expect(list).toHaveBeenCalled()
      expect(handleSelect).not.toHaveBeenCalled()
    })

    it('adds all tracks to clicked playlist', async () => {
      const playlist = faker.helpers.arrayElement(playlists)
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      await userEvent.click(screen.getByText(playlist.name))
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ id: playlist.id, tracks })
      expect(appendTracks).toHaveBeenCalledOnce()
      // TODO animation?
      // expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            label: playlist.name,
            id: playlist.id
          }
        })
      )
    })

    it('saves new playlist with all tracks', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      const name = faker.commerce.productName()

      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('textbox'), name)
      await userEvent.click(screen.getByTestId('create-playlist'))
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ name, tracks: tracks })
      expect(appendTracks).toHaveBeenCalledOnce()
      // TODO animation?
      // expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            Component: expect.any(Function),
            props: expect.any(Object)
          }
        })
      )
    })

    it('saves new playlist on enter', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      const name = faker.commerce.productName()

      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('textbox'), name + '{enter}')
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ name, tracks: tracks })
      expect(appendTracks).toHaveBeenCalledOnce()
      // TODO animation?
      // expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            Component: expect.any(Function),
            props: expect.any(Object)
          }
        })
      )
    })

    it('does not save playlist with empty name', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('textbox'), '  {enter}')
      await sleep(350)

      expect(appendTracks).not.toHaveBeenCalled()
      // TODO animation?
      // expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            Component: expect.any(Function),
            props: expect.any(Object)
          }
        })
      )
    })

    it('does not save playlist without name', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      await userEvent.type(screen.getByRole('textbox'), '{enter}')
      await sleep(350)

      expect(appendTracks).not.toHaveBeenCalled()
      // TODO animation?
      // expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
      expect(handleSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            Component: expect.any(Function),
            props: expect.any(Object)
          }
        })
      )
    })
  })

  describe('given many playlists', () => {
    let handleSelect

    beforeEach(() => {
      handleSelect = vi.fn()
      playlists.splice(0, playlists.length, ...playlistsData)
      store.next(playlists)
    })

    it('displays search box and number of existing playlists', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      const menu = screen.queryByRole('menu')

      expect(menu.childElementCount).toBe(3)
      expect(
        screen.getByText(
          translate('_ playlists', { total: playlistsData.length })
        )
      ).toBeInTheDocument()
      expect(screen.getByTestId('search-playlist')).toBeInTheDocument()
      expect(screen.getByTestId('create-playlist')).toBeInTheDocument()
    })

    it('filters possible playlists', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      const menu = screen.queryByRole('menu')

      await userEvent.type(screen.getAllByRole('textbox')[0], 'a')

      expect(menu.childElementCount).toBe(8)
      expect(
        screen.getByText(translate('_ more results', { value: 3 }))
      ).toBeInTheDocument()
      expect(screen.getByText(playlistsData[0].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[1].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[2].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[6].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[7].name)).toBeInTheDocument()
      expect(screen.getByTestId('create-playlist')).toBeInTheDocument()

      await userEvent.type(screen.getAllByRole('textbox')[0], 'l')
      expect(menu.childElementCount).toBe(6)
      expect(screen.getByText(playlistsData[1].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[6].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[8].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[11].name)).toBeInTheDocument()
      expect(screen.getByTestId('create-playlist')).toBeInTheDocument()
    })

    it('can display no results', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      const menu = screen.queryByRole('menu')

      await userEvent.type(screen.getAllByRole('textbox')[0], 'whatever')

      expect(menu.childElementCount).toBe(3)
      expect(screen.getByText(translate('no results'))).toBeInTheDocument()
      expect(screen.getByTestId('create-playlist')).toBeInTheDocument()
    })
  })
})
