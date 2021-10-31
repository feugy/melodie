'use strict'

import faker from 'faker'
import { Subject } from 'rxjs'
import { get } from 'svelte/store'
import { fromServerEvent } from '../utils/connection'

jest.mock('../utils/connection', () => ({ fromServerEvent: jest.fn() }))

describe('totp store', () => {
  let cleanup
  let init
  let totp
  let serverTotp = new Subject()
  fromServerEvent.mockReturnValue(serverTotp)

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

  it('falls back to local storage value when initialized without parameters', async () => {
    const value = faker.datatype.number({ min: 100000, max: 999999 }).toString()
    localStorage.setItem('totp', value)
    await init()
    expect(get(totp)).toEqual(value)
  })

  it('can be null with no storage nor parameters', () => {
    localStorage.removeItem('totp')
    init()
    expect(get(totp)).toBeNull()
  })

  describe('given a store initialized with a secret', () => {
    beforeAll(() => init(faker.datatype.uuid()))

    it('changes value every 30 seconds', async () => {
      let now = Date.now()
      let value1 = get(totp)
      expect(value1).toMatch(/\d{6}/)
      expect(get(totp)).toEqual(value1)

      jest.setSystemTime(now + 30000)
      jest.runOnlyPendingTimers()

      let value2 = get(totp)
      expect(value2).toMatch(/\d{6}/)
      expect(value2).not.toEqual(value1)

      jest.setSystemTime(now + 60000)
      jest.runOnlyPendingTimers()

      let valu000 = get(totp)
      expect(valu000).toMatch(/\d{6}/)
      expect(valu000).not.toEqual(value1)
      expect(valu000).not.toEqual(value2)
    })

    it('can be cleaned up', () => {
      expect(get(totp)).toMatch(/\d{6}/)
      cleanup()
      expect(get(totp)).toBeNull()

      jest.setSystemTime(Date.now() + 30000)
      jest.runOnlyPendingTimers()
      expect(get(totp)).toBeNull()
    })
  })

  describe('given a store initialized with a value', () => {
    const value = faker.datatype.number({ min: 100000, max: 999999 }).toString()

    beforeAll(() => init(null, value))

    it('has constant value, saved in local storage', () => {
      let now = Date.now()
      expect(get(totp)).toEqual(value)

      jest.setSystemTime(now + 30000)
      jest.runOnlyPendingTimers()

      expect(get(totp)).toEqual(value)
      expect(localStorage.getItem('totp')).toEqual(value)
    })

    it('updates when receiving server value', () => {
      expect(get(totp)).toEqual(value)
      expect(localStorage.getItem('totp')).toEqual(value)

      const nextValue = faker.datatype
        .number({ min: 100000, max: 999999 })
        .toString()
      serverTotp.next(nextValue)
      expect(get(totp)).toEqual(nextValue)
      expect(localStorage.getItem('totp')).toEqual(nextValue)

      serverTotp.next(value)
      expect(get(totp)).toEqual(value)
      expect(localStorage.getItem('totp')).toEqual(value)
    })

    it('can be cleaned up', () => {
      expect(get(totp)).toEqual(value)
      expect(localStorage.getItem('totp')).toEqual(value)
      cleanup()
      expect(get(totp)).toBeNull()

      jest.setSystemTime(Date.now() + 30000)
      jest.runOnlyPendingTimers()
      expect(get(totp)).toBeNull()
      expect(localStorage.getItem('totp')).toBeNull()
    })
  })
})
