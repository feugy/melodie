'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import { locale } from 'svelte-intl'
import html from 'svelte-htm'
import faker from 'faker'
import settingsRoute from './settings.svelte'
import { translate, mockInvoke, sleep } from '../tests'

describe('settings route', () => {
  const key = faker.random.alphaNumeric(10)
  const token = faker.random.uuid()
  const providers = { audiodb: { key }, discogs: { token } }
  const folders = [faker.system.fileName(), faker.system.fileName()]

  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    locale.set('fr')
  })

  it('displays tracked folders, current language and providers data', async () => {
    mockInvoke.mockResolvedValueOnce({ folders, providers })

    render(html`<${settingsRoute} />`)
    await sleep()

    for (const folder of folders) {
      expect(screen.getByText(folder)).toBeInTheDocument()
    }
    expect(screen.getByText(translate('add folders'))).toBeInTheDocument()

    expect(screen.getByText(translate('fr'))).toBeInTheDocument()

    expect(screen.getAllByRole('textbox')[0]).toHaveValue(key)
    expect(screen.getAllByRole('textbox')[1]).toHaveValue(token)

    expect(mockInvoke).toHaveBeenCalledWith('remote', 'settings', 'get')
    expect(mockInvoke).toHaveBeenCalledTimes(1)
  })

  it('changes current language and updates labels', async () => {
    mockInvoke.mockResolvedValueOnce({ folders: [], providers })

    render(html`<${settingsRoute} />`)
    expect(screen.getByText('Langue actuelle :')).toBeInTheDocument()

    await fireEvent.click(screen.getByText(translate('fr')))
    await fireEvent.click(screen.getByText(translate('en')))
    await sleep(200)

    expect(screen.getByText(translate('en'))).toBeInTheDocument()
    expect(screen.queryByText(translate('fr'))).toBeNull()
    expect(screen.getByText('Current language:')).toBeInTheDocument()
    expect(mockInvoke).toHaveBeenCalledWith(
      'remote',
      'settings',
      'setLocale',
      'en'
    )
  })

  it('adds new folders and redirect to folders', async () => {
    mockInvoke.mockResolvedValue({
      folders: [faker.random.word()],
      providers
    })

    render(html`<${settingsRoute} />`)
    await sleep()

    await fireEvent.click(screen.getByText(translate('add folders')))
    await sleep(10)

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'remote', 'settings', 'get')
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      'remote',
      'settings',
      'addFolders'
    )
    expect(mockInvoke).toHaveBeenCalledTimes(2)
    expect(location.hash).toEqual('#/album')
  })

  it('remove tracked folders', async () => {
    mockInvoke
      .mockResolvedValueOnce({ folders, providers })
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ folders: folders.slice(0, 1), providers })

    render(html`<${settingsRoute} />`)
    await sleep()

    expect(screen.queryByText(folders[0])).toBeInTheDocument()
    expect(screen.queryByText(folders[1])).toBeInTheDocument()

    // remove second one
    await fireEvent.click(screen.getAllByText('close')[1])
    await sleep()

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'remote', 'settings', 'get')
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      'remote',
      'settings',
      'removeFolder',
      folders[1]
    )
    expect(mockInvoke).toHaveBeenNthCalledWith(3, 'remote', 'settings', 'get')
    expect(mockInvoke).toHaveBeenCalledTimes(3)
    expect(screen.queryByText(folders[0])).toBeInTheDocument()
    expect(screen.queryByText(folders[1])).toBeNull()
  })

  it('saves new key for AudioDB provider', async () => {
    const newKey = faker.random.alphaNumeric(12)
    mockInvoke
      .mockResolvedValueOnce({ folders, providers })
      .mockResolvedValueOnce()

    render(html`<${settingsRoute} />`)
    await sleep()

    await fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: newKey }
    })
    await sleep()

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'remote', 'settings', 'get')
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      'remote',
      'settings',
      'setAudioDBKey',
      newKey
    )
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })

  it('saves new token for Discogs provider', async () => {
    const newToken = faker.random.uuid()
    mockInvoke
      .mockResolvedValueOnce({ folders, providers })
      .mockResolvedValueOnce()

    render(html`<${settingsRoute} />`)
    await sleep()

    await fireEvent.change(screen.getAllByRole('textbox')[1], {
      target: { value: newToken }
    })
    await sleep()

    expect(mockInvoke).toHaveBeenNthCalledWith(1, 'remote', 'settings', 'get')
    expect(mockInvoke).toHaveBeenNthCalledWith(
      2,
      'remote',
      'settings',
      'setDiscogsToken',
      newToken
    )
    expect(mockInvoke).toHaveBeenCalledTimes(2)
  })
})
