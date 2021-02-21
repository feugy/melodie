'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import { BehaviorSubject } from 'rxjs'
import faker from 'faker'
import Tutorial from './Tutorial.svelte'
import * as tutorial from '../../stores/tutorial'
import { translate } from '../../tests'

jest.mock('../../stores/tutorial')

describe('TracksTable component', () => {
  const store = new BehaviorSubject()
  beforeEach(() => {
    store.next(null)
    tutorial.current.subscribe = store.subscribe.bind(store)
    jest.resetAllMocks()
  })

  it('displays nothing on disabled tutorial', async () => {
    render(html`<${Tutorial} />`)

    expect(screen.queryByRole('document')).toEqual(null)
  })

  it('displays current tutorial message', async () => {
    const messageKey = faker.random.arrayElement([
      'alright',
      'ok',
      'clear',
      'yes'
    ])
    store.next({
      anchorId: 'anchor',
      messageKey
    })
    render(
      html`<div id="anchor" />
        <${Tutorial} />`
    )

    expect(screen.queryByText(translate(messageKey))).toBeVisible()
    expect(screen.queryByText(translate('i will figure out'))).toBeVisible()
    expect(screen.queryByText('navigate_next')).not.toBeInTheDocument()
    expect(tutorial.stop).not.toHaveBeenCalled()
  })

  it('updates store on button click', async () => {
    const nextButtonKey = faker.random.arrayElement([
      'alright',
      'ok',
      'clear',
      'yes'
    ])
    store.next({
      anchorId: 'anchor',
      messageKey: 'no',
      nextButtonKey
    })
    render(
      html`<div id="anchor" />
        <${Tutorial} />`
    )

    const nextButton = screen.queryByText(translate(nextButtonKey))
    expect(nextButton).toBeVisible()

    fireEvent.click(nextButton)
    expect(tutorial.handleNextButtonClick).toHaveBeenCalledTimes(1)
    expect(tutorial.stop).not.toHaveBeenCalled()
  })

  it('stops on skip button', async () => {
    store.next({ messageKey: 'yes' })
    render(html`<${Tutorial} />`)

    const skipButton = screen.queryByText(translate('i will figure out'))
    expect(skipButton).toBeVisible()
    fireEvent.click(skipButton)
    expect(tutorial.stop).toHaveBeenCalledTimes(1)
  })
})
