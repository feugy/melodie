import { faker } from '@faker-js/faker'
import { Subject } from 'rxjs'
import { get } from 'svelte/store'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { fromServerEvent } from '../utils/connection'

vi.mock('../utils/connection', () => ({ fromServerEvent: vi.fn() }))

describe('totp store', () => {
  let cleanup
  let init
  let totp
  let setTotp
  let serverTotp = new Subject()
  fromServerEvent.mockReturnValue(serverTotp)

  beforeAll(async () => {
    vi.useFakeTimers()
    ;({ cleanup, init, totp, setTotp } = await import('./totp'))
    cleanup()
  })

  afterAll(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('has no initial value', () => {
    expect(get(totp)).toBeNull()
  })

  it('can be null with no parameters', async () => {
    await init()
    expect(get(totp)).toBeNull()
  })

  it('can be changed', async () => {
    const value = faker.number.int({ min: 100000, max: 999999 }).toString()
    await init(null, 'initial')
    expect(get(totp)).toBe('initial')
    setTotp(value)
    expect(get(totp)).toEqual(value)
  })

  describe('given a store initialized with a secret', () => {
    beforeAll(() => init(faker.string.uuid()))

    it('changes value every 30 seconds', async () => {
      let now = Date.now()
      let value1 = get(totp)
      expect(value1).toMatch(/\d{6}/)
      expect(get(totp)).toEqual(value1)

      vi.setSystemTime(now + 30000)
      vi.runOnlyPendingTimers()

      let value2 = get(totp)
      expect(value2).toMatch(/\d{6}/)
      expect(value2).not.toEqual(value1)

      vi.setSystemTime(now + 60000)
      vi.runOnlyPendingTimers()

      let valu000 = get(totp)
      expect(valu000).toMatch(/\d{6}/)
      expect(valu000).not.toEqual(value1)
      expect(valu000).not.toEqual(value2)
    })

    it('can be cleaned up', () => {
      expect(get(totp)).toMatch(/\d{6}/)
      cleanup()
      expect(get(totp)).toBeNull()

      vi.setSystemTime(Date.now() + 30000)
      vi.runOnlyPendingTimers()
      expect(get(totp)).toBeNull()
    })
  })

  describe('given a store initialized with a value', () => {
    const value = faker.number.int({ min: 100000, max: 999999 }).toString()

    beforeAll(() => init(null, value))

    it('has constant value', () => {
      let now = Date.now()
      expect(get(totp)).toEqual(value)

      vi.setSystemTime(now + 30000)
      vi.runOnlyPendingTimers()

      expect(get(totp)).toEqual(value)
    })

    it('can be cleaned up', () => {
      expect(get(totp)).toEqual(value)
      cleanup()
      expect(get(totp)).toBeNull()

      vi.setSystemTime(Date.now() + 30000)
      vi.runOnlyPendingTimers()
      expect(get(totp)).toBeNull()
    })
  })
})
