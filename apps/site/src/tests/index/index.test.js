'use strict'

import { tick } from 'svelte'
import { locale } from 'svelte-intl'
import { screen, render, fireEvent } from '@testing-library/svelte'
import { sleep, translate } from '../utils'
import Page from './index.stories.svelte'

describe('Index page', () => {
  beforeEach(() => {
    locale.set('en')
  })

  it('can change locale', async () => {
    render(Page)
    expect(screen.getByText('Mélodie is a music player')).toBeInTheDocument()

    locale.set('fr')
    await tick()

    expect(
      screen.getByText('Mélodie est un lecteur de musique')
    ).toBeInTheDocument()
  })

  it('navigates between sections', async () => {
    render(Page)
    expect(location.hash).toEqual('')

    await fireEvent.click(screen.getByText(translate('reactive')))
    await sleep()
    expect(location.hash).toEqual('#reactive')
    expect(document.body.scrollTo).not.toHaveBeenCalled()

    await fireEvent.click(screen.getByAltText(translate('alt.home')))
    await sleep()
    expect(location.hash).toEqual('')
    expect(document.body.scrollTo).toHaveBeenCalledWith(0, 0)
    expect(document.body.scrollTo).toHaveBeenCalledTimes(1)
  })
})
