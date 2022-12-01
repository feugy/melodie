'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import Image from './Image.svelte'
import { tick } from 'svelte'
import { tokenUpdated } from '../../stores/settings'
import { enhanceUrl } from '../../utils'

jest.mock('../../utils')
jest.mock('../../stores/track-queue')
jest.mock('../../stores/settings', () => {
  const { Subject } = require('rxjs')
  return { tokenUpdated: new Subject() }
})

describe('Image component', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    enhanceUrl.mockImplementation(src => src)
  })

  function renderComponent(props = {}) {
    return render(html`<${Image} ...${props} />`)
  }

  it('displays existing image with default dimensions', async () => {
    const src = 'public/icon-512x512.png'
    renderComponent({ src })
    await tick()
    const image = screen.queryByRole('img')
    expect(image).toHaveAttribute('src', src)
    expect(image).toHaveAttribute('width', '256')
    expect(image).toHaveAttribute('height', '256')
    expect(screen.queryByText('music_note')).not.toBeInTheDocument()
    expect(screen.queryByText('person')).not.toBeInTheDocument()
  })

  it('adds nonce', async () => {
    const src = 'public/icon-512x512.png'
    renderComponent({ src, withNonce: true })
    await tick()
    const image = screen.queryByRole('img')
    const encoded = image.getAttribute('src')
    expect(encoded).toMatch(new RegExp(`^${src}#nonce-[\\d\\.]+$`))
  })

  it('enhances urls with token', async () => {
    const src = '/public/icon-512x512.png'
    renderComponent({ src })
    await tick()
    expect(enhanceUrl).toHaveBeenCalledTimes(1)
  })

  it('updates src on token update', async () => {
    const src = 'public/icon-512x512.png'
    renderComponent({ src })
    await tick()
    const image = screen.queryByRole('img')
    const encoded = image.getAttribute('src')
    expect(enhanceUrl).toHaveBeenCalledTimes(1)
    enhanceUrl.mockImplementation(src => `${src}?token=whatever`)
    tokenUpdated.next()
    await tick()
    const newEncoded = image.getAttribute('src')
    expect(newEncoded).not.toEqual(encoded)
    expect(enhanceUrl).toHaveBeenCalledTimes(2)
  })

  it('encodes and adds nonce', async () => {
    const src = 'icon-512#512.png'
    renderComponent({ src, withNonce: true })
    await tick()
    const image = screen.queryByRole('img')
    const encoded = image.getAttribute('src')
    expect(encoded).toMatch(
      new RegExp(`^${encodeURIComponent(src)}#nonce-[\\d\\.]+$`)
    )
  })

  it('updates existing image', async () => {
    const src = 'public/icon-512x512.png'
    const newSrc = 'public/icon-256x256.png'
    const { rerender } = render(Image, { props: { src } })
    await tick()
    let image = screen.queryByRole('img')
    expect(image).toHaveAttribute('src', src)
    rerender({ props: { src: newSrc } })
    await tick()
    image = screen.queryByRole('img')
    expect(image).toHaveAttribute('src', newSrc)
    expect(screen.queryByText('music_note')).not.toBeInTheDocument()
    expect(screen.queryByText('person')).not.toBeInTheDocument()
  })

  it('displays fallback for broken image', async () => {
    const src = 'unknown-cover.jpeg'
    renderComponent({ src })
    const image = screen.queryByRole('img')
    image.dispatchEvent(new ErrorEvent('error'))
    await tick()
    expect(image).toHaveAttribute('src', src)
    expect(screen.getByText('music_note')).toBeInTheDocument()
    expect(screen.queryByText('person')).not.toBeInTheDocument()
  })

  it('displays avatar fallback for broken image', async () => {
    const src = 'unknown-avatar.jpeg'
    renderComponent({ src, rounded: true })
    const image = screen.queryByRole('img')
    image.dispatchEvent(new ErrorEvent('error'))
    await tick()
    expect(image).toHaveAttribute('src', src)
    expect(screen.getByText('person')).toBeInTheDocument()
    expect(screen.queryByText('music_note')).not.toBeInTheDocument()
  })
})
