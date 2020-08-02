'use strict'

export function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600) / 60)
  const secs = Math.round(seconds % 60)
  return `${hours > 0 ? `${hours}:` : ''}${
    hours > 0 && minutes < 10 ? '0' : ''
  }${minutes}:${secs < 10 ? '0' : ''}${secs}`
}

export function sumDurations(tracks) {
  return (tracks || []).reduce(
    (sum, { tags: { duration } }) => sum + duration,
    0
  )
}
