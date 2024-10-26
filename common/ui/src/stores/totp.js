import * as OTPAuth from 'otpauth'
import { BehaviorSubject } from 'rxjs'

export const period = 30
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
    totp$.next(totp)
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
