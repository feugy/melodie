'use strict'

import faker from 'faker'
import { get } from 'svelte/store'

describe('totp store', () => {
  let cleanup, init, totp

  beforeAll(async () => {
    jest.useFakeTimers()
    ;({ cleanup, init, totp } = await import('./totp'))
    cleanup()
  })

  afterAll(() => {
    cleanup()
    jest.useRealTimers()
  })

  it('has no initial value', () => {
    expect(get(totp)).toBeNull()
  })

  describe('given a store initialized with a secret', () => {
    beforeAll(() => init(faker.datatype.uuid()))

    it('changes value every 30 seconds', async () => {
      let now = Date.now()
      let value1 = get(totp)
      expect(value1).toMatch(/\d{6}/)
      expect(get(totp)).toEqual(value1)

      jest.setSystemTime(now + 30e3)
      jest.runOnlyPendingTimers()

      let value2 = get(totp)
      expect(value2).toMatch(/\d{6}/)
      expect(value2).not.toEqual(value1)

      jest.setSystemTime(now + 60e3)
      jest.runOnlyPendingTimers()

      let value3 = get(totp)
      expect(value3).toMatch(/\d{6}/)
      expect(value3).not.toEqual(value1)
      expect(value3).not.toEqual(value2)
    })

    it('can be cleaned up', () => {
      expect(get(totp)).toMatch(/\d{6}/)
      cleanup()
      expect(get(totp)).toBeNull()

      jest.setSystemTime(Date.now() + 30e3)
      jest.runOnlyPendingTimers()
      expect(get(totp)).toBeNull()
    })
  })

  describe('given a store initialized with a value', () => {
    let value = faker.datatype.number({ min: 100000, max: 999999 })

    beforeAll(() => init(null, value))

    it('has constant vlue', async () => {
      let now = Date.now()
      expect(get(totp)).toEqual(value)

      jest.setSystemTime(now + 30e3)
      jest.runOnlyPendingTimers()

      expect(get(totp)).toEqual(value)
    })

    it('can be cleaned up', () => {
      expect(get(totp)).toEqual(value)
      cleanup()
      expect(get(totp)).toBeNull()

      jest.setSystemTime(Date.now() + 30e3)
      jest.runOnlyPendingTimers()
      expect(get(totp)).toBeNull()
    })
  })
})
