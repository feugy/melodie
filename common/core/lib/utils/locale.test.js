import { osLocale } from 'os-locale'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getSystemLocale } from './locale'
vi.mock('os-locale')

describe('getSystemLocale utility', () => {
  beforeEach(() => vi.clearAllMocks())

  it('removes regional variant', async () => {
    osLocale.mockResolvedValueOnce('fr-FR')
    expect(await getSystemLocale()).toBe('fr')
  })

  it('returns regional-less result', async () => {
    osLocale.mockResolvedValueOnce('en')
    expect(await getSystemLocale()).toBe('en')
  })
})
