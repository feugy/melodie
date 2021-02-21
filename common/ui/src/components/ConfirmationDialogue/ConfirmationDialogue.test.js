'use strict'

import { tick } from 'svelte'
import { writable, get } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import ConfirmationDialogue from './ConfirmationDialogue.svelte'

describe('Confirmation dialogue component', () => {
  beforeEach(jest.resetAllMocks)

  it('displays title, message and buttons', async () => {
    const open = writable(false)
    const title = faker.lorem.words()
    const message = faker.lorem.words()
    const handleOpen = jest.fn()
    const handleClose = jest.fn()
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
    expect(screen.queryByText('done')).toBeVisible()
    expect(screen.queryByText('cancel')).toBeVisible()
    expect(handleOpen).toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  describe('given an opened confirmation dialogue', () => {
    const open = writable(true)
    const title = faker.lorem.words()
    const message = faker.lorem.words()
    const handleOpen = jest.fn()
    const handleClose = jest.fn()

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
      await fireEvent.click(screen.queryByText('done'))

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: true })
      )
      expect(get(open)).toBe(false)
    })

    it('dispatches close event without confirmed on cancellation button', async () => {
      await fireEvent.click(screen.queryByText('cancel'))

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: false })
      )
      expect(get(open)).toBe(false)
    })

    it('dispatches close event without confirmed on backdrop click', async () => {
      await fireEvent.click(screen.queryByText('close').closest('div'))

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: false })
      )
      expect(get(open)).toBe(false)
    })

    it('dispatches close event without confirmed on close button', async () => {
      await fireEvent.click(screen.queryByText('close'))

      expect(screen.queryByText(title)).not.toBeVisible()
      expect(handleClose).toHaveBeenCalledWith(
        expect.objectContaining({ detail: false })
      )
      expect(get(open)).toBe(false)
    })
  })
})
