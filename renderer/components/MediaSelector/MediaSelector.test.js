'use strict'

import { writable } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import MediaSelector from './MediaSelector.svelte'
import { artistData } from '../Artist/Artist.stories'
import { suggestionsData } from '../MediaSelector/MediaSelector.stories'
import { sleep, translate, mockInvoke } from '../../tests'

jest.mock('../../stores/track-queue')

describe('MediaSelector component', () => {
  beforeEach(() => jest.resetAllMocks())

  it('fetches artwork suggestion and display them on open', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    mockInvoke.mockResolvedValueOnce(suggestionsData)

    expect(screen.queryByText(title)).not.toBeVisible()
    open.set(true)

    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'media',
      'findForArtist',
      artistData.name
    )
    expect(mockInvoke).toHaveBeenCalledTimes(1)
    const images = screen.getAllByRole('img')
    for (const { full, provider } of suggestionsData) {
      expect(
        images.find(node => node.getAttribute('src').includes(full))
      ).toBeDefined()
      expect(screen.queryAllByText(provider).length > 0).toBe(true)
    }
  })

  it('invokes media manager with appropriate url on image click', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    mockInvoke.mockResolvedValueOnce(suggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    mockInvoke.mockReset()

    const { full } = suggestionsData[1]
    await fireEvent.click(
      screen
        .getAllByRole('img')
        .find(node => node.getAttribute('src').includes(full))
    )

    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'media',
      'saveForArtist',
      artistData.id,
      full
    )
    expect(mockInvoke).toHaveBeenCalledTimes(1)
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
    mockInvoke.mockResolvedValueOnce(suggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'media',
      'findForAlbum',
      artistData.name
    )

    const { full } = suggestionsData[1]
    await fireEvent.click(
      screen
        .getAllByRole('img')
        .find(node => node.getAttribute('src').includes(full))
    )

    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'media',
      'saveForAlbum',
      artistData.id,
      full
    )

    expect(mockInvoke).toHaveBeenCalledTimes(2)
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
    mockInvoke.mockResolvedValueOnce(suggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'media',
      'findForAlbum',
      artistData.name
    )

    const path = faker.system.fileName()
    const item = {
      kind: 'file',
      getAsFile: () => ({ path })
    }
    await fireEvent.drop(screen.queryAllByRole('img').pop().closest('span'), {
      dataTransfer: { items: [item] }
    })

    await fireEvent.click(
      screen
        .queryAllByRole('img')
        .find(node => node.getAttribute('src').includes(path))
    )

    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'media',
      'saveForAlbum',
      artistData.id,
      path
    )

    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(title)).not.toBeVisible()
  })

  it('closes on cancelation', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    mockInvoke.mockResolvedValueOnce(suggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    mockInvoke.mockReset()

    await fireEvent.click(screen.getByText(translate('cancel')))

    expect(mockInvoke).not.toHaveBeenCalled()
    expect(screen.queryByText(title)).not.toBeVisible()
  })
})
