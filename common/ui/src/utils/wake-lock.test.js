import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { releaseWakeLock, stayAwake } from './wake-lock'

describe('wake lock utilities', () => {
  let request
  let release

  beforeEach(() => {
    vi.resetAllMocks()
    release = vi.fn()
    request = vi.fn().mockResolvedValue({ release })
    navigator.wakeLock = { request }
  })

  afterEach(async () => {
    for (let i = 0; i < 10; i++) {
      await releaseWakeLock()
    }
  })

  it('does not throw when releasing no lock', async () => {
    await expect(releaseWakeLock()).resolves.toBeUndefined()
  })

  it('acquires lock only on first call', async () => {
    await stayAwake()
    expect(request).toHaveBeenCalledWith('screen')
    await stayAwake()
    await stayAwake()
    expect(request).toHaveBeenCalledOnce()
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
    expect(request).toHaveBeenCalledOnce()
    expect(release).toHaveBeenCalledOnce()
  })
})
