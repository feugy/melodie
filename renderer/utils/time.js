'use strict'

import { tick } from 'svelte'
import { get } from 'svelte/store'
import { translate, locale } from 'svelte-intl'

const labels = {}
locale.subscribe(async () => {
  // await on translate to update before getting labels
  await tick()
  const _ = get(translate)
  labels.hour = _('an hour')
  labels.hours = _('_ hours', { value: '_' })
  labels.minute = _('a minute')
  labels.minutes = _('_ minutes', { value: '_' })
})

export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600) / 60)
  const secs = Math.round(seconds % 60)
  return `${hours > 0 ? `${hours}:` : ''}${
    hours > 0 && minutes < 10 ? '0' : ''
  }${minutes}:${secs < 10 ? '0' : ''}${secs}`
}

export function formatTimeLong(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds - hours * 3600) / 60)
  const formattedHour =
    hours === 1
      ? labels.hour
      : hours > 1
      ? labels.hours.replace('_', hours)
      : ''
  const formattedMinute =
    minutes === 1
      ? labels.minute
      : minutes > 1
      ? labels.minutes.replace('_', minutes)
      : ''
  return `${formattedHour}${
    formattedHour && formattedMinute ? ' ' : ''
  }${formattedMinute}`
}

export function sumDurations(tracks) {
  return (tracks || []).reduce(
    (sum, { tags: { duration } }) => sum + duration,
    0
  )
}

export function getYears(tracks) {
  const { min, max } = (tracks || []).reduce(
    ({ min, max }, { tags: { year } }) =>
      year
        ? { min: Math.min(min, year), max: Math.max(max, year) }
        : { min, max },
    { min: Infinity, max: 0 }
  )
  return !max ? null : min === max ? `${min}` : `${min}~${max}`
}
