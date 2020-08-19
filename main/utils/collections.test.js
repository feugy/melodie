'use strict'

const { difference, uniq, differenceRef, uniqRef } = require('./collections')

describe('collection utilities', () => {
  describe('difference()', () => {
    it('removes unwanted elements', () => {
      expect(difference([1, 2, 3, 4, 5], [5, 10, 2])).toEqual([1, 3, 4])
    })

    it('supports undefined target', () => {
      expect(difference(undefined, [5, 10, 2])).toEqual([])
    })

    it('supports undefined source', () => {
      expect(difference([1, 2, 3, 4, 5], undefined)).toEqual([1, 2, 3, 4, 5])
    })

    it('removes undefined', () => {
      expect(difference([1, null, 3, undefined, 5], [5, null, 2])).toEqual([
        1,
        3
      ])
    })
  })

  describe('differenceRef()', () => {
    it('removes unwanted references', () => {
      expect(
        differenceRef(
          [
            [1, 'a'],
            [2, 'b'],
            [3, 'c'],
            [4, 'd'],
            [5, 'e']
          ],
          [[5, 'e'], [10], [2, 'z']]
        )
      ).toEqual([
        [1, 'a'],
        [3, 'c'],
        [4, 'd']
      ])
    })

    it('removes undefined refs', () => {
      expect(
        differenceRef(
          [[1, 'a'], null, [3, 'c'], undefined, [5, 'e']],
          [[5, 'e'], null, [2, 'z']]
        )
      ).toEqual([
        [1, 'a'],
        [3, 'c']
      ])
    })

    it('supports undefined target', () => {
      expect(
        differenceRef(undefined, [
          [5, 'e'],
          [2, 'z']
        ])
      ).toEqual([])
    })

    it('supports undefined source', () => {
      expect(
        differenceRef(
          [
            [5, 'e'],
            [2, 'z']
          ],
          undefined
        )
      ).toEqual([
        [5, 'e'],
        [2, 'z']
      ])
    })
  })

  describe('uniq()', () => {
    it('removes duplicates', () => {
      expect(uniq([1, 2, 2, 3, 4, 5, 4, 1])).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('uniqRef()', () => {
    it('removes duplicates', () => {
      expect(
        uniqRef([
          [1, 'a'],
          [2, 'b'],
          [2, 'z'],
          [3, 'c'],
          [4, 'd'],
          [5, 'e'],
          [4, 'd'],
          [1, 'y']
        ])
      ).toEqual([
        [1, 'a'],
        [2, 'b'],
        [3, 'c'],
        [4, 'd'],
        [5, 'e']
      ])
    })
  })
})
