import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { get, writable } from 'svelte/store'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { translate } from '../../tests'
import ConfirmationDialogue from './ConfirmationDialogue.svelte'

describe('Confirmation dialogue component', () => {
  beforeEach(() => vi.resetAllMocks())

  it('displays title, message and buttons', async () => {
    const open = writable(false)
    const title = faker.lorem.words()
    const message = faker.lorem.words()
    const handleOpen = vi.fn()
    const handleClose = vi.fn()
    render(
      html`<${ConfirmationDialogue}
        on:open=${handleOpen}
        on:close=${handleClose}
        bind:open=${open}
        title=${title}
        >${message}</${ConfirmationDialogue}
      >`
    )

    expect(screen.queryByText(title)).not.toBeVisible()
    expect(handleOpen).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
    open.set(true)

    await tick()

    expect(screen.queryByText(title)).toBeVisible()
    expect(screen.queryByText(message)).toBeVisible()
    expect(
      screen.queryByText(translate('yes')).previousElementSibling
    ).toHaveClass('i-mdi-check')
    expect(
      screen.queryByText(translate('no')).previousElementSibling
    ).toHaveClass('i-mdi-close-circle')
    expect(handleOpen).toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  describe('given an opened confirmation dialogue', () => {
    const open = writable(true)
    const title = faker.lorem.words()
    const message = faker.lorem.words()
    const handleOpen = vi.fn()
    const handleClose = vi.fn()

    beforeEach(async () => {
      open.set(true)
      render(
        html`<${ConfirmationDialogue}
          on:open=${handleOpen}
          on:close=${handleClose}
          bind:open=${open}
          title=${title}
          >${message}</${ConfirmationDialogue}
        >`
      )
      await tick()
    })

    it('dispatches close event with confirmed on confirmation button', async () => {
      await userEvent.click(screen.queryByText(translate('yes')))

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: true })
      )
      expect(get(open)).toBe(false)
    })

    it('dispatches close event without confirmed on cancellation button', async () => {
      await userEvent.click(
        screen.queryByRole('button', { name: translate('no') })
      )

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: false })
      )
      expect(get(open)).toBe(false)
    })

    it('dispatches close event without confirmed on backdrop click', async () => {
      await userEvent.click(screen.queryByTestId('backdrop'))

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: false })
      )
      expect(get(open)).toBe(false)
    })

    it('dispatches close event without confirmed on close button', async () => {
      await userEvent.click(
        screen.queryByTestId('backdrop').querySelector('button')
      )

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: false })
      )
      expect(get(open)).toBe(false)
    })
  })
})
