'use strict'

const { difference, uniq } = require('./collections')

describe('collection utilities', () => {
  describe('difference()', () => {
    it('removes unwanted elements', () => {
      expect(difference([1, 2, 3, 4, 5], [5, 10], [2])).toEqual([1, 3, 4])
    })
  })

  describe('uniq()', () => {
    it('removes duplicates', () => {
      expect(uniq([1, 2, 2, 3, 4, 5, 4, 1])).toEqual([1, 2, 3, 4, 5])
    })
  })
})
