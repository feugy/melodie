'use strict'

const faker = require('faker')
const { classOnChange } = require('./class-on-change')
const { sleep } = require('../tests')

describe('classOnChange action', () => {
  const duration = 0
  const node = {
    classList: {
      add: jest.fn(),
      remove: jest.fn()
    }
  }

  beforeEach(jest.resetAllMocks)

  it('does not add class when value is null', async () => {
    const className = faker.random.word()
    const value = null
    classOnChange(node, { className, value, duration })

    await sleep(20)
    expect(node.classList.add).not.toHaveBeenCalled()
    expect(node.classList.remove).not.toHaveBeenCalled()
  })

  it('adds class on initialization', async () => {
    const className = faker.random.word()
    const value = faker.random.number()
    classOnChange(node, { className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)
    expect(node.classList.remove).not.toHaveBeenCalled()

    await sleep(20)
    expect(node.classList.remove).toHaveBeenCalledWith(className)
    expect(node.classList.add).toHaveBeenCalledTimes(1)
    expect(node.classList.remove).toHaveBeenCalledTimes(1)
  })

  it('adds class on value change', async () => {
    const className = faker.random.word()
    const value = faker.random.number()
    const { update } = classOnChange(node, { className, value: null, duration })
    expect(node.classList.add).not.toHaveBeenCalled()

    update({ className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)

    await sleep(20)
    expect(node.classList.remove).toHaveBeenCalledWith(className)
    expect(node.classList.add).toHaveBeenCalledTimes(1)
    expect(node.classList.remove).toHaveBeenCalledTimes(1)
  })

  it('does not adds class on same value', async () => {
    const className = faker.random.word()
    const value = faker.random.number()
    const { update } = classOnChange(node, { className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)

    await sleep(20)
    expect(node.classList.remove).toHaveBeenCalledWith(className)
    update({ className, value, duration })

    await sleep(20)
    expect(node.classList.add).toHaveBeenCalledTimes(1)
    expect(node.classList.remove).toHaveBeenCalledTimes(1)
  })

  it('clears timeout on destruction', async () => {
    const className = faker.random.word()
    const value = faker.random.number()
    const { destroy } = classOnChange(node, { className, value, duration })
    expect(node.classList.add).toHaveBeenCalledWith(className)
    destroy()

    await sleep(20)
    expect(node.classList.remove).not.toHaveBeenCalled()
    expect(node.classList.add).toHaveBeenCalledTimes(1)
  })
})
