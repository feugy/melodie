'use strict'

import * as OTPAuth from 'otpauth'
import { BehaviorSubject } from 'rxjs'
import { fromServerEvent } from '../utils/connection'

export const period = 30
const storageKey = 'totp'
let generator
let timeout
let totp$ = new BehaviorSubject(null)
let unsubscribe
let totpUrl$ = new BehaviorSubject('')

function refresh() {
  clearTimeout(timeout)
  totp$.next(generator.generate())
  timeout = setTimeout(
    refresh,
    (period - (Math.floor(Date.now() / 1000) % period)) * 1000
  )
}

export function init(totpSecret, totp = null) {
  const secret = totpSecret
  if (secret) {
    generator = new OTPAuth.TOTP({
      issuer: 'Mélodie',
      algorithm: 'SHA256',
      digits: 6,
      period: period,
      secret: OTPAuth.Secret.fromHex(secret)
    })
    totpUrl$.next(generator.toString())
    refresh()
  } else {
    const stored = localStorage.getItem(storageKey)
    const serverSubscription = fromServerEvent(storageKey).subscribe(totp$)
    const storageSubscription = totp$.subscribe({
      next: value =>
        value
          ? localStorage.setItem(storageKey, value)
          : localStorage.removeItem(storageKey)
    })
    unsubscribe = () => {
      serverSubscription.unsubscribe()
      storageSubscription.unsubscribe()
    }
    totp$.next(totp || stored)
  }
}

export const totp = totp$.asObservable()

export const totpUrl = totpUrl$.asObservable()

export function cleanup() {
  clearTimeout(timeout)
  totp$.next(null)
  generator = null
  unsubscribe?.()
  unsubscribe = null
}

export function setTotp(value) {
  totp$.next(value)
}
