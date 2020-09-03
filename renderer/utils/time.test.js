'use strict'

import { tick } from 'svelte'
import { locale } from 'svelte-intl'
import { formatTime, formatTimeLong, sumDurations } from './time'

describe('time utilities', () => {
  describe('formatTime()', () => {
    it('handles seconds', () => {
      expect(formatTime(52)).toEqual('0:52')
      expect(formatTime(34.741)).toEqual('0:35')
      expect(formatTime(1.124)).toEqual('0:01')
    })

    it('handles minutes and seconds', () => {
      expect(formatTime(75)).toEqual('1:15')
      expect(formatTime(261.741)).toEqual('4:22')
      expect(formatTime(3548.124)).toEqual('59:08')
    })

    it('handles hours minutes and seconds', () => {
      expect(formatTime(31741)).toEqual('8:49:01')
      expect(formatTime(3608.124)).toEqual('1:00:08')
    })
  })

  describe('formatTimeLong()', () => {
    afterEach(() => locale.set('en'))

    it('round seconds', () => {
      expect(formatTimeLong(122)).toEqual('2 minutes')
      expect(formatTimeLong(34.741)).toEqual('1 minute')
      expect(formatTimeLong(1.124)).toEqual('')
    })

    it('handles hours ans minutes', () => {
      expect(formatTimeLong(31741)).toEqual('8 hours 49 minutes')
      expect(formatTimeLong(3608.124)).toEqual('1 hour')
    })

    it('handles locale changes', async () => {
      locale.set('fr')
      await tick()
      expect(formatTimeLong(31741)).toEqual('8 heures 49 minutes')
      expect(formatTimeLong(3608.124)).toEqual('1 heure')
    })
  })

  describe('sumDurations()', () => {
    it('sums durations of all tracks ', () => {
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

    it('handles missing trakcs ', () => {
      expect(sumDurations()).toEqual(0)
    })
  })
})
