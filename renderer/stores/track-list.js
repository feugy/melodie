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

    add(values) {
      update(state => {
        const tracks = [...state.tracks, ...values]
        return {
          ...state,
          tracks,
          current: state.current || tracks[state.index]
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
