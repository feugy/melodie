'use strict'

import { screen, render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import faker from 'faker'
import { BehaviorSubject } from 'rxjs'
import AddToPlaylist from './AddToPlaylist.svelte'
import {
  playlists as mockedPlaylists,
  list,
  appendTracks
} from '../../stores/playlists'
import { invoke } from '../../utils'
import { sleep, translate } from '../../tests'
import { playlistsData } from './AddToPlaylist.testdata'

jest.mock('../../stores/playlists')

describe('AddToPlaylist component', () => {
  const playlists = []
  const tracks = []
  const store = new BehaviorSubject(playlists)
  mockedPlaylists.subscribe = store.subscribe.bind(store)

  beforeEach(() => {
    tracks.splice(
      0,
      tracks.length,
      { id: faker.datatype.number() },
      { id: faker.datatype.number() },
      { id: faker.datatype.number() },
      { id: faker.datatype.number() }
    )
    jest.resetAllMocks()
    invoke.mockResolvedValueOnce({})
  })

  it('displays only new list option, and fetch playlist list', async () => {
    render(
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${AddToPlaylist} tracks=${tracks} />`
    )

    await userEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByRole('menuitem')).toBeInTheDocument()

    userEvent.click(screen.getByTestId('paragraph'))
    await sleep(350)

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    expect(list).toHaveBeenCalled()
  })

  describe('given some playlists', () => {
    let handleSelect

    beforeEach(() => {
      handleSelect = jest.fn()
      playlists.splice(
        0,
        playlists.length,
        {
          id: faker.datatype.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.datatype.number(), faker.datatype.number()]
        },
        {
          id: faker.datatype.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.datatype.number(), faker.datatype.number()]
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
      const playlist = faker.random.arrayElement(playlists)
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      userEvent.click(screen.getByText(playlist.name))
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ id: playlist.id, tracks })
      expect(appendTracks).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
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
      userEvent.click(screen.getByText('add_box'))
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ name, tracks: tracks })
      expect(appendTracks).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
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
      userEvent.type(screen.getByRole('textbox'), name + '{enter}')
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ name, tracks: tracks })
      expect(appendTracks).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
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
      userEvent.type(screen.getByRole('textbox'), '  {enter}')
      await sleep(350)

      expect(appendTracks).not.toHaveBeenCalled()
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
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
      userEvent.type(screen.getByRole('textbox'), '{enter}')
      await sleep(350)

      expect(appendTracks).not.toHaveBeenCalled()
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
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
      handleSelect = jest.fn()
      playlists.splice(0, playlists.length, ...playlistsData)
      store.next(playlists)
    })

    it('displays search box and number of existing playlists', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      const menu = screen.queryByRole('menu')

      expect(menu.childElementCount).toEqual(3)
      expect(
        screen.getByText(
          translate('_ playlists', { total: playlistsData.length })
        )
      ).toBeInTheDocument()
      expect(screen.getByText('search')).toBeInTheDocument()
      expect(screen.getByText('add_box')).toBeInTheDocument()
    })

    it('filters possible playlists', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      const menu = screen.queryByRole('menu')

      await userEvent.type(screen.getAllByRole('textbox')[0], 'a')

      expect(menu.childElementCount).toEqual(8)
      expect(
        screen.getByText(translate('_ more results', { value: 3 }))
      ).toBeInTheDocument()
      expect(screen.getByText(playlistsData[0].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[1].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[2].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[6].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[7].name)).toBeInTheDocument()
      expect(screen.getByText('add_box')).toBeInTheDocument()

      await userEvent.type(screen.getAllByRole('textbox')[0], 'l')
      expect(menu.childElementCount).toEqual(6)
      expect(screen.getByText(playlistsData[1].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[6].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[8].name)).toBeInTheDocument()
      expect(screen.getByText(playlistsData[11].name)).toBeInTheDocument()
      expect(screen.getByText('add_box')).toBeInTheDocument()
    })

    it('can display no results', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await userEvent.click(screen.getByRole('button'))
      const menu = screen.queryByRole('menu')

      await userEvent.type(screen.getAllByRole('textbox')[0], 'whatever')

      expect(menu.childElementCount).toEqual(3)
      expect(screen.getByText(translate('no results'))).toBeInTheDocument()
      expect(screen.getByText('add_box')).toBeInTheDocument()
    })
  })
})
