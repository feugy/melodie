'use strict'

import { writable, get } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import Dropdown from './Dropdown.svelte'
import { dropdownData } from './Dropdown.stories'
import { sleep } from '../../tests'

describe('Dropdown component', () => {
  const { options } = dropdownData

  beforeEach(() => jest.clearAllMocks())

  it('selects a different options in the dropdown menu', async () => {
    const currentValue = writable()
    render(html`<${Dropdown} options=${options} bind:value=${currentValue} />`)
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[0].label)).toBeInTheDocument()
    expect(screen.queryByText(options[1].label)).toBeNull()

    await fireEvent.click(screen.getByText(options[0].label))
    await fireEvent.click(screen.getByText(options[2].label))
    await sleep(200)

    expect(get(currentValue)).toEqual(options[2])
    expect(screen.queryByText(options[2].label)).toBeInTheDocument()
    expect(screen.queryByText(options[0].label)).toBeNull()
  })

  it('discards selection when clicking outside of the dropdown menu', async () => {
    const currentValue = writable()
    render(html`<${Dropdown} options=${options} bind:value=${currentValue} />`)
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[1].label)).toBeNull()

    await fireEvent.click(screen.getByText(options[0].label))
    expect(screen.queryByText(options[1].label)).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button'))
    await sleep(200)

    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[1].label)).toBeNull()
  })

  it('allows initial value', async () => {
    const currentValue = writable()
    currentValue.update(() => options[3])
    render(html`<${Dropdown} options=${options} bind:value=${currentValue} />`)

    expect(get(currentValue)).toEqual(options[3])
    expect(screen.queryByText(options[3].label)).toBeInTheDocument()
  })

  it('allows simple array', async () => {
    const options = ['one', 'two', 'three']
    const currentValue = writable()
    render(html`<${Dropdown} options=${options} bind:value=${currentValue} />`)
    expect(get(currentValue)).toEqual(options[0])
    expect(screen.queryByText(options[0])).toBeInTheDocument()
    expect(screen.queryByText(options[1])).toBeNull()

    await fireEvent.click(screen.getByText(options[0]))
    await fireEvent.click(screen.getByText(options[2]))
    await sleep(200)

    expect(get(currentValue)).toEqual(options[2])
    expect(screen.queryByText(options[2])).toBeInTheDocument()
    expect(screen.queryByText(options[0])).toBeNull()
  })

  it('supports no options', async () => {
    const options = []
    const currentValue = writable()
    render(html`<${Dropdown} options=${options} bind:value=${currentValue} />`)
    expect(get(currentValue)).toBeUndefined()

    await fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByRole('list')).toBeInTheDocument()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
