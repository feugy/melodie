'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Track from './Track.svelte'
import { trackData } from './Track.stories'
import { hash } from '../../utils'
import { sleep } from '../../tests'

describe('Track component', () => {
  beforeEach(() => {
    location.hash = '#/'
  })

  it('has link to artist', async () => {
    const artist = trackData.tags.artists[0]
    render(html`<${Track} src=${trackData} />`)

    fireEvent.click(screen.getByText(artist))
    await sleep()

    expect(location.hash).toEqual(`#/artist/${hash(artist)}`)
  })

  it('has link to album', async () => {
    const { album } = trackData.tags
    render(html`<${Track} src=${trackData} />`)

    fireEvent.click(screen.getByRole('img'))
    await sleep()

    expect(location.hash).toEqual(`#/album/${hash(album)}`)
  })
})
