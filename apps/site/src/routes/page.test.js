import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { tick } from 'svelte'
import html from 'svelte-htm'
import { locale } from 'svelte-intl'
import { beforeEach, describe, expect, it } from 'vitest'

import { translate } from '../tests/utils'
import Layout from './+layout.svelte'
import Page from './+page.svelte'

describe('Index page', () => {
  beforeEach(() => {
    locale.set('en')
  })

  it('can change locale', async () => {
    // @ts-ignore -- typescript doesn't like svelte-htm
    render(html`<${Layout}>
      <${Page} />
    </${Layout}>`)
    expect(screen.getByText('Mélodie is a music player')).toBeInTheDocument()

    locale.set('fr')
    await tick()

    expect(
      screen.getByText('Mélodie est un lecteur de musique')
    ).toBeInTheDocument()
  })

  it('navigates between sections', async () => {
    // @ts-ignore -- typescript doesn't like svelte-htm
    render(html`<${Layout}>
      <${Page} />
    </${Layout}>`)
    expect(location.hash).toBe('')

    fireEvent.click(screen.getByText(translate('reactive')))
    await waitFor(() => expect(location.hash).toBe('#reactive'))
    expect(document.body.scrollTo).not.toHaveBeenCalled()

    fireEvent.click(screen.getByAltText(translate('alt.home')))
    await waitFor(() => expect(location.hash).toBe(''))
    expect(document.body.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(document.body.scrollTo).toHaveBeenCalledTimes(1)
  })
})
