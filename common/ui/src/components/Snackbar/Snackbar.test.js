import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { clear, showSnack } from '../../stores/snackbars'
import { sleep } from '../../tests'
import Snackbar from './Snackbar.svelte'

describe('Snackbar component', () => {
  beforeEach(() => clear())

  it('displays message and action', async () => {
    const message = faker.lorem.words()
    const button = faker.lorem.word()
    const action = vi.fn()

    render(html`<${Snackbar} />`)
    showSnack({ message, button, action })

    await sleep(5)
    expect(screen.queryByText(message)).toBeVisible()
    expect(screen.queryByText(button)).toBeVisible()
    expect(action).not.toHaveBeenCalled()

    await userEvent.click(screen.queryByText(button))
    expect(action).toHaveBeenCalled()
  })
})
