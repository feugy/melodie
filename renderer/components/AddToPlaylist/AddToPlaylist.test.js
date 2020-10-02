'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
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
import { sleep, mockInvoke } from '../../tests'

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
      { id: faker.random.number() },
      { id: faker.random.number() },
      { id: faker.random.number() },
      { id: faker.random.number() }
    )
    jest.resetAllMocks()
    mockInvoke.mockResolvedValueOnce({})
  })

  it('displays only new list option, and fetch playlist list', async () => {
    render(
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${AddToPlaylist} tracks=${tracks} />`
    )

    await fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(1)

    fireEvent.click(screen.getByTestId('paragraph'))
    await sleep(350)

    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
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
          id: faker.random.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.random.number(), faker.random.number()]
        },
        {
          id: faker.random.number(),
          name: faker.commerce.productName(),
          trackIds: [faker.random.number(), faker.random.number()]
        }
      )
      store.next(playlists)
    })

    it('displays all existing playlists', async () => {
      render(
        html`<${AddToPlaylist} tracks=${tracks} on:select=${handleSelect} />`
      )

      await fireEvent.click(screen.getByRole('button'))

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      for (const { name } of playlists) {
        expect(screen.getByText(name)).toBeInTheDocument()
      }
      expect(screen.queryAllByRole('listitem')).toHaveLength(
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

      await fireEvent.click(screen.getByRole('button'))
      fireEvent.click(screen.getByText(playlist.name))
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ id: playlist.id, tracks })
      expect(appendTracks).toHaveBeenCalledTimes(1)
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
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

      await fireEvent.click(screen.getByRole('button'))
      userEvent.type(screen.getByRole('textbox'), name)
      fireEvent.click(screen.getByText('add_box'))
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ name, tracks: tracks })
      expect(appendTracks).toHaveBeenCalledTimes(1)
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
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

      await fireEvent.click(screen.getByRole('button'))
      userEvent.type(screen.getByRole('textbox'), name + '{enter}')
      await sleep(350)

      expect(appendTracks).toHaveBeenCalledWith({ name, tracks: tracks })
      expect(appendTracks).toHaveBeenCalledTimes(1)
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
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

      await fireEvent.click(screen.getByRole('button'))
      userEvent.type(screen.getByRole('textbox'), '  {enter}')
      await sleep(350)

      expect(appendTracks).not.toHaveBeenCalled()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
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

      await fireEvent.click(screen.getByRole('button'))
      userEvent.type(screen.getByRole('textbox'), '{enter}')
      await sleep(350)

      expect(appendTracks).not.toHaveBeenCalled()
      expect(screen.queryAllByRole('listitem')).toHaveLength(0)
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
})
