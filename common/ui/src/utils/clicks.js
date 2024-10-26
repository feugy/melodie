import { race, Subject } from 'rxjs'
import { bufferCount, debounceTime, first, repeat } from 'rxjs/operators'

const dblClickDuration = 250

export function createClickObservable(handleSingle, handleDouble) {
  const clicks$ = new Subject()
  const debounce$ = clicks$.pipe(debounceTime(dblClickDuration))
  const clickLimit$ = clicks$.pipe(bufferCount(2))
  const bufferGate$ = race(debounce$, clickLimit$).pipe(first(), repeat())
  return {
    subscribe: () =>
      bufferGate$.subscribe(clicked => {
        if (Array.isArray(clicked)) {
          handleDouble(clicked[0])
        } else {
          handleSingle(clicked)
        }
      }),
    next: clicks$.next.bind(clicks$)
  }
}
