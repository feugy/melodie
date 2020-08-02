'use strict'

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
}
