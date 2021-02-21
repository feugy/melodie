'use strict'

const osLocale = require('os-locale')
const { getSystemLocale } = require('./locale')

jest.mock('os-locale')

describe('getSystemLocale utility', () => {
  beforeEach(() => jest.clearAllMocks())

  it('removes regional variant', async () => {
    osLocale.mockResolvedValueOnce('fr-FR')
    expect(await getSystemLocale()).toEqual('fr')
  })

  it('returns regional-less result', async () => {
    osLocale.mockResolvedValueOnce('en')
    expect(await getSystemLocale()).toEqual('en')
  })
})
