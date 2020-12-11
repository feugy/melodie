'use strict'

import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { mergeMap, map, scan } from 'rxjs/operators'
import { fromServerChannel } from './channel'
import { invoke } from './invoke'

const collator = new Intl.Collator([], { numeric: true })

export function createListStore(type, sortBy = 'rank') {
  const changes = fromServerChannel(`${type}-changes`)

  const removals = fromServerChannel(`${type}-removals`)

  changes.subscribe(added => items$.next({ added }))

  removals.subscribe(removedIds => items$.next({ removedIds }))

  const items$ = new ReplaySubject().pipe(
    scan((list, { clear, added, removedIds }) => {
      if (clear) {
        list = []
      }
      if (added) {
        for (const item of added) {
          const idx = list.findIndex(({ id }) => id === item.id)
          if (idx !== -1) {
            list[idx] = item
          } else {
            list.push(item)
          }
        }
      }
      if (removedIds) {
        for (const removed of removedIds) {
          const idx = list.findIndex(({ id }) => id === removed)
          if (idx !== -1) {
            list.splice(idx, 1)
          }
        }
      }
      return list.sort((a, b) => collator.compare(a.name, b.name))
    }, [])
  )

  const isListing$ = new BehaviorSubject(false)

  let listSubscription = null

  const store = {
    [`${type}s`]: items$.asObservable(),

    changes,

    removals,

    isListing: isListing$.asObservable(),

    reset() {
      items$.next({ clear: true })
    },

    list() {
      if (listSubscription) {
        listSubscription.unsubscribe()
      }
      isListing$.next(true)
      items$.next({ clear: true })

      const request$ = new BehaviorSubject({ size: 10 })

      listSubscription = request$
        .pipe(
          mergeMap(arg => invoke('tracks.list', type, arg)),
          map(data => {
            const { size, from, total, results } = data
            items$.next({ added: results })
            const nextFrom = from + results.length
            if (nextFrom < total) {
              request$.next({ from: nextFrom, size })
            } else {
              request$.complete()
              listSubscription = null
              isListing$.next(false)
            }
          })
        )
        .subscribe()
    },

    async load(id) {
      const item = await invoke('tracks.fetchWithTracks', type, id, sortBy)
      if (item) {
        items$.next({ added: [item] })
      }
      return item
    }
  }

  // first init
  store.reset()
  return store
}
