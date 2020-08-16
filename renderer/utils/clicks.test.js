'use strict'

import faker from 'faker'
import { createClickObservable } from './clicks'
import { sleep } from '../tests'

describe('click observer', () => {
  let subscription
  const handleSingle = jest.fn()
  const handleDouble = jest.fn()

  const clicks$ = createClickObservable(handleSingle, handleDouble)

  beforeEach(() => {
    jest.resetAllMocks()
    subscription = clicks$.subscribe()
  })

  afterEach(() => subscription.unsubscribe())

  it('detects single clicks', async () => {
    const item = faker.random.number()

    await clicks$.next(item)
    await sleep(300)

    expect(handleSingle).toHaveBeenCalledWith(item)
    expect(handleDouble).not.toHaveBeenCalled()
  })

  it('detects double clicks', async () => {
    const item = faker.random.number()

    await clicks$.next(item)
    await clicks$.next(item)
    await sleep(300)

    expect(handleDouble).toHaveBeenCalledWith(item)
    expect(handleSingle).not.toHaveBeenCalled()
  })

  it('can handles mix of double and single clicks', async () => {
    const item1 = faker.random.number()
    const item2 = faker.random.number()

    await clicks$.next(item1)
    await clicks$.next(item1)
    await clicks$.next(item2)
    await sleep(300)

    expect(handleDouble).toHaveBeenCalledWith(item1)
    expect(handleSingle).toHaveBeenCalledWith(item2)
  })
})
