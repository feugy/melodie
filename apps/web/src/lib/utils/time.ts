import type { Track } from '@melodie/common/models'
import { t } from 'svelte-intl-precompile'
import { get } from 'svelte/store'

export function formatTime(seconds?: number | null) {
	const totalSecs = seconds ?? 0
	const hours = Math.floor(totalSecs / 3600)
	const minutes = Math.floor((totalSecs - hours * 3600) / 60)
	const secs = Math.round(totalSecs % 60)
	return `${hours > 0 ? `${hours}:` : ''}${
		hours > 0 && minutes < 10 ? '0' : ''
	}${minutes}:${secs < 10 ? '0' : ''}${secs}`
}

export function formatTimeLong(seconds: number) {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.round((seconds - hours * 3600) / 60)
	return get(t)('hours_minutes', { values: { hours, minutes } }).trim()
}

export function sumDurations(
	tracks?: (Pick<Track, 'tags'> | null | undefined)[]
) {
	return (tracks ?? []).reduce(
		(sum, track) => sum + (track?.tags?.duration || 0),
		0
	)
}

export function getYears(tracks?: (Pick<Track, 'tags'> | null | undefined)[]) {
	const { min, max } = (tracks ?? []).reduce(
		({ min, max }, track) =>
			track?.tags.year
				? {
						min: Math.min(min, track.tags.year),
						max: Math.max(max, track.tags.year)
					}
				: { min, max },
		{ min: Number.POSITIVE_INFINITY, max: 0 }
	)
	return !max ? null : min === max ? `${min}` : `${min}~${max}`
}
