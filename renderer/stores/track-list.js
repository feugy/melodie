'use strict'

import { writable } from 'svelte/store'

function createTrackList() {
  const initial = {
    tracks: [],
    index: 0,
    current: undefined
  }

  const { subscribe, update, set } = writable(initial)
  return {
    subscribe,

    add(values, play = false) {
      update(state => {
        const tracks = [
          ...(play ? [] : state.tracks),
          ...(Array.isArray(values) ? values : [values])
        ]
        return {
          ...state,
          index: play ? 0 : state.index,
          tracks,
          current: play || !state.current ? tracks[state.index] : state.current
        }
      })
    },

    next() {
      update(state => {
        const index = (state.index + 1) % state.tracks.length
        return {
          ...state,
          index,
          current: state.tracks[index]
        }
      })
    },

    previous() {
      update(state => {
        const index =
          state.index === 0 ? state.tracks.length - 1 : state.index - 1
        return {
          ...state,
          index,
          current: state.tracks[index]
        }
      })
    },

    clear() {
      set(initial)
    }
  }
}

export default createTrackList()
