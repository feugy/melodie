'use strict'

import { screen, render, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { writable, get } from 'svelte/store'
import html from 'svelte-htm'
import faker from 'faker'
import ImageUploader from './ImageUploader.svelte'

function getDropTarget() {
  return screen.getByRole('img', { hidden: true }).closest('span')
}

describe('ImageUploader component', () => {
  it('loads dropped file', async () => {
    const path = faker.system.fileName()
    const item = {
      kind: 'file',
      getAsFile: () => ({ path })
    }
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.drop(getDropTarget(), { dataTransfer: { items: [item] } })

    expect(get(value)).toEqual(path)
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: path })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('loads dragged url', async () => {
    const avatar = faker.image.avatar()
    const item = {
      kind: 'string',
      getAsString: cb => cb(avatar)
    }
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.drop(getDropTarget(), { dataTransfer: { items: [item] } })

    expect(get(value)).toEqual(avatar)
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: avatar })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('loads paste url', async () => {
    const avatar = faker.image.avatar()
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.paste(getDropTarget(), {
      clipboardData: { getData: () => avatar }
    })

    expect(get(value)).toEqual(avatar)
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: avatar })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('loads file from browser', async () => {
    const path = faker.system.fileName()
    const file = new File([], 'test.png')
    file.path = path
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.change(getDropTarget().querySelector('input'), {
      target: { files: [file] }
    })

    expect(get(value)).toEqual(path)
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: path })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('does not update value on empty drop', async () => {
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.drop(getDropTarget(), { dataTransfer: { items: [] } })

    expect(get(value)).not.toBeDefined()
    expect(handleSelect).not.toHaveBeenCalled()
  })

  it('does not update value on empty drop', async () => {
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.drop(getDropTarget(), { dataTransfer: { items: [] } })

    expect(get(value)).not.toBeDefined()
    expect(handleSelect).not.toHaveBeenCalled()
  })

  it('does not update value on cancelled load', async () => {
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.change(getDropTarget().querySelector('input'), {
      target: { files: [] }
    })

    expect(get(value)).not.toBeDefined()
    expect(handleSelect).not.toHaveBeenCalled()
  })

  it('selects loaded file from browser', async () => {
    const path = faker.system.fileName()
    const file = new File([], 'test.png')
    file.path = path
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await fireEvent.change(getDropTarget().querySelector('input'), {
      target: { files: [file] }
    })

    expect(get(value)).toEqual(path)
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: path })
    )
    expect(handleSelect).toHaveBeenCalledTimes(1)
  })

  it('does not selects empty file', async () => {
    const value = writable()
    const handleSelect = jest.fn()
    render(
      html`<${ImageUploader} bind:value=${value} on:select=${handleSelect} />`
    )

    await userEvent.click(getDropTarget())

    expect(handleSelect).not.toHaveBeenCalled()
  })
})
