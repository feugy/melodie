'use strict'

import { render, screen, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import * as router from 'svelte-spa-router'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import Nav from './Nav.svelte'
import {
  isDesktop,
  connected,
  settings,
  toggleBroadcast
} from '../../stores/settings'
import { invoke } from '../../utils'
import { sleep, translate } from '../../tests'

jest.mock('../../stores/settings')
jest.mock('qrcode', () => ({ default: { toCanvas: jest.fn() } }))

describe('Nav component', () => {
  const observer = {}
  const isDesktopStore = new BehaviorSubject(true)
  const connectedStore = new BehaviorSubject(true)
  const settingsStore = new BehaviorSubject({ isBroadcasting: false })

  beforeEach(() => {
    location.hash = '#/'
    jest.clearAllMocks()
    observer.observe = jest.fn()
    observer.unobserve = jest.fn()
    window.IntersectionObserver = jest.fn().mockReturnValue(observer)
    isDesktop.subscribe = isDesktopStore.subscribe.bind(isDesktopStore)
    connected.subscribe = connectedStore.subscribe.bind(connectedStore)
    settings.subscribe = settingsStore.subscribe.bind(settingsStore)
    invoke.mockResolvedValue(
      `http://${faker.internet.ip()}:${faker.random.number({
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

  it('navigates to playlists', async () => {
    render(html`<${Nav} />`)

    fireEvent.click(screen.getByText(translate('playlists')))
    await sleep()

    expect(location.hash).toEqual(`#/playlist`)
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

    fireEvent.input(searchbox, { target: { value: text } })
    await sleep(300)

    expect(searchbox).toHaveValue(text)
    expect(location.hash).toEqual(`#/search/${encodeURIComponent(text)}`)
    expect(push).toHaveBeenCalledTimes(1)
  })

  it('considers last entered input as searched text', async () => {
    const push = jest.spyOn(router, 'push')
    const text1 = faker.random.word()
    const text2 = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    fireEvent.input(searchbox, { target: { value: text1 } })
    fireEvent.input(searchbox, { target: { value: text2 } })
    await sleep(300)

    expect(searchbox).toHaveValue(text2)
    expect(push).toHaveBeenCalledWith(`/search/${text2}`)
    expect(push).not.toHaveBeenCalledWith(`/search/${text1}`)
    expect(location.hash).toEqual(`#/search/${encodeURIComponent(text2)}`)
  })

  it('navigates again to searched text on enter', async () => {
    const push = jest.spyOn(router, 'push')
    const text = faker.random.word()
    render(html`<${Nav} />`)
    const searchbox = screen.getByRole('searchbox')

    fireEvent.input(searchbox, { target: { value: text } })
    await sleep(300)

    fireEvent.keyUp(searchbox, { key: 'Enter' })
    fireEvent.keyUp(searchbox, { key: 'y' })
    await sleep(300)

    expect(searchbox).toHaveValue(text)
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

    fireEvent.input(searchbox, { target: { value: text } })
    expect(searchbox).toHaveValue(text)
    await sleep(300)

    fireEvent.click(searchbox.previousElementSibling)
    await sleep()

    expect(push).toHaveBeenCalledTimes(1)
    expect(searchbox).toHaveValue('')
    expect(location.hash).toEqual(`#/search/${encodeURIComponent(text)}`)
  })

  it('navigates back and forward in history', async () => {
    render(html`<${Nav} />`)
    await sleep()
    expect(location.hash).toEqual(`#/`)

    fireEvent.click(screen.getByText(translate('artists')))
    await sleep()

    expect(location.hash).toEqual(`#/artist`)
    fireEvent.click(screen.getByText('navigate_before'))
    await sleep(100)

    expect(location.hash).toEqual(`#/`)
    fireEvent.click(screen.getByText('navigate_next'))
    await sleep(100)

    expect(location.hash).toEqual(`#/artist`)
  })

  it('can toggle broadcasting on desktop', async () => {
    isDesktopStore.next(true)
    toggleBroadcast.mockImplementation(async () => {
      settingsStore.next({ isBroadcasting: true })
    })

    render(html`<${Nav} />`)
    expect(screen.queryByText('wifi')).not.toBeInTheDocument()
    await sleep()

    fireEvent.click(screen.queryByText('wifi_off'))
    await sleep()

    expect(screen.queryByText('wifi_off')).not.toBeInTheDocument()
    expect(screen.queryByText('wifi')).toBeInTheDocument()

    expect(toggleBroadcast).toHaveBeenCalledTimes(1)
  })

  it('shows connection lost dialogue on disconnected browser', async () => {
    isDesktopStore.next(false)
    connectedStore.next(false)
    render(html`<${Nav} />`)

    expect(screen.queryByText('wifi')).not.toBeInTheDocument()
    expect(screen.queryByText('wifi_off')).not.toBeInTheDocument()
    expect(screen.queryByText(translate('connection lost'))).toBeVisible()
  })
})
