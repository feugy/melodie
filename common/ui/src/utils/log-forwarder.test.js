import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { sendLogs } from './connection'

vi.mock('./connection', () => ({ sendLogs: vi.fn() }))

describe('log forwarder', () => {
  let configureLogForward
  const originals = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  }

  beforeEach(() => {
    vi.resetAllMocks()
    configureLogForward()
  })

  beforeAll(async () => {
    vi.useFakeTimers()
    console.log = () => {}
    console.warn = () => {}
    console.error = () => {}
    ;({ configureLogForward } = await import('./log-forwarder'))
  })

  afterEach(() => {
    vi.clearAllTimers()
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
    expect(sendLogs).toHaveBeenCalledWith([
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
    ])
    expect(sendLogs).toHaveBeenCalledOnce()
  })

  it('sends traces, logs, warns and erros after some time', () => {
    console.trace(17)
    console.log(18)
    console.warn(19)
    console.error(20)
    expect(sendLogs).not.toHaveBeenCalled()
    sendLogs.mockRejectedValueOnce(new Error('boom!'))
    vi.advanceTimersByTime(5000)
    expect(sendLogs).toHaveBeenCalledOnce()

    configureLogForward()
    vi.advanceTimersByTime(5000)
    expect(sendLogs).toHaveBeenCalledWith([
      { level: 'trace', args: [17], time: expect.any(Number) },
      { level: 'debug', args: [18], time: expect.any(Number) },
      { level: 'warn', args: [19], time: expect.any(Number) },
      { level: 'error', args: [20], time: expect.any(Number) }
    ])
    expect(sendLogs).toHaveBeenCalledOnce()
  })

  it('sends data from previous run', () => {
    console.trace(21)
    console.log(22)
    console.warn(23)
    console.error(24)
    vi.advanceTimersByTime(1000)
    expect(sendLogs).not.toHaveBeenCalled()
    configureLogForward()
    vi.advanceTimersByTime(4500)
    expect(sendLogs).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1000)
    expect(sendLogs).toHaveBeenCalledWith([
      { level: 'trace', args: [21], time: expect.any(Number) },
      { level: 'debug', args: [22], time: expect.any(Number) },
      { level: 'warn', args: [23], time: expect.any(Number) },
      { level: 'error', args: [24], time: expect.any(Number) }
    ])
    expect(sendLogs).toHaveBeenCalledOnce()
  })
})
