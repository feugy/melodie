'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Album from './Album.svelte'
import { albumData } from './Album.stories'

describe('Album component', () => {
  it('dispatches play event', async () => {
    const handlePlay = jest.fn()
    render(html`<${Album} on:play=${handlePlay} src=${albumData} />`)

    fireEvent.click(screen.getByTestId('play'))

    expect(handlePlay).toHaveBeenCalledWith(
      expect.objectContaining({ detail: albumData })
    )
    expect(handlePlay).toHaveBeenCalledTimes(1)
  })
})
