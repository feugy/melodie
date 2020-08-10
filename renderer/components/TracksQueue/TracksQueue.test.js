'use strict'

import { tick } from 'svelte'
import { get } from 'svelte/store'
import { screen, render, fireEvent } from '@testing-library/svelte'
import html from 'svelte-htm'
import faker from 'faker'
import TracksQueue from './TracksQueue.svelte'
import { add, clear, index, current } from '../../stores/track-queue'

describe('TracksQueue component', () => {
  beforeEach(() => clear())

  it('allows duplicated tracks', async () => {
    const track1 = {
      id: 1,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    const track2 = {
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    add([track1, track2, track1])

    render(html`<${TracksQueue} />`)

    expect(screen.getAllByText(track1.tags.title)).toHaveLength(2)
    expect(screen.getAllByText(track2.tags.title)).toHaveLength(1)
  })

  it('jumps to track on click', async () => {
    const track1 = {
      id: 1,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    const track2 = {
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    const track3 = {
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    add([track1, track2, track3])

    render(html`<${TracksQueue} />`)
    await tick()
    expect(get(index)).toEqual(0)

    await fireEvent.click(screen.getByText(track3.tags.title))
    await tick()

    expect(get(index)).toEqual(2)

    await fireEvent.click(screen.getByText(track2.tags.title))
    await tick()

    expect(get(index)).toEqual(1)
  })

  it('clears tracks queue', async () => {
    const track1 = {
      id: 1,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    const track2 = {
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    add([track1, track2])

    render(html`<${TracksQueue} />`)
    await tick()

    expect(get(current)).toEqual(track1)
    expect(screen.getByText(track1.tags.title)).toBeInTheDocument()
    expect(screen.getByText(track2.tags.title)).toBeInTheDocument()

    await fireEvent.click(screen.queryAllByRole('button')[0])
    await tick()

    expect(get(current)).not.toBeDefined()
    expect(screen.queryByText(track1.tags.title)).not.toBeInTheDocument()
    expect(screen.queryByText(track2.tags.title)).not.toBeInTheDocument()
  })

  it('removes track on button click', async () => {
    const track1 = {
      id: 1,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    const track2 = {
      id: 2,
      tags: {
        title: faker.commerce.productName(),
        artists: [faker.name.findName()]
      },
      media: faker.system.fileName()
    }
    add([track1, track2])

    render(html`<${TracksQueue} />`)
    await tick()

    await fireEvent.click(
      screen.getByText(track2.tags.title).closest('li').querySelector('button')
    )
    await tick()

    expect(screen.queryByText(track1.tags.title)).toBeInTheDocument()
    expect(screen.queryByText(track2.tags.title)).not.toBeInTheDocument()
  })
})
