import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { translate } from '../../tests'
import Track from './Track.svelte'
import { trackData } from './Track.testdata'

vi.mock('../../stores/playlists')

describe('Track component', () => {
  beforeEach(() => {
    location.hash = '#/'
  })

  it('has link to artist', async () => {
    const [id, artist] = trackData.artistRefs[0]
    render(html`<${Track} src=${trackData} />`)

    await userEvent.click(screen.getByText(artist))

    await waitFor(() => expect(location.hash).toBe(`#/artist/${id}`))
  })

  it('has link to album', async () => {
    const [id] = trackData.albumRef
    render(html`<${Track} src=${trackData} />`)

    await userEvent.click(screen.getByRole('img').closest('a'))

    await waitFor(() => expect(location.hash).toBe(`#/album/${id}`))
  })

  it('dispatches track dropdown showDetails event', async () => {
    const handleShowDetails = vi.fn()
    render(
      html`<${Track}
        src=${trackData}
        withMenu="true"
        on:showDetails=${handleShowDetails}
      />`
    )

    await userEvent.click(screen.getByTestId('track-dropdown'))
    await userEvent.click(screen.getByText(translate('show details')))

    expect(handleShowDetails).toHaveBeenCalledWith(
      expect.objectContaining({ detail: trackData })
    )
    expect(handleShowDetails).toHaveBeenCalledOnce()
  })
})
