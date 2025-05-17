import { afterEach, describe, expect, it } from 'bun:test'
import type { Tags } from '@melodie/common/types'
import { locale } from 'svelte-intl-precompile'
import { formatTime, formatTimeLong, getYears, sumDurations } from './time'

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

		it('handles hours and minutes', () => {
			locale.set('en')
			expect(formatTimeLong(31741)).toEqual('8 hours 49 minutes')
			expect(formatTimeLong(3608.124)).toEqual('1 hour')
			expect(formatTimeLong(122)).toEqual('2 minutes')
		})

		it('handles locale changes', () => {
			locale.set('fr')
			expect(formatTimeLong(31741)).toEqual('8 heures 49 minutes')
			expect(formatTimeLong(3608.124)).toEqual('1 heure')
			expect(formatTimeLong(122)).toEqual('2 minutes')
		})
	})

	describe('sumDurations()', () => {
		it('sums durations of all tracks ', () => {
			expect(
				sumDurations([
					{ tags: { duration: 52, genre: [], artists: [] } },
					{ tags: { duration: 34.741, genre: [], artists: [] } },
					{ tags: { duration: 1.124, genre: [], artists: [] } }
				])
			).toEqual(87.865)
		})

		it('handles missing trakcs ', () => {
			expect(sumDurations()).toEqual(0)
		})

		it('handles null or undefined trakcs ', () => {
			expect(
				sumDurations([
					undefined,
					{ tags: { duration: 52, genre: [], artists: [] } },
					null,
					{ tags: { duration: 18, genre: [], artists: [] } }
				])
			).toEqual(70)
		})
	})

	describe('getYears()', () => {
		it('returns year range', () => {
			expect(
				getYears([
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2009, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2012, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } }
				])
			).toEqual('2009~2012')
		})

		it('returns year', () => {
			expect(
				getYears([
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } }
				])
			).toEqual('2010')
		})

		it('returns year range with missing years', () => {
			expect(
				getYears([
					{ tags: { year: null } as unknown as Tags },
					{ tags: { year: 2008, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2015, duration: 0, genre: [], artists: [] } },
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } },
					{ tags: { duration: 0, genre: [], artists: [] } }
				])
			).toEqual('2008~2015')
		})

		it('returns year with missing years', () => {
			expect(
				getYears([
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } },
					{ tags: { year: null } as unknown as Tags },
					{ tags: { year: 2010, duration: 0, genre: [], artists: [] } },
					{ tags: { duration: 0, genre: [], artists: [] } }
				])
			).toEqual('2010')
		})

		it('returns null for missing years', () => {
			expect(
				getYears([
					{ tags: { year: null } as unknown as Tags },
					{ tags: { duration: 0, genre: [], artists: [] } }
				])
			).toEqual(null)
		})

		it('returns null for empty track list', () => {
			expect(getYears([])).toEqual(null)
		})

		it('returns null for no track list', () => {
			expect(getYears()).toEqual(null)
		})
	})
})
