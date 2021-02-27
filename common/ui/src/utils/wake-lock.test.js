'use strict'

const { stayAwake, releaseWakeLock } = require('./wake-lock')

describe('wake lock utilities', () => {
  let request
  let release

  beforeEach(() => {
    jest.resetAllMocks()
    release = jest.fn()
    request = jest.fn().mockResolvedValue({ release })
    navigator.wakeLock = { request }
  })

  afterEach(async () => {
    for (let i = 0; i < 10; i++) {
      await releaseWakeLock()
    }
  })

  it('does not throw when releasing no lock', async () => {
    expect(releaseWakeLock()).resolves.toBeUndefined()
  })

  it('acquires lock only on first call', async () => {
    await stayAwake()
    expect(request).toHaveBeenCalledWith('screen')
    await stayAwake()
    await stayAwake()
    expect(request).toHaveBeenCalledTimes(1)
    expect(release).not.toHaveBeenCalled()
  })

  it('releases lock only on last call', async () => {
    await stayAwake()
    expect(request).toHaveBeenCalledWith('screen')
    await stayAwake()
    await stayAwake()
    await releaseWakeLock()
    expect(release).not.toHaveBeenCalled()
    await releaseWakeLock()
    expect(release).not.toHaveBeenCalled()
    await releaseWakeLock()
    expect(request).toHaveBeenCalledTimes(1)
    expect(release).toHaveBeenCalledTimes(1)
  })
})
