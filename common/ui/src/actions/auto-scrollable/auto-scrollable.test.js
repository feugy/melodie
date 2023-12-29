import { fireEvent, render, screen } from '@testing-library/svelte'
import html from 'svelte-htm'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep, texts } from '../../tests'
import Scrollable from './auto-scrollable.test.svelte'

describe('autoScrollable action', () => {
  const itemHeight = 30
  let clientHeight
  let scrollHeight
  let scrollTop
  let clientY

  beforeAll(() => {
    Object.defineProperties(window.HTMLOListElement.prototype, {
      clientHeight: { get: () => clientHeight },
      scrollHeight: { get: () => scrollHeight },
      scrollTop: { get: () => scrollTop }
    })
    // JSDom does not support DragEvent, and falls back to Event instead
    Object.defineProperty(Event.prototype, 'clientY', {
      enumerable: true,
      get() {
        return clientY
      }
    })
  })

  beforeEach(() => {
    vi.resetAllMocks()
    clientHeight = (texts.length / 3) * itemHeight
    scrollHeight = texts.length * itemHeight
    scrollTop = 0
  })

  it('automatically scrolls down', async () => {
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = vi.fn()

    clientY = clientHeight - 15
    fireEvent.drag(items[10])
    fireEvent.dragEnd(list)
    await sleep()

    expect(list.scrollBy).toHaveBeenCalledWith({ top: 24 })
  })

  it('does not scrolls down when already at the bottom', async () => {
    scrollTop = scrollHeight - clientHeight
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = vi.fn()

    clientY = clientHeight - 15
    fireEvent.drag(items[20])
    fireEvent.dragEnd(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })

  it('automatically scrolls up', async () => {
    scrollTop = 10 * itemHeight
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = vi.fn()

    clientY = 15
    fireEvent.drag(items[10])
    fireEvent.dragEnd(list)
    await sleep()

    expect(list.scrollBy).toHaveBeenCalledWith({ top: -24 })
  })

  it('does not scrolls up when already at the top', async () => {
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = vi.fn()

    clientY = 15
    fireEvent.drag(items[0])
    fireEvent.dragEnd(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })

  it('does not scrolls when there is no scrollbar', async () => {
    clientHeight = scrollHeight
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = vi.fn()

    clientY = 15
    fireEvent.drag(items[0])
    clientY = clientHeight - 15
    fireEvent.drag(items[29])
    fireEvent.dragEnd(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })

  it('does not scrolls when mouse is not close to borders', async () => {
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = vi.fn()

    clientY = itemHeight * 5
    fireEvent.drag(items[5])
    fireEvent.dragEnd(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })
})
