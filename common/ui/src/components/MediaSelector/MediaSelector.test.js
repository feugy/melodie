'use strict'

import { writable } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import MediaSelector from './MediaSelector.svelte'
import { artistData } from '../Artist/Artist.stories'
import {
  artistSuggestionsData,
  albumSuggestionsData
} from '../MediaSelector/MediaSelector.stories'
import { invoke } from '../../utils'
import { isDesktop } from '../../stores/settings'
import { sleep, translate } from '../../tests'

jest.mock('../../stores/track-queue')

describe('MediaSelector component', () => {
  beforeEach(() => jest.resetAllMocks())

  afterEach(() => isDesktop.next(true))

  it('fetches artwork suggestion and display them on open', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    invoke.mockResolvedValueOnce(artistSuggestionsData)

    expect(screen.queryByText(title)).not.toBeVisible()
    open.set(true)

    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(invoke).toHaveBeenCalledWith('media.findForArtist', artistData.name)
    expect(invoke).toHaveBeenCalledTimes(1)
    const images = screen.getAllByRole('img')
    for (const { artwork, provider } of artistSuggestionsData) {
      expect(
        images.find(node => node.getAttribute('src').includes(artwork))
      ).toBeDefined()
      expect(screen.queryAllByText(provider).length > 0).toBe(true)
    }
  })

  it('invokes media manager with appropriate url on image click', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    invoke.mockResolvedValueOnce(artistSuggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    invoke.mockReset()

    const { artwork } = artistSuggestionsData[1]
    await fireEvent.click(
      screen
        .getAllByRole('img')
        .find(node => node.getAttribute('src').includes(artwork))
    )

    expect(invoke).toHaveBeenCalledWith(
      'media.saveForArtist',
      artistData.id,
      artwork
    )
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(title)).not.toBeVisible()
  })

  it('invokes media manager with appropriate model name', async () => {
    const open = writable(false)
    const title = translate('choose cover')
    render(
      html`<${MediaSelector}
        bind:open=${open}
        forArtist=${false}
        src=${artistData}
      />`
    )
    invoke.mockResolvedValueOnce(albumSuggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(invoke).toHaveBeenCalledWith('media.findForAlbum', artistData.name)

    const { cover } = albumSuggestionsData[1]
    await fireEvent.click(
      screen
        .getAllByRole('img')
        .find(node => node.getAttribute('src').includes(cover))
    )

    expect(invoke).toHaveBeenCalledWith(
      'media.saveForAlbum',
      artistData.id,
      cover
    )

    expect(invoke).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(title)).not.toBeVisible()
  })

  it('invokes media manager with dropped file', async () => {
    const open = writable(false)
    const title = translate('choose cover')
    render(
      html`<${MediaSelector}
        bind:open=${open}
        forArtist=${false}
        src=${artistData}
      />`
    )
    invoke.mockResolvedValueOnce(albumSuggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(invoke).toHaveBeenCalledWith('media.findForAlbum', artistData.name)

    const path = faker.system.fileName()
    const item = {
      kind: 'file',
      getAsFile: () => ({ path })
    }
    await fireEvent.drop(screen.queryByText('add_box'), {
      dataTransfer: { items: [item] }
    })

    await fireEvent.click(
      screen
        .queryAllByRole('img')
        .find(node => node.getAttribute('src').includes(path))
    )

    expect(invoke).toHaveBeenCalledWith(
      'media.saveForAlbum',
      artistData.id,
      path
    )

    expect(invoke).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(title)).not.toBeVisible()
  })

  it('allows uploading files on desktop', async () => {
    isDesktop.next(false)
    const open = writable(false)
    const title = translate('choose cover')
    render(
      html`<${MediaSelector}
        bind:open=${open}
        forArtist=${false}
        src=${artistData}
      />`
    )
    invoke.mockResolvedValueOnce(albumSuggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(screen.queryByText('add_box')).not.toBeInTheDocument()
    expect(invoke).toHaveBeenCalledWith('media.findForAlbum', artistData.name)
  })

  it('closes on cancelation', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    invoke.mockResolvedValueOnce(artistSuggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    invoke.mockReset()

    await fireEvent.click(screen.getByText(translate('cancel')))

    expect(invoke).not.toHaveBeenCalled()
    expect(screen.queryByText(title)).not.toBeVisible()
  })
})
