'use strict'

import { render, screen, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { push } from 'svelte-spa-router'
import Nav from './Nav.svelte'
import { sleep } from '../../tests'

jest.mock('svelte-spa-router')

describe('Album component', () => {
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

    fireEvent.click(screen.getByRole('button'))

    expect(push).toHaveBeenCalledWith(`/album`)
  })
})
