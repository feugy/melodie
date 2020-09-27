'use strict'

import { Subject } from 'rxjs'
import { map, scan } from 'rxjs/operators'

const queue$ = new Subject()
const head$ = new Subject()

queue$
  .pipe(
    scan((list, added) => {
      if (!added) {
        head$.next()
        return []
      }
      if (added.data) {
        if (!list.length) {
          head$.next(added)
        }
        return [...list, added]
      }
      list.shift()
      head$.next(list[0])
      return list
    }, [])
  )
  .subscribe()

export const current = head$.pipe(
  map(head => {
    if (head) {
      const { data, duration } = head
      if (!duration) {
        return data
      }
      setTimeout(() => queue$.next({ shift: true }), duration)
      // instead of returning the value immediately,
      // return null so components would remove nodes,
      // and delay the emition of the real data so they
      // can create new nodes.
      setTimeout(() => head$.next({ data }), 0)
    }
    return null
  })
)

export function showSnack(data, duration = 5000) {
  queue$.next({ data, duration })
}

export function clear() {
  queue$.next()
}
