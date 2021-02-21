'use strict'

import { render, screen } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import Sheet from './Sheet.svelte'

jest.mock('svelte-spa-router')

describe('Sheet component', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('has two slots and is closed by default', async () => {
    const main = faker.lorem.words()
    const aside = faker.lorem.words()
    render(
      html`<${Sheet}
        ><div slot="main">${main}</div>
        <div slot="aside">${aside}</div><//
      >`
    )

    expect(screen.getByText(main)).toBeInTheDocument()
    expect(screen.queryByText(aside)).not.toBeInTheDocument()
  })

  it('has shows aside on open', async () => {
    const main = faker.lorem.words()
    const aside = faker.lorem.words()
    render(
      html`<${Sheet} open=${true}
        ><div slot="main">${main}</div>
        <div slot="aside">${aside}</div><//
      >`
    )

    expect(screen.getByText(main)).toBeInTheDocument()
    expect(screen.getByText(aside)).toBeInTheDocument()
  })
})
