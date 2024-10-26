import { faker } from '@faker-js/faker'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import { tick } from 'svelte'
import html from 'svelte-htm'
import * as router from 'svelte-spa-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  connected,
  isDesktop,
  settings,
  toggleBroadcast
} from '../../stores/settings'
import { init as initTotp } from '../../stores/totp'
import { sleep, translate } from '../../tests'
import { invoke } from '../../utils'
import Nav from './Nav.svelte'

vi.mock('../../stores/settings')
vi.mock('qrcode', () => ({ default: { toCanvas: vi.fn() } }))

describe('Nav component', () => {
  const observer = {}
  const isDesktopStore = new BehaviorSubject(true)
  const connectedStore = new BehaviorSubject(true)
  const settingsStore = new BehaviorSubject({ isBroadcasting: false })

  beforeEach(() => {
    location.hash = '#/'
    vi.clearAllMocks()
    observer.observe = vi.fn()
    observer.unobserve = vi.fn()
    window.IntersectionObserver = vi.fn().mockReturnValue(observer)
    isDesktop.subscribe = isDesktopStore.subscribe.bind(isDesktopStore)
    connected.subscribe = connectedStore.subscribe.bind(connectedStore)
    settings.subscribe = settingsStore.subscribe.bind(settingsStore)
    invoke.mockResolvedValue(
      `http://${faker.internet.ipv4()}:${faker.number.int({
        min: 3000,
        max: 9999
      })}`
    )
  })

  it('observes its sentinel', async () => {
    render(html`<${Nav} />`)

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(observer.observe).toHaveBeenCalled()
    expect(observer.observe.mock.calls[0][0]).toHaveClass('sentinel')
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
    expect(nav).toHaveClass('floating')
    expect(observer.observe).toHaveBeenCalled()
  })

  it('navigates to albums', async () => {
    render(html`<${Nav} />`)

    await userEvent.click(screen.getByText(translate('albums')))
    await sleep()

    expect(location.hash).toBe(`#/album`)
  })

  it('navigates to artists', async () => {
    render(html`<${Nav} />`)

    await userEvent.click(screen.getByText(translate('artists')))
    await sleep()

    expect(location.hash).toBe(`#/artist`)
  })

  it('navigates to playlists', async () => {
    render(html`<${Nav} />`)

    await userEvent.click(screen.getByText(translate('playlists')))
    await sleep()

    expect(location.hash).toBe(`#/playlist`)
  })

  it('navigates to settings', async () => {
    render(html`<${Nav} />`)

    await userEvent.click(screen.getByTestId('settings-link'))
    await sleep()

    expect(location.hash).toBe(`#/settings`)
  })

  it('navigates to search page on entered text', async () => {
    const push = vi.spyOn(router, 'push')
    const text = faker.string.alphanumeric(5)
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    fireEvent.input(searchbox, { target: { value: text } })

    expect(searchbox).toHaveValue(text)
    await waitFor(() => expect(push).toHaveBeenCalledOnce())
    expect(location.hash).toBe(`#/search/${encodeURIComponent(text)}`)
  })

  it('considers last entered input as searched text', async () => {
    const push = vi.spyOn(router, 'push')
    const text1 = faker.string.alphanumeric(5)
    const text2 = faker.string.alphanumeric(5)
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    fireEvent.input(searchbox, { target: { value: text1 } })
    fireEvent.input(searchbox, { target: { value: text2 } })

    expect(searchbox).toHaveValue(text2)
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith(`/search/${text2}`)
      expect(push).not.toHaveBeenCalledWith(`/search/${text1}`)
    })
    expect(location.hash).toBe(`#/search/${encodeURIComponent(text2)}`)
  })

  it('navigates again to searched text on enter', async () => {
    const push = vi.spyOn(router, 'push')
    const text = faker.string.alphanumeric(5)
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    fireEvent.input(searchbox, { target: { value: text } })
    await sleep(300)

    fireEvent.keyUp(searchbox, { key: 'Enter' })
    fireEvent.keyUp(searchbox, { key: 'y' })

    expect(searchbox).toHaveValue(text)
    await waitFor(() => expect(push).toHaveBeenCalledTimes(2))
    expect(push).toHaveBeenNthCalledWith(1, `/search/${text}`)
    expect(push).toHaveBeenNthCalledWith(2, `/search/${text}`)
    expect(location.hash).toBe(`#/search/${encodeURIComponent(text)}`)
  })

  it('clears search terms', async () => {
    const push = vi.spyOn(router, 'push')
    const text = faker.string.alphanumeric(5)
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    fireEvent.input(searchbox, { target: { value: text } })
    expect(searchbox).toHaveValue(text)
    await waitFor(() => expect(push).toHaveBeenCalledOnce())

    await userEvent.click(searchbox.previousElementSibling)

    expect(push).toHaveBeenCalledOnce()
    expect(searchbox).toHaveValue('')
    expect(location.hash).toBe(`#/search/${encodeURIComponent(text)}`)
  })

  it('navigates back and forward in history', async () => {
    render(html`<${Nav} />`)
    await sleep()
    expect(location.hash).toBe(`#/`)

    await userEvent.click(screen.getByText(translate('artists')))

    expect(location.hash).toBe(`#/artist`)
    await userEvent.click(screen.getByTestId('backward-link'))

    await waitFor(() => expect(location.hash).toBe(`#/`))
    await userEvent.click(screen.getByTestId('forward-link'))

    await waitFor(() => expect(location.hash).toBe(`#/artist`))
  })

  it('can toggle broadcasting on desktop', async () => {
    initTotp('secret')
    isDesktopStore.next(true)
    toggleBroadcast.mockImplementation(async () => {
      settingsStore.next({ isBroadcasting: true })
    })

    render(html`<${Nav} />`)
    // we need to refresh rendering after the component got the address.
    await tick()
    await tick()
    await tick()

    const broadcastButton = screen.getByTestId('broadcast-button')
    expect(broadcastButton.querySelector('i')).toHaveClass('i-mdi-wifi-off')
    await sleep()

    await userEvent.click(broadcastButton)

    expect(broadcastButton.querySelector('i')).toHaveClass('i-mdi-wifi')

    expect(toggleBroadcast).toHaveBeenCalledOnce()
  })
})
