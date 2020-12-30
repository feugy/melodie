'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import { locale } from 'svelte-intl'
import html from 'svelte-htm'
import faker from 'faker'
import { BehaviorSubject } from 'rxjs'
import settingsRoute from './settings.svelte'
import {
  settings as mockedSettings,
  isDesktop as mockedIsDesktop,
  saveLocale,
  askToAddFolder,
  removeFolder,
  saveAudioDBKey,
  saveEnqueueBehaviour,
  saveDiscogsToken,
  saveBroadcastPort
} from '../stores/settings'
import { invoke } from '../utils'
import { translate, sleep } from '../tests'

jest.mock('../stores/settings')

describe('settings route', () => {
  const key = faker.random.alphaNumeric(10)
  const token = faker.random.uuid()
  const broadcastPort = faker.random.number()
  const providers = { audiodb: { key }, discogs: { token } }
  const enqueueBehaviour = { onClick: true, clearBefore: false }
  const folders = [faker.system.fileName(), faker.system.fileName()]
  const settings = new BehaviorSubject()
  const isDesktop = new BehaviorSubject()
  const version = `${faker.random.number({ max: 10 })}.${faker.random.number({
    max: 10
  })}.${faker.random.number({ max: 10 })}`

  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    settings.next({ folders, providers, enqueueBehaviour, broadcastPort })
    isDesktop.next(true)
    locale.set('fr')
    mockedSettings.subscribe = settings.subscribe.bind(settings)
    mockedIsDesktop.subscribe = isDesktop.subscribe.bind(isDesktop)
    invoke.mockResolvedValue({})
  })

  it('displays tracked folders, current language, providers data, broadcast port and credits', async () => {
    invoke.mockResolvedValueOnce({ melodie: version })

    render(html`<${settingsRoute} />`)
    await sleep()

    for (const folder of folders) {
      expect(screen.queryByText(folder)).toBeInTheDocument()
    }
    expect(screen.queryByText(translate('add folders'))).toBeInTheDocument()

    expect(screen.queryByText(translate('fr'))).toBeInTheDocument()

    const textboxes = screen.getAllByRole('textbox')
    expect(textboxes[0]).toHaveValue(key)
    expect(textboxes[1]).toHaveValue(token)
    expect(screen.queryByRole('spinbutton')).toHaveValue(broadcastPort)

    expect(
      screen.queryByText(translate('enqueues and jumps'))
    ).toBeInTheDocument()
    expect(screen.queryByText(translate('enqueues track'))).toBeInTheDocument()

    expect(screen.queryByText(version)).toBeInTheDocument()
    expect(invoke).toHaveBeenCalledWith('core.getVersions')
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('does not display button to add folder nor broadcast port unless in desktop', async () => {
    isDesktop.next(false)

    render(html`<${settingsRoute} />`)
    await sleep()

    for (const folder of folders) {
      expect(screen.queryByText(folder)).toBeInTheDocument()
    }
    expect(screen.queryByText(translate('add folders'))).not.toBeInTheDocument()
    expect(
      screen.queryByText(translate('broadcasting'))
    ).not.toBeInTheDocument()
    expect(invoke).toHaveBeenCalledWith('core.getVersions')
    expect(invoke).toHaveBeenCalledTimes(1)
  })

  it('changes current language and updates labels', async () => {
    render(html`<${settingsRoute} />`)
    expect(screen.queryByText('Langage :')).toBeInTheDocument()

    fireEvent.click(screen.queryByText(translate('fr')))
    await sleep()
    fireEvent.click(screen.queryByText(translate('en')))
    await sleep(300)

    expect(screen.queryByText(translate('en'))).toBeInTheDocument()
    expect(screen.queryByText(translate('fr'))).not.toBeInTheDocument()
    expect(screen.queryByText('Language:')).toBeInTheDocument()
    expect(saveLocale).toHaveBeenCalledWith('en')
    expect(saveLocale).toHaveBeenCalledTimes(1)
  })

  it('adds new folders and redirect to folders', async () => {
    settings.next({
      folders: [faker.random.word()],
      providers,
      enqueueBehaviour
    })

    render(html`<${settingsRoute} />`)
    await sleep()

    fireEvent.click(screen.queryByText(translate('add folders')))
    await sleep()

    expect(askToAddFolder).toHaveBeenCalled()
    expect(askToAddFolder).toHaveBeenCalledTimes(1)
  })

  it('remove tracked folders', async () => {
    render(html`<${settingsRoute} />`)
    await sleep()

    expect(screen.queryByText(folders[0])).toBeInTheDocument()
    expect(screen.queryByText(folders[1])).toBeInTheDocument()

    // remove second one
    fireEvent.click(screen.getAllByText('close')[1])

    settings.next({
      folders: folders.slice(0, 1),
      providers,
      enqueueBehaviour
    })
    await sleep()

    expect(screen.queryByText(folders[0])).toBeInTheDocument()
    expect(screen.queryByText(folders[1])).not.toBeInTheDocument()
    expect(removeFolder).toHaveBeenCalledWith(folders[1])
    expect(removeFolder).toHaveBeenCalledTimes(1)
  })

  it('saves new key for AudioDB provider', async () => {
    const newKey = faker.random.alphaNumeric(12)

    render(html`<${settingsRoute} />`)
    await sleep()

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: newKey }
    })
    await sleep()

    expect(saveAudioDBKey).toHaveBeenCalledWith(newKey)
    expect(saveAudioDBKey).toHaveBeenCalledTimes(1)
  })

  it('saves new token for Discogs provider', async () => {
    const newToken = faker.random.uuid()

    render(html`<${settingsRoute} />`)
    await sleep()

    fireEvent.change(screen.getAllByRole('textbox')[1], {
      target: { value: newToken }
    })
    await sleep()

    expect(saveDiscogsToken).toHaveBeenCalledWith(newToken)
    expect(saveDiscogsToken).toHaveBeenCalledTimes(1)
  })

  it('saves new behaviour for play button', async () => {
    render(html`<${settingsRoute} />`)
    await sleep()

    expect(
      screen.queryByText(translate('enqueues and jumps'))
    ).toBeInTheDocument()

    fireEvent.click(screen.queryByText(translate('enqueues and jumps')))
    await sleep()
    fireEvent.click(screen.queryByText(translate('clears queue and plays')))
    await sleep(300)

    expect(saveEnqueueBehaviour).toHaveBeenCalledWith({
      ...enqueueBehaviour,
      clearBefore: true
    })
  })

  it('saves new behaviour for track row click', async () => {
    render(html`<${settingsRoute} />`)
    await sleep()

    expect(screen.queryByText(translate('enqueues track'))).toBeInTheDocument()

    fireEvent.click(screen.queryByText(translate('enqueues track')))
    await sleep()
    fireEvent.click(screen.queryByText(translate('plays track')))
    await sleep(300)

    expect(saveEnqueueBehaviour).toHaveBeenCalledWith({
      ...enqueueBehaviour,
      onClick: false
    })
  })

  it('sets new broadcast port', async () => {
    const newPort = faker.random.number()

    render(html`<${settingsRoute} />`)
    await sleep()

    fireEvent.change(screen.queryByRole('spinbutton'), {
      target: { value: newPort }
    })
    await sleep()

    expect(saveBroadcastPort).toHaveBeenCalledWith(newPort.toString())
    expect(saveBroadcastPort).toHaveBeenCalledTimes(1)
  })
})
