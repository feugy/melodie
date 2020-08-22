'use strict'

import { render, screen, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import * as router from 'svelte-spa-router'
import faker from 'faker'
import Nav from './Nav.svelte'
import { sleep, translate } from '../../tests'

describe('Nav component', () => {
  const observer = {}

  beforeEach(() => {
    location.hash = '#/'
    jest.clearAllMocks()
    observer.observe = jest.fn()
    observer.unobserve = jest.fn()
    window.IntersectionObserver = jest.fn().mockReturnValue(observer)
  })

  it('observes its sentinel', async () => {
    render(html`<${Nav} />`)

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(observer.observe).toHaveBeenCalled()
    expect(observer.observe.mock.calls[0][0].className).toEqual(
      expect.stringContaining('sentinel')
    )
  })

  it('floats on sentinel intersaction', async () => {
    window.IntersectionObserver.mockImplementation(listener => {
      setTimeout(listener, 0, [{ isIntersecting: false }])
      return observer
    })
    render(html`<${Nav} />`)
    await sleep()

    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(nav.className).toEqual(expect.stringContaining('floating'))
    expect(observer.observe).toHaveBeenCalled()
  })

  it('navigates to albums', async () => {
    render(html`<${Nav} />`)

    fireEvent.click(screen.getByText(translate('albums')))
    await sleep()

    expect(location.hash).toEqual(`#/album`)
  })

  it('navigates to artists', async () => {
    render(html`<${Nav} />`)

    fireEvent.click(screen.getByText(translate('artists')))
    await sleep()

    expect(location.hash).toEqual(`#/artist`)
  })

  it('navigates to settings', async () => {
    render(html`<${Nav} />`)

    fireEvent.click(screen.getByText('settings'))
    await sleep()

    expect(location.hash).toEqual(`#/settings`)
  })

  it('navigates to search page on entered text', async () => {
    const push = jest.spyOn(router, 'push')
    const text = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    await fireEvent.input(searchbox, { target: { value: text } })
    await sleep(300)

    expect(searchbox.value).toEqual(text)
    expect(location.hash).toEqual(`#/search/${encodeURIComponent(text)}`)
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('considers last entered input as searched text', async () => {
    const push = jest.spyOn(router, 'push')
    const text1 = faker.random.word()
    const text2 = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    await fireEvent.input(searchbox, { target: { value: text1 } })
    await fireEvent.input(searchbox, { target: { value: text2 } })
    await sleep(300)

    expect(searchbox.value).toEqual(text2)
    expect(push).toHaveBeenCalledWith(`/search/${text2}`)
    expect(push).not.toHaveBeenCalledWith(`/search/${text1}`)
    expect(location.hash).toEqual(`#/search/${encodeURIComponent(text2)}`)
  })

  it('navigates again to searched text on enter', async () => {
    const push = jest.spyOn(router, 'push')
    const text = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    await fireEvent.input(searchbox, { target: { value: text } })
    await sleep(300)

    await fireEvent.keyUp(searchbox, { key: 'Enter' })
    await fireEvent.keyUp(searchbox, { key: 'y' })
    await sleep(300)

    expect(searchbox.value).toEqual(text)
    expect(push).toHaveBeenNthCalledWith(1, `/search/${text}`)
    expect(push).toHaveBeenNthCalledWith(2, `/search/${text}`)
    expect(push).toHaveBeenCalledTimes(2)
    expect(location.hash).toEqual(`#/search/${encodeURIComponent(text)}`)
  })

  it('clears search terms', async () => {
    const push = jest.spyOn(router, 'push')
    const text = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    await fireEvent.input(searchbox, { target: { value: text } })
    expect(searchbox.value).toEqual(text)
    await sleep(300)

    await fireEvent.click(searchbox.previousElementSibling)
    await sleep()

    expect(push).toHaveBeenCalledTimes(1)
    expect(searchbox.value).toEqual('')
    expect(location.hash).toEqual(`#/search/${encodeURIComponent(text)}`)
  })

  it('navigates back and forward in history', async () => {
    render(html`<${Nav} />`)
    await sleep()
    expect(location.hash).toEqual(`#/`)

    fireEvent.click(screen.getByText(translate('artists')))
    await sleep()

    expect(location.hash).toEqual(`#/artist`)
    fireEvent.click(screen.getAllByRole('button')[0])
    await sleep(10)

    expect(location.hash).toEqual(`#/`)
    fireEvent.click(screen.getAllByRole('button')[1])
    await sleep(10)

    expect(location.hash).toEqual(`#/artist`)
  })
})
