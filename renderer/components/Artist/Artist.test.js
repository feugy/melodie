'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Artist from './Artist.svelte'
import { artistData } from './Artist.stories'

describe('Artist component', () => {
  it('dispatches play events', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    const handleSelect = jest.fn()
    render(
      html`<${Artist}
        on:play=${handlePlay}
        on:enqueue=${handleEnqueue}
        on:select=${handleSelect}
        src=${artistData}
      />`
    )

    fireEvent.click(screen.getByTestId('play'))

    expect(handlePlay).toHaveBeenCalledWith(
      expect.objectContaining({ detail: artistData })
    )
    expect(handlePlay).toHaveBeenCalledTimes(1)
    expect(handleEnqueue).not.toHaveBeenCalled()
    expect(handleSelect).not.toHaveBeenCalled()
  })

  it('dispatches select event', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    const handleSelect = jest.fn()
    render(html`<${Artist}
      on:play=${handlePlay}
      on:enqueue=${handleEnqueue}
      on:select=${handleSelect}
      src=${artistData}
    />`)

    fireEvent.click(screen.getByText(artistData.name))

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: artistData })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handlePlay).not.toHaveBeenCalled()
    expect(handleEnqueue).not.toHaveBeenCalled()
  })

  it('dispatches enqueue event', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    const handleSelect = jest.fn()
    render(html`<${Artist}
      on:play=${handlePlay}
      on:enqueue=${handleEnqueue}
      on:select=${handleSelect}
      src=${artistData}
    />`)

    fireEvent.click(screen.getByTestId('enqueue'))

    expect(handleEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ detail: artistData })
    )
    expect(handleEnqueue).toHaveBeenCalledTimes(1)
    expect(handlePlay).not.toHaveBeenCalled()
    expect(handleSelect).not.toHaveBeenCalled()
  })
})
