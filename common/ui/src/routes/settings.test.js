import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { locale } from 'svelte-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  askToAddFolder,
  isDesktop as mockedIsDesktop,
  removeFolder,
  saveAudioDBKey,
  saveBroadcastPort,
  saveDiscogsToken,
  saveEnqueueBehaviour,
  saveLocale,
  settings as mockedSettings
} from '../stores/settings'
import { sleep, translate } from '../tests'
import { invoke } from '../utils'
import settingsRoute from './settings.svelte'

vi.mock('../stores/settings')

describe('settings route', () => {
  const key = faker.string.alphanumeric(10)
  const token = faker.string.uuid()
  const broadcastPort = faker.number.int()
  const providers = { audiodb: { key }, discogs: { token } }
  const enqueueBehaviour = { onClick: true, clearBefore: false }
  const folders = [faker.system.fileName(), faker.system.fileName()]
  const settings = new BehaviorSubject()
  const isDesktop = new BehaviorSubject()
  const version = `${faker.number.int({
    max: 10
  })}.${faker.number.int({
    max: 10
  })}.${faker.number.int({ max: 10 })}`

  beforeEach(() => {
    location.hash = '#/'
    vi.resetAllMocks()
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
      expect(screen.getByText(folder)).toBeInTheDocument()
    }
    expect(screen.getByText(translate('add folders'))).toBeInTheDocument()

    expect(screen.getByText(translate('fr'))).toBeInTheDocument()

    const textboxes = screen.getAllByRole('textbox')
    expect(textboxes[0]).toHaveValue(key)
    expect(textboxes[1]).toHaveValue(token)
    expect(screen.queryByRole('spinbutton')).toHaveValue(broadcastPort)

    expect(
      screen.getByText(translate('enqueues and jumps'))
    ).toBeInTheDocument()
    expect(screen.getByText(translate('enqueues track'))).toBeInTheDocument()

    expect(screen.getByText(version)).toBeInTheDocument()
    expect(invoke).toHaveBeenCalledWith('core.getVersions')
    expect(invoke).toHaveBeenCalledOnce()
  })

  it('does not display button to add folder nor broadcast port unless in desktop', async () => {
    isDesktop.next(false)

    render(html`<${settingsRoute} />`)
    await sleep()

    for (const folder of folders) {
      expect(screen.getByText(folder)).toBeInTheDocument()
    }
    expect(screen.queryByText(translate('add folders'))).not.toBeInTheDocument()
    expect(
      screen.queryByText(translate('broadcasting'))
    ).not.toBeInTheDocument()
    expect(invoke).toHaveBeenCalledWith('core.getVersions')
    expect(invoke).toHaveBeenCalledOnce()
  })

  it('changes current language and updates labels', async () => {
    render(html`<${settingsRoute} />`)
    expect(screen.getByText('Langage :')).toBeInTheDocument()

    await userEvent.click(screen.getByText(translate('fr')))
    await sleep()
    await userEvent.click(screen.getByText(translate('en')))
    await sleep(300)

    expect(screen.getByText(translate('en'))).toBeInTheDocument()
    expect(screen.queryByText(translate('fr'))).not.toBeInTheDocument()
    expect(screen.getByText('Language:')).toBeInTheDocument()
    expect(saveLocale).toHaveBeenCalledWith('en')
    expect(saveLocale).toHaveBeenCalledOnce()
  })

  it('adds new folders and redirect to folders', async () => {
    settings.next({
      folders: [faker.string.alphanumeric(5)],
      providers,
      enqueueBehaviour
    })

    render(html`<${settingsRoute} />`)
    await sleep()

    await userEvent.click(screen.getByText(translate('add folders')))
    await sleep()

    expect(askToAddFolder).toHaveBeenCalled()
    expect(askToAddFolder).toHaveBeenCalledOnce()
  })

  it('remove tracked folders', async () => {
    render(html`<${settingsRoute} />`)
    await sleep()

    expect(screen.getByText(folders[0])).toBeInTheDocument()
    expect(screen.getByText(folders[1])).toBeInTheDocument()

    // remove second one
    await userEvent.click(screen.getAllByRole('button')[1])

    settings.next({
      folders: folders.slice(0, 1),
      providers,
      enqueueBehaviour
    })
    await sleep()

    expect(screen.getByText(folders[0])).toBeInTheDocument()
    expect(screen.queryByText(folders[1])).not.toBeInTheDocument()
    expect(removeFolder).toHaveBeenCalledWith(folders[1])
    expect(removeFolder).toHaveBeenCalledOnce()
  })

  it('saves new key for AudioDB provider', async () => {
    const newKey = faker.string.alphanumeric(12)

    render(html`<${settingsRoute} />`)
    await sleep()

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: newKey }
    })
    await sleep()

    expect(saveAudioDBKey).toHaveBeenCalledWith(newKey)
    expect(saveAudioDBKey).toHaveBeenCalledOnce()
  })

  it('saves new token for Discogs provider', async () => {
    const newToken = faker.string.uuid()

    render(html`<${settingsRoute} />`)
    await sleep()

    fireEvent.change(screen.getAllByRole('textbox')[1], {
      target: { value: newToken }
    })
    await sleep()

    expect(saveDiscogsToken).toHaveBeenCalledWith(newToken)
    expect(saveDiscogsToken).toHaveBeenCalledOnce()
  })

  it('saves new behaviour for play button', async () => {
    render(html`<${settingsRoute} />`)
    await sleep()

    expect(
      screen.getByText(translate('enqueues and jumps'))
    ).toBeInTheDocument()

    await userEvent.click(screen.getByText(translate('enqueues and jumps')))
    await sleep()
    await userEvent.click(screen.getByText(translate('clears queue and plays')))
    await sleep(300)

    expect(saveEnqueueBehaviour).toHaveBeenCalledWith({
      ...enqueueBehaviour,
      clearBefore: true
    })
  })

  it('saves new behaviour for track row click', async () => {
    render(html`<${settingsRoute} />`)
    await sleep()

    expect(screen.getByText(translate('enqueues track'))).toBeInTheDocument()

    await userEvent.click(screen.getByText(translate('enqueues track')))
    await sleep()
    await userEvent.click(screen.getByText(translate('plays track')))
    await sleep(300)

    expect(saveEnqueueBehaviour).toHaveBeenCalledWith({
      ...enqueueBehaviour,
      onClick: false
    })
  })

  it('sets new broadcast port', async () => {
    const newPort = faker.number.int()

    render(html`<${settingsRoute} />`)
    await sleep()

    fireEvent.change(screen.queryByRole('spinbutton'), {
      target: { value: newPort }
    })
    await sleep()

    expect(saveBroadcastPort).toHaveBeenCalledWith(newPort.toString())
    expect(saveBroadcastPort).toHaveBeenCalledOnce()
  })
})
