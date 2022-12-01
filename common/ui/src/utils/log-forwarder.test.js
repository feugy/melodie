'use strict'

import { send } from './connection'
import { configureLogForward } from './log-forwarder'

jest.mock('./connection', () => ({ send: jest.fn() }))

describe('log forwarder', () => {
  const originals = {
    trace: console.trace.bind(console),
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  }

  beforeEach(() => {
    jest.resetAllMocks()
    console.trace = () => {}
    console.log = () => {}
    console.warn = () => {}
    console.error = () => {}
    send.mockReset()
    configureLogForward()
  })

  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    localStorage.clear()
  })

  afterAll(() => {
    Object.assign(console, originals)
  })

  it('sends traces, logs, warns and erros when reaching limit', () => {
    console.trace(1)
    console.log(2)
    console.warn(3)
    console.error(4)
    console.trace(5)
    console.log(6)
    console.warn(7)
    console.error(8)
    console.trace(9)
    console.log(10)
    console.warn(11)
    console.error(12)
    console.trace(13)
    console.log(14)
    console.warn(15)
    console.error(16)
    expect(send).toHaveBeenCalledWith({
      logs: [
        { level: 'trace', args: [1], time: expect.any(Number) },
        { level: 'debug', args: [2], time: expect.any(Number) },
        { level: 'warn', args: [3], time: expect.any(Number) },
        { level: 'error', args: [4], time: expect.any(Number) },
        { level: 'trace', args: [5], time: expect.any(Number) },
        { level: 'debug', args: [6], time: expect.any(Number) },
        { level: 'warn', args: [7], time: expect.any(Number) },
        { level: 'error', args: [8], time: expect.any(Number) },
        { level: 'trace', args: [9], time: expect.any(Number) },
        { level: 'debug', args: [10], time: expect.any(Number) }
      ]
    })
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('sends traces, logs, warns and erros after some time', () => {
    console.trace(17)
    console.log(18)
    console.warn(19)
    console.error(20)
    expect(send).not.toHaveBeenCalled()
    send.mockRejectedValueOnce(new Error('boom!'))
    jest.advanceTimersByTime(5000)
    expect(send).toHaveBeenCalledTimes(1)

    configureLogForward()
    jest.advanceTimersByTime(5000)
    expect(send).toHaveBeenCalledWith({
      logs: [
        { level: 'trace', args: [17], time: expect.any(Number) },
        { level: 'debug', args: [18], time: expect.any(Number) },
        { level: 'warn', args: [19], time: expect.any(Number) },
        { level: 'error', args: [20], time: expect.any(Number) }
      ]
    })
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('sends data from previous run', () => {
    console.trace(21)
    console.log(22)
    console.warn(23)
    console.error(24)
    jest.advanceTimersByTime(1000)
    expect(send).not.toHaveBeenCalled()
    configureLogForward()
    jest.advanceTimersByTime(4500)
    expect(send).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1000)
    expect(send).toHaveBeenCalledWith({
      logs: [
        { level: 'trace', args: [21], time: expect.any(Number) },
        { level: 'debug', args: [22], time: expect.any(Number) },
        { level: 'warn', args: [23], time: expect.any(Number) },
        { level: 'error', args: [24], time: expect.any(Number) }
      ]
    })
    expect(send).toHaveBeenCalledTimes(1)
  })
})
