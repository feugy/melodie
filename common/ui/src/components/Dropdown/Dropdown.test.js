'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { writable, get } from 'svelte/store'
import html from 'svelte-htm'
import faker from 'faker'
import Dropdown from './Dropdown.svelte'
import {
  dropdownData,
  dropdownCustomData,
  dropdownSimpleData
} from './Dropdown.stories'
import { sleep } from '../../tests'

describe('Dropdown component', () => {
  const { options } = dropdownData
  const handleSelect = jest.fn()
  const handleClose = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it('selects a different options in the dropdown menu', async () => {
    const currentValue = writable()
    render(html`<${Dropdown}
      options=${options}
      bind:value=${currentValue}
      on:select=${handleSelect}
      on:close=${handleClose}
    />`)
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[0].label)).toBeInTheDocument()
    expect(screen.queryByText(options[1].label)).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(options[0].label))
    expect(handleClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByText(options[2].label))
    await sleep(350)

    expect(get(currentValue)).toEqual(options[2])
    expect(screen.queryByText(options[2].label)).toBeInTheDocument()
    expect(screen.queryByText(options[0].label)).not.toBeInTheDocument()
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: options[2] })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleClose).toHaveBeenCalled()
  })

  it('can not select on a disabled option', async () => {
    const currentValue = writable()
    render(html`<${Dropdown}
      options=${options}
      bind:value=${currentValue}
      on:select=${handleSelect}
      on:close=${handleClose}
    />`)
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[0].label)).toBeInTheDocument()
    expect(screen.queryByText(options[1].label)).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(options[0].label))
    await userEvent.click(screen.getByText(options[1].label))
    await sleep(350)

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
    expect(screen.queryByText(options[1].label)).toBeInTheDocument()
    expect(handleClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('paragraph'))
    await sleep(350)

    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[1].label)).not.toBeInTheDocument()
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
    expect(screen.queryByText(options[3].label)).toBeInTheDocument()
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
    expect(screen.queryByText(options[0])).toBeInTheDocument()
    expect(screen.queryByText(options[1])).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(options[0]))
    expect(handleClose).not.toHaveBeenCalled()
    await userEvent.click(screen.getByText(options[2]))
    await sleep(350)

    expect(get(currentValue)).toEqual(options[2])
    expect(screen.queryByText(options[2])).toBeInTheDocument()
    expect(screen.queryByText(options[0])).not.toBeInTheDocument()
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: options[2] })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
    expect(handleClose).toHaveBeenCalled()
  })

  it('closes on custom option closure', async () => {
    const { options } = dropdownCustomData
    options[2].props.onValueSet = jest.fn()
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
    expect(screen.queryByText(options[0].label)).toBeInTheDocument()
    expect(screen.queryByText(options[2].props.text)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByText(options[2].props.text)).toBeInTheDocument()
    expect(handleClose).not.toHaveBeenCalled()

    const input = faker.random.word()
    await fireEvent.change(screen.getByRole('textbox'), {
      target: { value: input }
    })
    await sleep(350)

    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[2].props.text)).not.toBeInTheDocument()
    expect(screen.queryByText(options[0].label)).toBeInTheDocument()
    expect(options[2].props.onValueSet).toHaveBeenCalledWith(input)
    expect(options[2].props.onValueSet).toHaveBeenCalledTimes(1)
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: options[2] })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
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
    render(html`<${Dropdown}
      options=${options}
      bind:value=${currentValue}
      on:select=${handleSelect}
      on:close=${handleClose}
    />`)
    await userEvent.click(screen.getByRole('button'))
    const menu = screen.queryByRole('menu')
    expect(menu).toBeInTheDocument()
    expect(menu.children[0]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' })
    expect(menu.children[0]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    // second item is disabled
    expect(menu.children[2]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' })
    expect(menu.children[0]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[4]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[4]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'Home' })
    expect(menu.children[0]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'End' })
    expect(menu.children[4]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'Escape' })
    await sleep(350)
    expect(menu).not.toBeInTheDocument()
    expect(get(currentValue)).toEqual(options[0])
  })

  it('supports keyboard menu selection', async () => {
    const currentValue = writable()
    render(html`<${Dropdown}
      options=${options}
      bind:value=${currentValue}
      on:select=${handleSelect}
      on:close=${handleClose}
    />`)
    await userEvent.click(screen.getByRole('button'))
    let menu = screen.queryByRole('menu')
    expect(menu).toBeInTheDocument()
    expect(menu.children[0]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[2]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: ' ' })
    await sleep(350)
    expect(menu).not.toBeInTheDocument()
    expect(get(currentValue)).toEqual(options[2])

    await userEvent.click(screen.getByRole('button'))
    menu = screen.queryByRole('menu')
    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(menu.children[4]).toHaveFocus()

    await fireEvent.keyDown(document.activeElement, { key: 'Enter' })
    await sleep(350)
    expect(menu).not.toBeInTheDocument()
    expect(get(currentValue)).toEqual(options[4])
  })
})
