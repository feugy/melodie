'use strict'

import { BehaviorSubject, ReplaySubject } from 'rxjs'
import { mergeMap, map, scan } from 'rxjs/operators'
import { fromServerChannel } from './channel'
import { invoke } from './invoke'

const collator = new Intl.Collator([], { numeric: true })

export function createListStore(type, sortBy = 'rank') {
  const changes = fromServerChannel(`${type}-change`)

  const removals = fromServerChannel(`${type}-removal`)

  changes.subscribe(changed => items$.next({ changed }))

  removals.subscribe(removedId => items$.next({ removedId }))

  const items$ = new ReplaySubject().pipe(
    scan((list, { clear, added, changed, removedId }) => {
      if (clear) {
        list = []
      }
      if (added) {
        list.push(...added)
      }
      if (changed) {
        const idx = list.findIndex(({ id }) => id === changed.id)
        if (idx !== -1) {
          list[idx] = changed
        } else {
          list.push(changed)
        }
      }
      if (removedId) {
        const idx = list.findIndex(({ id }) => id === removedId)
        if (idx !== -1) {
          list.splice(idx, 1)
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
        items$.next({ changed: item })
      }
      return item
    }
  }

  // first init
  store.reset()
  return store
}
