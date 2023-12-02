import { faker } from '@faker-js/faker'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sleep } from '../tests'
import { createClickObservable } from './clicks'

describe('click observer', () => {
  let subscription
  const handleSingle = vi.fn()
  const handleDouble = vi.fn()

  const clicks$ = createClickObservable(handleSingle, handleDouble)

  beforeEach(() => {
    vi.resetAllMocks()
    subscription = clicks$.subscribe()
  })

  afterEach(() => subscription.unsubscribe())

  it('detects single clicks', async () => {
    const item = faker.number.int()

    await clicks$.next(item)
    await sleep(300)

    expect(handleSingle).toHaveBeenCalledWith(item)
    expect(handleDouble).not.toHaveBeenCalled()
  })

  it('detects double clicks', async () => {
    const item = faker.number.int()

    await clicks$.next(item)
    await clicks$.next(item)
    await sleep(300)

    expect(handleDouble).toHaveBeenCalledWith(item)
    expect(handleSingle).not.toHaveBeenCalled()
  })

  it('can handles mix of double and single clicks', async () => {
    const item1 = faker.number.int()
    const item2 = faker.number.int()

    await clicks$.next(item1)
    await clicks$.next(item1)
    await clicks$.next(item2)
    await sleep(300)

    expect(handleDouble).toHaveBeenCalledWith(item1)
    expect(handleSingle).toHaveBeenCalledWith(item2)
  })
})
