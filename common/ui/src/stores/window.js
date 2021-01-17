'use strict'

import { BehaviorSubject, fromEvent } from 'rxjs'
import { debounceTime } from 'rxjs/operators'

const screenSize$ = new BehaviorSubject(calc(window.innerWidth))

export const screenSize = screenSize$.asObservable()
export const SM = 1
export const MD = 2
export const LG = 3
export const XL = 4

fromEvent(window, 'resize')
  .pipe(debounceTime(100))
  .subscribe(({ target }) => screenSize$.next(calc(target.innerWidth)))

function calc(width) {
  if (width >= 1280) {
    return 4
  }
  if (width >= 1024) {
    return 3
  }
  if (width >= 768) {
    return 2
  }
  return 1
}
