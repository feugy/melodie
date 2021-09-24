'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { tick } from 'svelte'
import { writable, get } from 'svelte/store'
import html from 'svelte-htm'
import faker from 'faker'
import Dialogue from './Dialogue.svelte'

describe('Dialogue component', () => {
  it('displays title and dispatches open event', async () => {
    const open = writable(false)
    const title = faker.lorem.words()
    const handleOpen = jest.fn()
    const handleClose = jest.fn()
    render(
      html`<${Dialogue}
        on:open=${handleOpen}
        on:close=${handleClose}
        bind:open=${open}
        title=${title}
      />`
    )

    expect(screen.queryByText(title)).not.toBeVisible()
    expect(handleOpen).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
    open.set(true)

    await tick()

    expect(screen.queryByText(title)).toBeVisible()
    expect(handleOpen).toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('closes on backdrop click and dispatches close event', async () => {
    const open = writable(true)
    const title = faker.lorem.words()
    const handleOpen = jest.fn()
    const handleClose = jest.fn()
    render(
      html`<${Dialogue}
        on:open=${handleOpen}
        on:close=${handleClose}
        bind:open=${open}
        title=${title}
      />`
    )
    await tick()

    expect(screen.queryByText(title)).toBeVisible()
    expect(handleOpen).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('dialog').parentElement)

    expect(screen.queryByText(title)).not.toBeVisible()
    expect(handleClose).toHaveBeenCalled()
    expect(get(open)).toBe(false)
  })

  it('closes on close button click and dispatches close event', async () => {
    const open = writable(true)
    const title = faker.lorem.words()
    const handleOpen = jest.fn()
    const handleClose = jest.fn()
    render(
      html`<${Dialogue}
        on:open=${handleOpen}
        on:close=${handleClose}
        bind:open=${open}
        title=${title}
      />`
    )
    await tick()

    expect(screen.queryByText(title)).toBeVisible()
    expect(handleOpen).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()

    await userEvent.click(screen.queryByRole('button'))

    expect(screen.queryByText(title)).not.toBeVisible()
    expect(handleClose).toHaveBeenCalled()
    expect(get(open)).toBe(false)
  })

  it('closes on esc key and dispatches close event', async () => {
    const open = writable(true)
    const title = faker.lorem.words()
    const handleOpen = jest.fn()
    const handleClose = jest.fn()
    render(
      html`<p data-testid="paragraph" />
        <${Dialogue}
          on:open=${handleOpen}
          on:close=${handleClose}
          bind:open=${open}
          title=${title}
        />`
    )
    await tick()

    expect(screen.queryByText(title)).toBeVisible()
    expect(handleOpen).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()

    await fireEvent.keyUp(screen.getByTestId('paragraph'), {
      key: 'Escape'
    })

    expect(screen.queryByText(title)).not.toBeVisible()
    expect(handleClose).toHaveBeenCalled()
    expect(get(open)).toBe(false)
  })

  it('does not display close button nor closes on backdrop click with noClose option', async () => {
    const open = writable(true)
    const title = faker.lorem.words()
    const handleClose = jest.fn()
    render(
      html`<${Dialogue}
        noClose
        on:close=${handleClose}
        bind:open=${open}
        title=${title}
      />`
    )
    await tick()

    expect(screen.queryByText(title)).toBeVisible()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('dialog').parentElement)

    expect(screen.queryByText(title)).toBeVisible()
    expect(handleClose).not.toHaveBeenCalled()
    expect(get(open)).toBe(true)
  })

  it('does not close on esc key with noClose option', async () => {
    const open = writable(true)
    const title = faker.lorem.words()
    const handleClose = jest.fn()
    render(
      html`<p data-testid="paragraph" />
        <${Dialogue}
          noClose
          on:close=${handleClose}
          bind:open=${open}
          title=${title}
        />`
    )
    await tick()

    expect(screen.queryByText(title)).toBeVisible()
    await fireEvent.keyUp(screen.getByTestId('paragraph'), {
      key: 'Escape'
    })

    expect(screen.queryByText(title)).toBeVisible()
    expect(handleClose).not.toHaveBeenCalled()
    expect(get(open)).toBe(true)
  })
})
