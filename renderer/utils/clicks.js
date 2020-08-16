'use strict'

import { Subject, race } from 'rxjs'
import { bufferCount, debounceTime, first, repeat, tap } from 'rxjs/operators'

const dblClickDuration = 250

export function createClickObservable(handleSingle, handleDouble) {
  const clicks$ = new Subject()
  const debounce$ = clicks$.pipe(debounceTime(dblClickDuration))
  const clickLimit$ = clicks$.pipe(bufferCount(2))
  const bufferGate$ = race(debounce$, clickLimit$).pipe(
    first(),
    repeat(),
    tap(clicked => {
      if (Array.isArray(clicked)) {
        handleDouble(clicked[0])
      } else {
        handleSingle(clicked)
      }
    })
  )
  return {
    subscribe: bufferGate$.subscribe.bind(bufferGate$),
    next: clicks$.next.bind(clicks$)
  }
}
