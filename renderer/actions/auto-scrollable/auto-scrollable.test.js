'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Scrollable, { texts } from './auto-scrollable.stories.svelte'
import { sleep } from '../../tests'

describe('autoScrollable action', () => {
  const itemHeight = 30
  let clientHeight
  let scrollHeight
  let scrollTop

  beforeAll(() => {
    Object.defineProperties(window.HTMLOListElement.prototype, {
      clientHeight: { get: () => clientHeight },
      scrollHeight: { get: () => scrollHeight },
      scrollTop: { get: () => scrollTop }
    })
  })

  beforeEach(() => {
    jest.resetAllMocks()
    clientHeight = (texts.length / 3) * itemHeight
    scrollHeight = texts.length * itemHeight
    scrollTop = 0
  })

  it('automatically scrolls down', async () => {
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = jest.fn()

    await fireEvent.mouseEnter(list)
    await fireEvent.mouseMove(items[10], { clientY: clientHeight - 15 })
    await fireEvent.mouseLeave(list)
    await sleep()

    expect(list.scrollBy).toHaveBeenCalledWith({ top: 40 })
  })

  it('does not scrolls down when already at the bottom', async () => {
    scrollTop = scrollHeight - clientHeight
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = jest.fn()

    await fireEvent.mouseEnter(list)
    await fireEvent.mouseMove(items[20], { clientY: clientHeight - 15 })
    await fireEvent.mouseLeave(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })

  it('automatically scrolls up', async () => {
    scrollTop = 10 * itemHeight
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = jest.fn()

    await fireEvent.mouseEnter(list)
    await fireEvent.mouseMove(items[10], { clientY: 15 })
    await fireEvent.mouseLeave(list)
    await sleep()

    expect(list.scrollBy).toHaveBeenCalledWith({ top: -40 })
  })

  it('does not scrolls up when already at the top', async () => {
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = jest.fn()

    await fireEvent.mouseEnter(list)
    await fireEvent.mouseMove(items[0], { clientY: 15 })
    await fireEvent.mouseLeave(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })

  it('does not scrolls when there is no scrollbar', async () => {
    clientHeight = scrollHeight
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = jest.fn()

    await fireEvent.mouseEnter(list)
    await fireEvent.mouseMove(items[0], { clientY: 15 })
    await fireEvent.mouseMove(items[29], { clientY: clientHeight - 15 })
    await fireEvent.mouseLeave(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })

  it('does not scrolls when mouse is not close to borders', async () => {
    render(html`<${Scrollable} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = jest.fn()

    await fireEvent.mouseEnter(list)
    await fireEvent.mouseMove(items[5], { clientY: itemHeight * 5 })
    await fireEvent.mouseLeave(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })

  it('does not scroll when disabled', async () => {
    scrollTop = 10 * itemHeight
    render(html`<${Scrollable} enabled=${false} />`)
    const items = screen.queryAllByRole('listitem')
    const list = items[0].closest('ol')
    list.scrollBy = jest.fn()

    await fireEvent.mouseEnter(list)
    await fireEvent.mouseMove(items[10], { clientY: 15 })
    await fireEvent.mouseMove(items[20], { clientY: clientHeight - 15 })
    await fireEvent.mouseLeave(list)
    await sleep()

    expect(list.scrollBy).not.toHaveBeenCalled()
  })
})
