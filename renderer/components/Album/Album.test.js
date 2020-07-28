'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Album from './Album.svelte'
import { albumData } from './Album.stories'

describe('Album component', () => {
  it('dispatches play events', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    const handleSelect = jest.fn()
    render(
      html`<${Album}
        on:play=${handlePlay}
        on:enqueue=${handleEnqueue}
        on:select=${handleSelect}
        src=${albumData}
      />`
    )

    fireEvent.click(screen.getByTestId('play'))

    expect(handlePlay).toHaveBeenCalledWith(
      expect.objectContaining({ detail: albumData })
    )
    expect(handlePlay).toHaveBeenCalledTimes(1)
    expect(handleEnqueue).not.toHaveBeenCalled()
    expect(handleSelect).not.toHaveBeenCalled()
  })

  it('dispatches select event', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    const handleSelect = jest.fn()
    render(html`<${Album}
      on:play=${handlePlay}
      on:enqueue=${handleEnqueue}
      on:select=${handleSelect}
      src=${albumData}
    />`)

    fireEvent.click(screen.getByText(albumData.name))

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: albumData })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handlePlay).not.toHaveBeenCalled()
    expect(handleEnqueue).not.toHaveBeenCalled()
  })

  it('dispatches enqueue event', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    const handleSelect = jest.fn()
    render(html`<${Album}
      on:play=${handlePlay}
      on:enqueue=${handleEnqueue}
      on:select=${handleSelect}
      src=${albumData}
    />`)

    fireEvent.click(screen.getByTestId('enqueue'))

    expect(handleEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ detail: albumData })
    )
    expect(handleEnqueue).toHaveBeenCalledTimes(1)
    expect(handlePlay).not.toHaveBeenCalled()
    expect(handleSelect).not.toHaveBeenCalled()
  })
})
