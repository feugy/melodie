import { faker } from '@faker-js/faker'
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get, writable } from 'svelte/store'
import html from 'svelte-htm'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep } from '../../tests'
import Dropdown from './Dropdown.svelte'
import {
  dropdownCustomData,
  dropdownData,
  dropdownSimpleData
} from './Dropdown.testdata'

describe('Dropdown component', () => {
  const { options } = dropdownData
  const handleSelect = vi.fn()
  const handleClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('selects a different options in the dropdown menu', async () => {
    const currentValue = writable()
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.getByText(options[0].label)).toBeInTheDocument()
    expect(screen.queryByText(options[1].label)).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(options[0].label))
    expect(handleClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByText(options[2].label))

    expect(get(currentValue)).toEqual(options[2])
    expect(await screen.findByText(options[2].label)).toBeInTheDocument()
    expect(screen.queryByText(options[0].label)).not.toBeInTheDocument()
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: options[2] })
    )
    expect(handleSelect).toHaveBeenCalledOnce()
    expect(handleClose).toHaveBeenCalled()
  })

  it('can not select on a disabled option', async () => {
    const currentValue = writable()
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.getByText(options[0].label)).toBeInTheDocument()
    expect(screen.queryByText(options[1].label)).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(options[0].label))
    await userEvent.click(screen.getByText(options[1].label))

    expect(get(currentValue)).toEqual(options[0])
    expect(handleSelect).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('discards selection when clicking outside of the dropdown menu', async () => {
    const currentValue = writable()
    render(
      html`<p data-testid="paragraph">lorem ipsum</p>
        <${Dropdown}
          options=${options}
          bind:value=${currentValue}
          on:select=${handleSelect}
          on:close=${handleClose}
        />`
    )
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[1].label)).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(options[0].label))
    expect(screen.getByText(options[1].label)).toBeInTheDocument()
    expect(handleClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('paragraph'))

    expect(get(currentValue)).toEqual(options[0])
    await waitFor(() =>
      expect(screen.queryByText(options[1].label)).not.toBeInTheDocument()
    )
    expect(handleSelect).not.toHaveBeenCalled()
    expect(handleClose).toHaveBeenCalled()
  })

  it('allows initial value', async () => {
    const currentValue = writable()
    currentValue.update(() => options[3])
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )

    expect(get(currentValue)).toEqual(options[3])
    expect(screen.getByText(options[3].label)).toBeInTheDocument()
    expect(handleSelect).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('allows simple array', async () => {
    const { options } = dropdownSimpleData
    const currentValue = writable()
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.getByText(options[0])).toBeInTheDocument()
    expect(screen.queryByText(options[1])).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(options[0]))
    expect(handleClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByText(options[2]))
    await sleep(350)

    expect(get(currentValue)).toEqual(options[2])
    expect(screen.getByText(options[2])).toBeInTheDocument()
    expect(screen.queryByText(options[0])).not.toBeInTheDocument()
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: options[2] })
    )
    expect(handleSelect).toHaveBeenCalledOnce()
    expect(handleClose).toHaveBeenCalled()
  })

  it('closes on custom option closure', async () => {
    const { options } = dropdownCustomData
    options[2].props.onValueSet = vi.fn()
    const currentValue = writable()
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.getByText(options[0].label)).toBeInTheDocument()
    expect(screen.queryByText(options[2].props.text)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText(options[2].props.text)).toBeInTheDocument()
    expect(handleClose).not.toHaveBeenCalled()

    const input = faker.lorem.word()
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: input }
    })
    await sleep(350)

    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[2].props.text)).not.toBeInTheDocument()
    expect(screen.getByText(options[0].label)).toBeInTheDocument()
    expect(options[2].props.onValueSet).toHaveBeenCalledWith(input)
    expect(options[2].props.onValueSet).toHaveBeenCalledOnce()
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: options[2] })
    )
    expect(handleSelect).toHaveBeenCalledOnce()
    expect(handleClose).toHaveBeenCalled()
  })

  it('supports no options', async () => {
    const options = []
    const currentValue = writable()
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )
    expect(get(currentValue)).toBeUndefined()

    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(handleSelect).not.toHaveBeenCalled()
    expect(handleClose).not.toHaveBeenCalled()
  })

  it('supports keyboard menu navigation', async () => {
    const currentValue = writable()
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )
    await userEvent.click(screen.getByRole('button'))
    const menu = screen.queryByRole('menu')
    expect(menu).toBeInTheDocument()
    expect(menu.children[0]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' })
    expect(menu.children[0]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    // second item is disabled
    expect(menu.children[2]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' })
    expect(menu.children[0]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[4]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[4]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'Home' })
    expect(menu.children[0]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'End' })
    expect(menu.children[4]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'Escape' })
    await sleep(350)
    expect(menu).not.toBeInTheDocument()
    expect(get(currentValue)).toEqual(options[0])
  })

  it('supports keyboard menu selection', async () => {
    const currentValue = writable()
    render(
      html`<${Dropdown}
        options=${options}
        bind:value=${currentValue}
        on:select=${handleSelect}
        on:close=${handleClose}
      />`
    )
    await userEvent.click(screen.getByRole('button'))
    let menu = screen.queryByRole('menu')
    expect(menu).toBeInTheDocument()
    expect(menu.children[0]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[2]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: ' ' })
    await sleep(350)
    expect(menu).not.toBeInTheDocument()
    expect(get(currentValue)).toEqual(options[2])

    await userEvent.click(screen.getByRole('button'))
    menu = screen.queryByRole('menu')
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[4]).toHaveFocus()

    fireEvent.keyDown(document.activeElement, { key: 'Enter' })
    await sleep(350)
    expect(menu).not.toBeInTheDocument()
    expect(get(currentValue)).toEqual(options[4])
  })
})
