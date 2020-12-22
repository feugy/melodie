'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { sleep, translate } from '../../tests/utils'
import DownloadButton from './DownloadButton.svelte'
const { version } = require('../../../package.json')

describe('DownloadButton component', () => {
  let openSpy

  beforeEach(() => {
    jest.resetAllMocks()
    openSpy = jest.spyOn(window, 'open')
  })

  it('displays download options', async () => {
    render(
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${DownloadButton} />`
    )

    await fireEvent.click(screen.getByRole('button'))

    const options = screen.queryAllByRole('menuitem')
    expect(options).toHaveLength(6)
    expect(screen.getByText(translate('download.exe'))).toBeInTheDocument()
    expect(
      screen.getByText(translate('download.portable exe'))
    ).toBeInTheDocument()
    expect(
      screen.getByText(translate('download.portable zip'))
    ).toBeInTheDocument()
    expect(
      screen.getByText(translate('download.app image'))
    ).toBeInTheDocument()
    expect(
      screen.getByText(translate('download.portable tar'))
    ).toBeInTheDocument()
    expect(screen.getByText(translate('download.dmg'))).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('paragraph'))
    await sleep(350)

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    expect(openSpy).not.toHaveBeenCalled()
  })

  it('has link to the right artefacts', async () => {
    render(
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${DownloadButton} />`
    )

    await fireEvent.click(screen.getByRole('button'))
    await fireEvent.click(screen.getByText(translate('download.exe')))
    expect(openSpy).toHaveBeenNthCalledWith(
      1,
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-setup-${version}.exe`
    )

    await fireEvent.click(screen.getByRole('button'))
    await fireEvent.click(screen.getByText(translate('download.portable exe')))
    expect(openSpy).toHaveBeenNthCalledWith(
      2,
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}.exe`
    )

    await fireEvent.click(screen.getByRole('button'))
    await fireEvent.click(screen.getByText(translate('download.portable zip')))
    expect(openSpy).toHaveBeenNthCalledWith(
      3,
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}-win.zip`
    )

    await fireEvent.click(screen.getByRole('button'))
    await fireEvent.click(screen.getByText(translate('download.app image')))
    expect(openSpy).toHaveBeenNthCalledWith(
      4,
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}-x86_64.AppImage`
    )

    await fireEvent.click(screen.getByRole('button'))
    await fireEvent.click(screen.getByText(translate('download.portable tar')))
    expect(openSpy).toHaveBeenNthCalledWith(
      5,
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}.tar.gz`
    )

    await fireEvent.click(screen.getByRole('button'))
    await fireEvent.click(screen.getByText(translate('download.dmg')))
    expect(openSpy).toHaveBeenNthCalledWith(
      6,
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}.dmg`
    )

    expect(openSpy).toHaveBeenCalledTimes(6)
  })
})
