'use strict'

import { writable } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import MediaSelector from './MediaSelector.svelte'
import { artistData } from '../Artist/Artist.stories'
import { suggestionsData } from '../MediaSelector/MediaSelector.stories'
import { invoke } from '../../utils'
import { sleep, translate } from '../../tests'

jest.mock('../../utils/invoke')

describe('MediaSelector component', () => {
  beforeEach(() => jest.resetAllMocks())

  it('fetches artwork suggestion and display them on open', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    invoke.mockResolvedValueOnce(suggestionsData)

    expect(screen.queryByText(title)).not.toBeVisible()
    open.set(true)

    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(invoke).toHaveBeenCalledWith(
      'mediaManager.findForArtist',
      artistData.name
    )
    expect(invoke).toHaveBeenCalledTimes(1)
    const images = screen.getAllByRole('img')
    for (const { preview } of suggestionsData) {
      expect(
        images.find(node => node.getAttribute('src').includes(preview))
      ).toBeDefined()
    }
  })

  it('invokes media manager with appropriate url on image click', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    invoke.mockResolvedValueOnce(suggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    invoke.mockReset()

    const { preview, full } = suggestionsData[1]
    await fireEvent.click(
      screen
        .getAllByRole('img')
        .find(node => node.getAttribute('src').includes(preview))
    )

    expect(invoke).toHaveBeenCalledWith(
      'mediaManager.saveForArtist',
      artistData.id,
      full
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
    invoke.mockResolvedValueOnce(suggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    expect(invoke).toHaveBeenCalledWith(
      'mediaManager.findForAlbum',
      artistData.name
    )

    const { preview, full } = suggestionsData[1]
    await fireEvent.click(
      screen
        .getAllByRole('img')
        .find(node => node.getAttribute('src').includes(preview))
    )

    expect(invoke).toHaveBeenCalledWith(
      'mediaManager.saveForAlbum',
      artistData.id,
      full
    )

    expect(invoke).toHaveBeenCalledTimes(2)
    expect(screen.queryByText(title)).not.toBeVisible()
  })

  it('closes on cancelation', async () => {
    const open = writable(false)
    const title = translate('choose avatar')
    render(html`<${MediaSelector} bind:open=${open} src=${artistData} />`)
    invoke.mockResolvedValueOnce(suggestionsData)
    open.set(true)
    await sleep()

    expect(screen.queryByText(title)).toBeVisible()
    invoke.mockReset()

    await fireEvent.click(screen.getByText(translate('cancel')))

    expect(invoke).not.toHaveBeenCalled()
    expect(screen.queryByText(title)).not.toBeVisible()
  })
})
