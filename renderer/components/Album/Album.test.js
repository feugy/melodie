'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Album from './Album.svelte'
import { albumData } from './Album.stories'
import { hash } from '../../utils'
import { sleep } from '../../tests'

describe('Album component', () => {
  beforeEach(() => {
    location.hash = '#/'
  })

  it('dispatches play events', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    render(
      html`<${Album}
        on:play=${handlePlay}
        on:enqueue=${handleEnqueue}
        src=${albumData}
      />`
    )

    fireEvent.click(screen.getByTestId('play'))

    expect(handlePlay).toHaveBeenCalledWith(
      expect.objectContaining({ detail: albumData })
    )
    expect(handlePlay).toHaveBeenCalledTimes(1)
    expect(handleEnqueue).not.toHaveBeenCalled()
  })

  it('dispatches enqueue event', async () => {
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    render(html`<${Album}
      on:play=${handlePlay}
      on:enqueue=${handleEnqueue}
      src=${albumData}
    />`)

    fireEvent.click(screen.getByTestId('enqueue'))

    expect(handleEnqueue).toHaveBeenCalledWith(
      expect.objectContaining({ detail: albumData })
    )
    expect(handleEnqueue).toHaveBeenCalledTimes(1)
    expect(handlePlay).not.toHaveBeenCalled()
  })

  it('has links to artists', async () => {
    const artist = albumData.linked[0]
    const handlePlay = jest.fn()
    const handleEnqueue = jest.fn()
    render(html`<${Album}
      on:play=${handlePlay}
      on:enqueue=${handleEnqueue}
      src=${albumData}
    />`)

    fireEvent.click(screen.getByText(artist))
    await sleep()

    expect(handleEnqueue).not.toHaveBeenCalled()
    expect(handlePlay).not.toHaveBeenCalled()
    expect(location.hash).toEqual(`#/artist/${hash(artist)}`)
  })
})
