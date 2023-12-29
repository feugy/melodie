import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import descriptor from '../../../package.json' assert { type: 'json' }
import { translate } from '../../tests/utils'
import DownloadButton from './DownloadButton.svelte'

describe('DownloadButton component', () => {
  const { version } = descriptor

  beforeEach(() => {
    vi.resetAllMocks()
    location.hash = '#/'
  })

  it('displays download options', async () => {
    render(
      // @ts-ignore -- typescript doesn't like svelte-htm
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${DownloadButton} />`
    )

    fireEvent.click(screen.getByText(translate('install _', { version })))

    const options = await screen.findAllByRole('menuitem')
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

    await userEvent.click(screen.getByTestId('paragraph'))
    await waitFor(() =>
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument()
    )
  })

  it('has link to the right artefacts', async () => {
    render(
      // @ts-ignore -- typescript doesn't like svelte-htm
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${DownloadButton} />`
    )

    fireEvent.click(screen.getByRole('button'))
    const links = await screen.findAllByRole('link')

    expect(links[0]).toHaveTextContent(translate('download.exe'))
    expect(links[0]).toHaveAttribute(
      'href',
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-setup-${version}.exe`
    )

    expect(links[1]).toHaveTextContent(translate('download.portable exe'))
    expect(links[1]).toHaveAttribute(
      'href',
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}.exe`
    )

    expect(links[2]).toHaveTextContent(translate('download.portable zip'))
    expect(links[2]).toHaveAttribute(
      'href',
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}-win.zip`
    )

    expect(links[3]).toHaveTextContent(translate('download.app image'))
    expect(links[3]).toHaveAttribute(
      'href',
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}-x86_64.AppImage`
    )

    expect(links[4]).toHaveTextContent(translate('download.portable tar'))
    expect(links[4]).toHaveAttribute(
      'href',
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}.tar.gz`
    )

    expect(links[5]).toHaveTextContent(translate('download.dmg'))
    expect(links[5]).toHaveAttribute(
      'href',
      `https://github.com/feugy/melodie/releases/download/v${version}/melodie-${version}.dmg`
    )
  })
})
