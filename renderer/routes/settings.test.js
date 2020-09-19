'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import { locale } from 'svelte-intl'
import html from 'svelte-htm'
import faker from 'faker'
import settingsRoute from './settings.svelte'
import { translate, mockInvoke, sleep } from '../tests'

describe('settings route', () => {
  beforeEach(() => {
    location.hash = '#/'
    jest.resetAllMocks()
    locale.set('fr')
  })

  it('displays tracked folders and current language', async () => {
    const folders = [faker.system.fileName(), faker.system.fileName()]
    mockInvoke.mockResolvedValueOnce({ folders })

    render(html`<${settingsRoute} />`)
    await sleep()

    for (const folder of folders) {
      expect(screen.getByText(folder)).toBeInTheDocument()
    }
    expect(screen.getByText(translate('add folders'))).toBeInTheDocument()
    expect(mockInvoke).toHaveBeenCalledWith('remote', 'settings', 'get')
    expect(mockInvoke).toHaveBeenCalledTimes(1)

    expect(screen.getByText(translate('fr'))).toBeInTheDocument()
  })

  it('changes current language and updates labels', async () => {
    mockInvoke.mockResolvedValueOnce({ folders: [] })

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
    mockInvoke.mockResolvedValue({ folders: [faker.random.word()] })

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
    const folders = [faker.system.fileName(), faker.system.fileName()]
    mockInvoke
      .mockResolvedValueOnce({ folders })
      .mockResolvedValueOnce()
      .mockResolvedValueOnce({ folders: folders.slice(0, 1) })

    render(html`<${settingsRoute} />`)
    await sleep()

    expect(screen.queryByText(folders[0])).toBeInTheDocument()
    expect(screen.queryByText(folders[1])).toBeInTheDocument()

    // remove second one
    await fireEvent.click(screen.getAllByText('close')[1])
    await sleep(0)

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
})
