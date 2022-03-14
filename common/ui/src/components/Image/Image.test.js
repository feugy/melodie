'use strict'

import { screen, render } from '@testing-library/svelte'
import html from 'svelte-htm'
import Image from './Image.svelte'
import { tick } from 'svelte'

jest.mock('../../stores/track-queue')

describe('Image component', () => {
  beforeEach(jest.resetAllMocks)

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
    expect(image).toHaveAttribute('src', '')
    expect(screen.getByText('music_note')).toBeInTheDocument()
    expect(screen.queryByText('person')).not.toBeInTheDocument()
  })

  it('displays avatar fallback for broken image', async () => {
    const src = 'unknown-avatar.jpeg'
    renderComponent({ src, rounded: true })
    const image = screen.queryByRole('img')
    image.dispatchEvent(new ErrorEvent('error'))
    await tick()
    expect(image).toHaveAttribute('src', '')
    expect(screen.getByText('person')).toBeInTheDocument()
    expect(screen.queryByText('music_note')).not.toBeInTheDocument()
  })
})
