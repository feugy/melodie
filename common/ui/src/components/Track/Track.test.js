'use strict'

import { screen, render } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import Track from './Track.svelte'
import { trackData } from './Track.stories'
import { sleep } from '../../tests'

describe('Track component', () => {
  beforeEach(() => {
    location.hash = '#/'
  })

  it('has link to artist', async () => {
    const [id, artist] = trackData.artistRefs[0]
    render(html`<${Track} src=${trackData} />`)

    userEvent.click(screen.getByText(artist))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${id}`)
  })

  it('has link to album', async () => {
    const [id] = trackData.albumRef
    render(html`<${Track} src=${trackData} />`)

    userEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/album/${id}`)
  })

  it('dispatches track dropdown showDetails event', async () => {
    const handleShowDetails = jest.fn()
    render(
      html`<${Track}
        src=${trackData}
        withMenu="true"
        on:showDetails=${handleShowDetails}
      />`
    )

    await userEvent.click(screen.getByRole('button'))
    userEvent.click(screen.getByText('local_offer'))

    expect(handleShowDetails).toHaveBeenCalledWith(
      expect.objectContaining({ detail: trackData })
    )
    expect(handleShowDetails).toHaveBeenCalledTimes(1)
  })
})
