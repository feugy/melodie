'use strict'

import faker from 'faker'
import { clear, current, showSnack } from './snackbars'
import { sleep } from '../tests'

describe('snackbars store', () => {
  let subscription
  let snackbarCalls = []

  beforeAll(() => {
    subscription = current.subscribe(data => {
      snackbarCalls.push(data)
    })
  })

  beforeEach(() => {
    clear()
    snackbarCalls = []
  })

  afterAll(() => {
    subscription.unsubscribe()
  })

  it('is empty by default', async () => {
    expect(snackbarCalls).toEqual([])
  })

  describe('showSnack', () => {
    it('shows snack and removes it', async () => {
      const message = faker.lorem.words()
      showSnack({ message }, 10)

      await sleep()
      expect(snackbarCalls).toEqual([null, { message }])

      await sleep(15)
      expect(snackbarCalls).toEqual([null, { message }, null])
    })

    it('enqueues snacks and removes them in order', async () => {
      const msg1 = faker.lorem.words()
      const msg2 = faker.lorem.words()
      const msg3 = faker.lorem.words()

      showSnack({ message: msg1 }, 10)

      await sleep(3)
      showSnack({ message: msg2 }, 10)
      expect(snackbarCalls).toEqual([null, { message: msg1 }])

      await sleep(10)
      showSnack({ message: msg3 }, 10)
      expect(snackbarCalls).toEqual([
        null,
        { message: msg1 },
        null,
        { message: msg2 }
      ])

      await sleep(10)
      expect(snackbarCalls).toEqual([
        null,
        { message: msg1 },
        null,
        { message: msg2 },
        null,
        { message: msg3 }
      ])

      await sleep(10)
      expect(snackbarCalls).toEqual([
        null,
        { message: msg1 },
        null,
        { message: msg2 },
        null,
        { message: msg3 },
        null
      ])
    })

    it('uses the specified duration when enqueuing slacks', async () => {
      const msg1 = faker.lorem.words()
      const msg2 = faker.lorem.words()
      const margin = 5

      showSnack({ message: msg1 }, 100)

      await sleep(30)
      showSnack({ message: msg2 }, 50)
      expect(snackbarCalls).toEqual([null, { message: msg1 }])

      await sleep(70 + margin)
      expect(snackbarCalls).toEqual([
        null,
        { message: msg1 },
        null,
        { message: msg2 }
      ])

      await sleep(50 + margin)
      expect(snackbarCalls).toEqual([
        null,
        { message: msg1 },
        null,
        { message: msg2 },
        null
      ])
    })
  })
})
