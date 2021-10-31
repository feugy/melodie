'use strict'

import * as OTPAuth from 'otpauth'
import { BehaviorSubject } from 'rxjs'

export const period = 30
let generator
let timeout
let totp$ = new BehaviorSubject(null)

function refresh() {
  clearTimeout(timeout)
  totp$.next(generator.generate())
  timeout = setTimeout(
    refresh,
    period - (Math.floor(Date.now() / 1000) % period)
  )
}

export function init(totpSecret, totp = null) {
  const secret = totpSecret
  totp$.next(totp)
  if (secret) {
    generator = new OTPAuth.TOTP({
      issuer: 'Mélodie',
      algorithm: 'SHA256',
      digits: 6,
      period: period,
      secret: OTPAuth.Secret.fromHex(secret)
    })
    refresh()
  }
}

export const totp = totp$.asObservable()

export function cleanup() {
  clearTimeout(timeout)
  if (generator) {
    generator = null
  }
  totp$.next(null)
}
