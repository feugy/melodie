'use strict'

export * from './jest-setup'

export const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))
