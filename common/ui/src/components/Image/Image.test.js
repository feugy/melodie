import { render, screen } from '@testing-library/svelte'
import { tick } from 'svelte'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { tokenUpdated } from '../../stores/settings'
import { enhanceUrl } from '../../utils'
import Image from './Image.svelte'

vi.mock('../../utils')
vi.mock('../../stores/track-queue')
vi.mock('../../stores/settings', () => {
  const { Subject } = require('rxjs')
  return { tokenUpdated: new Subject() }
})

describe('Image component', () => {
  beforeEach(() => {
    vi.resetAllMocks()
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
    expect(screen.queryByTestId('i-mdi-music-note')).not.toBeInTheDocument()
    expect(screen.queryByTestId('i-mdi-account')).not.toBeInTheDocument()
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
    expect(enhanceUrl).toHaveBeenCalledOnce()
  })

  it('updates src on token update', async () => {
    const src = 'public/icon-512x512.png'
    renderComponent({ src })
    await tick()
    const image = screen.queryByRole('img')
    const encoded = image.getAttribute('src')
    expect(enhanceUrl).toHaveBeenCalledOnce()
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
    expect(screen.queryByTestId('i-mdi-music-note')).not.toBeInTheDocument()
    expect(screen.queryByTestId('i-mdi-account')).not.toBeInTheDocument()
  })

  it('displays fallback for broken image', async () => {
    const src = 'unknown-cover.jpeg'
    renderComponent({ src })
    const image = screen.queryByRole('img')
    image.dispatchEvent(new ErrorEvent('error'))
    await tick()
    expect(image).toHaveAttribute('src', src)
    expect(screen.getByTestId('i-mdi-music-note')).toBeInTheDocument()
    expect(screen.queryByTestId('i-mdi-account')).not.toBeInTheDocument()
  })

  it('displays avatar fallback for broken image', async () => {
    const src = 'unknown-avatar.jpeg'
    renderComponent({ src, rounded: true })
    const image = screen.queryByRole('img')
    image.dispatchEvent(new ErrorEvent('error'))
    await tick()
    expect(image).toHaveAttribute('src', src)
    expect(screen.getByTestId('i-mdi-account')).toBeInTheDocument()
    expect(screen.queryByTestId('i-mdi-music-note')).not.toBeInTheDocument()
  })
})
