import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { BehaviorSubject } from 'rxjs'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as tutorial from '../../stores/tutorial'
import { translate } from '../../tests'
import Tutorial from './Tutorial.svelte'

vi.mock('../../stores/tutorial')

describe('TracksTable component', () => {
  const store = new BehaviorSubject()
  beforeEach(() => {
    store.next(null)
    tutorial.current.subscribe = store.subscribe.bind(store)
    vi.resetAllMocks()
  })

  it('displays nothing on disabled tutorial', async () => {
    render(html`<${Tutorial} />`)

    expect(screen.queryByRole('document')).not.toBeInTheDocument()
  })

  it('displays current tutorial message', async () => {
    const messageKey = faker.helpers.arrayElement([
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
    const nextButtonKey = faker.helpers.arrayElement([
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

    await userEvent.click(nextButton)
    expect(tutorial.handleNextButtonClick).toHaveBeenCalledOnce()
    expect(tutorial.stop).not.toHaveBeenCalled()
  })

  it('stops on skip button', async () => {
    store.next({ messageKey: 'yes' })
    render(html`<${Tutorial} />`)

    const skipButton = screen.queryByText(translate('i will figure out'))
    expect(skipButton).toBeVisible()
    await userEvent.click(skipButton)
    expect(tutorial.stop).toHaveBeenCalledOnce()
  })
})
