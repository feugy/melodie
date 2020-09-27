'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import Snackbar from './Snackbar.svelte'
import { clear, showSnack } from '../../stores/snackbars'
import { sleep } from '../../tests'

describe('Snackbar component', () => {
  beforeEach(clear)

  it('displays message and action', async () => {
    const message = faker.lorem.words()
    const button = faker.lorem.word()
    const action = jest.fn()

    render(html`<${Snackbar} />`)
    showSnack({ message, button, action })

    await sleep(5)
    expect(screen.queryByText(message)).toBeVisible()
    expect(screen.queryByText(button)).toBeVisible()
    expect(action).not.toHaveBeenCalled()

    await fireEvent.click(screen.queryByText(button))
    expect(action).toHaveBeenCalled()
  })
})
