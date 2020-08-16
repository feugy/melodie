'use strict'

import { render, screen, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { push } from 'svelte-spa-router'
import faker from 'faker'
import Nav from './Nav.svelte'
import { sleep, translate } from '../../tests'

jest.mock('svelte-spa-router')

describe('Nav component', () => {
  const observer = {
    observe: jest.fn(),
    unobserve: jest.fn()
  }

  beforeEach(() => {
    jest.resetAllMocks()
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

    expect(push).toHaveBeenCalledWith(`/album`)
  })

  it('navigates to artists', async () => {
    render(html`<${Nav} />`)

    fireEvent.click(screen.getByText(translate('artists')))

    expect(push).toHaveBeenCalledWith(`/artist`)
  })

  it('navigates to search page on entered text', async () => {
    const text = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    await fireEvent.input(searchbox, { target: { value: text } })
    await sleep(300)

    expect(searchbox.value).toEqual(text)
    expect(push).toHaveBeenCalledWith(`/search/${text}`)
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('considers last entered input as searched text', async () => {
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
  })

  it('navigates again to searched text on enter', async () => {
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
  })

  it('clears search terms', async () => {
    const text = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    await fireEvent.input(searchbox, { target: { value: text } })
    expect(searchbox.value).toEqual(text)
    await sleep(300)

    await fireEvent.click(searchbox.previousElementSibling)

    expect(push).toHaveBeenCalledWith(`/search/${text}`)
    expect(push).toHaveBeenCalledTimes(1)
    expect(searchbox.value).toEqual('')
  })
})
