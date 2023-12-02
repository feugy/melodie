import { tick } from 'svelte'
import { locale } from 'svelte-intl'
import { afterEach, describe, expect, it } from 'vitest'

import { formatTime, formatTimeLong, getYears, sumDurations } from './time'

describe('time utilities', () => {
  describe('formatTime()', () => {
    it('handles seconds', () => {
      expect(formatTime(52)).toBe('0:52')
      expect(formatTime(34.741)).toBe('0:35')
      expect(formatTime(1.124)).toBe('0:01')
    })

    it('handles minutes and seconds', () => {
      expect(formatTime(75)).toBe('1:15')
      expect(formatTime(261.741)).toBe('4:22')
      expect(formatTime(3548.124)).toBe('59:08')
    })

    it('handles hours minutes and seconds', () => {
      expect(formatTime(31741)).toBe('8:49:01')
      expect(formatTime(3608.124)).toBe('1:00:08')
    })
  })

  describe('formatTimeLong()', () => {
    afterEach(() => locale.set('en'))

    it('round seconds', () => {
      expect(formatTimeLong(122)).toBe('2 minutes')
      expect(formatTimeLong(34.741)).toBe('1 minute')
      expect(formatTimeLong(1.124)).toBe('')
    })

    it('handles hours ans minutes', () => {
      expect(formatTimeLong(31741)).toBe('8 hours 49 minutes')
      expect(formatTimeLong(3608.124)).toBe('1 hour')
    })

    it('handles locale changes', async () => {
      locale.set('fr')
      await tick()
      expect(formatTimeLong(31741)).toBe('8 heures 49 minutes')
      expect(formatTimeLong(3608.124)).toBe('1 heure')
    })
  })

  describe('sumDurations()', () => {
    it('sums durations of all tracks', () => {
      expect(
        sumDurations([
          {
            tags: { duration: 52 }
          },
          {
            tags: { duration: 34.741 }
          },
          {
            tags: { duration: 1.124 }
          }
        ])
      ).toEqual(87.865)
    })

    it('handles missing trakcs', () => {
      expect(sumDurations()).toBe(0)
    })

    it('handles null or undefined trakcs', () => {
      expect(
        sumDurations([
          undefined,
          {
            tags: { duration: 52 }
          },
          null,
          {
            tags: { duration: 18 }
          }
        ])
      ).toBe(70)
    })
  })

  describe('getYears()', () => {
    it('returns year range', () => {
      expect(
        getYears([
          {
            tags: { year: 2010 }
          },
          {
            tags: { year: 2009 }
          },
          {
            tags: { year: 2012 }
          },
          {
            tags: { year: 2010 }
          }
        ])
      ).toBe('2009~2012')
    })

    it('returns year', () => {
      expect(
        getYears([
          {
            tags: { year: 2010 }
          },
          {
            tags: { year: 2010 }
          },
          {
            tags: { year: 2010 }
          },
          {
            tags: { year: 2010 }
          }
        ])
      ).toBe('2010')
    })

    it('returns year range with missing years', () => {
      expect(
        getYears([
          {
            tags: { year: null }
          },
          {
            tags: { year: 2008 }
          },
          {
            tags: { year: 2015 }
          },
          {
            tags: { year: 2010 }
          },
          {
            tags: {}
          }
        ])
      ).toBe('2008~2015')
    })

    it('returns year with missing years', () => {
      expect(
        getYears([
          {
            tags: { year: 2010 }
          },
          {
            tags: { year: null }
          },
          {
            tags: { year: 2010 }
          },
          {
            tags: {}
          }
        ])
      ).toBe('2010')
    })

    it('returns null for missing years', () => {
      expect(
        getYears([
          {
            tags: { year: null }
          },
          {
            tags: {}
          }
        ])
      ).toBeNull()
    })

    it('returns null for empty track list', () => {
      expect(getYears([])).toBeNull()
    })

    it('returns null for no track list', () => {
      expect(getYears()).toBeNull()
    })
  })
})
