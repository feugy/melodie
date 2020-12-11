'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import { locale } from 'svelte-intl'
import html from 'svelte-htm'
import faker from 'faker'
import { BehaviorSubject } from 'rxjs'
import settingsRoute from './settings.svelte'
import {
  settings as mockedSettings,
  saveLocale,
  askToAddFolder,
  removeFolder,
  saveAudioDBKey,
  saveEnqueueBehaviour,
  saveDiscogsToken
} from '../stores/settings'
import { translate, mockInvoke, sleep } from '../tests'

jest.mock('../stores/settings')

describe('settings route', () => {
  const key = faker.random.alphaNumeric(10)
  const token = faker.random.uuid()
  const providers = { audiodb: { key }, discogs: { token } }
  const enqueueBehaviour = { onClick: true, clearBefore: false }
  const folders = [faker.system.fileName(), faker.system.fileName()]
  const settings = new BehaviorSubject()

  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    settings.next({ folders, providers, enqueueBehaviour })
    locale.set('fr')
    mockedSettings.subscribe = settings.subscribe.bind(settings)
    mockInvoke.mockResolvedValue({})
  })

  it('displays tracked folders, current language, providers data and credits', async () => {
    const version = `${faker.random.number({ max: 10 })}.${faker.random.number({
      max: 10
    })}.${faker.random.number({ max: 10 })}`
    mockInvoke.mockResolvedValueOnce({ melodie: version })

    render(html`<${settingsRoute} />`)
    await sleep()

    for (const folder of folders) {
      expect(screen.getByText(folder)).toBeInTheDocument()
    }
    expect(screen.getByText(translate('add folders'))).toBeInTheDocument()

    expect(screen.getByText(translate('fr'))).toBeInTheDocument()

    expect(screen.getAllByRole('textbox')[0]).toHaveValue(key)
    expect(screen.getAllByRole('textbox')[1]).toHaveValue(token)

    expect(
      screen.getByText(translate('enqueues and jumps'))
    ).toBeInTheDocument()
    expect(screen.getByText(translate('enqueues track'))).toBeInTheDocument()

    expect(screen.getByText(version)).toBeInTheDocument()
    expect(mockInvoke).toHaveBeenCalledWith('remote', 'core', 'getVersions')
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('changes current language and updates labels', async () => {
    render(html`<${settingsRoute} />`)
    expect(screen.getByText('Langage :')).toBeInTheDocument()

    fireEvent.click(screen.getByText(translate('fr')))
    await sleep()
    fireEvent.click(screen.getByText(translate('en')))
    await sleep(300)

    expect(screen.getByText(translate('en'))).toBeInTheDocument()
    expect(screen.queryByText(translate('fr'))).not.toBeInTheDocument()
    expect(screen.getByText('Language:')).toBeInTheDocument()
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

    fireEvent.click(screen.getByText(translate('add folders')))
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
      screen.getByText(translate('enqueues and jumps'))
    ).toBeInTheDocument()

    fireEvent.click(screen.getByText(translate('enqueues and jumps')))
    await sleep()
    fireEvent.click(screen.getByText(translate('clears queue and plays')))
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

    fireEvent.click(screen.getByText(translate('enqueues track')))
    await sleep()
    fireEvent.click(screen.getByText(translate('plays track')))
    await sleep(300)

    expect(saveEnqueueBehaviour).toHaveBeenCalledWith({
      ...enqueueBehaviour,
      onClick: false
    })
  })
})
