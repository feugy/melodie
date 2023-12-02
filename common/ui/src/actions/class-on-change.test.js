import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep } from '../tests'
import { classOnChange } from './class-on-change'

describe('classOnChange action', () => {
  const duration = 0
  const node = {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    }
  }

  beforeEach(() => vi.resetAllMocks())

  it('does not add class when value is null', async () => {
    const className = faker.string.alpha()
    const value = null
    classOnChange(node, { className, value, duration })

    await sleep(20)
    expect(node.classList.add).not.toHaveBeenCalled()
    expect(node.classList.remove).not.toHaveBeenCalled()
  })

  it('adds class on initialization', async () => {
    const className = faker.string.alpha()
    const value = faker.number.int()
    classOnChange(node, { className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)
    expect(node.classList.remove).not.toHaveBeenCalled()

    await sleep(20)
    expect(node.classList.remove).toHaveBeenCalledWith(className)
    expect(node.classList.add).toHaveBeenCalledOnce()
    expect(node.classList.remove).toHaveBeenCalledOnce()
  })

  it('adds class on value change', async () => {
    const className = faker.string.alpha()
    const value = faker.number.int()
    const { update } = classOnChange(node, { className, value: null, duration })
    expect(node.classList.add).not.toHaveBeenCalled()

    update({ className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)

    await sleep(20)
    expect(node.classList.remove).toHaveBeenCalledWith(className)
    expect(node.classList.add).toHaveBeenCalledOnce()
    expect(node.classList.remove).toHaveBeenCalledOnce()
  })

  it('does not adds class on same value', async () => {
    const className = faker.string.alpha()
    const value = faker.number.int()
    const { update } = classOnChange(node, { className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)

    await sleep(20)
    expect(node.classList.remove).toHaveBeenCalledWith(className)
    update({ className, value, duration })

    await sleep(20)
    expect(node.classList.add).toHaveBeenCalledOnce()
    expect(node.classList.remove).toHaveBeenCalledOnce()
  })

  it('clears timeout on destruction', async () => {
    const className = faker.string.alpha()
    const value = faker.number.int()
    const { destroy } = classOnChange(node, { className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)
    destroy()

    await sleep(20)
    expect(node.classList.remove).not.toHaveBeenCalled()
    expect(node.classList.add).toHaveBeenCalledOnce()
  })
})
