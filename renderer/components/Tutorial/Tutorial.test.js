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
    expect(screen.queryByRole('button')).toBeNull()
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

    expect(screen.queryByRole('button')).toBeVisible()
    expect(screen.queryByRole('button')).toHaveTextContent(
      translate(nextButtonKey)
    )

    fireEvent.click(screen.queryByRole('button'))
    expect(tutorial.handleNextButtonClick).toHaveBeenCalledTimes(1)
  })
})
