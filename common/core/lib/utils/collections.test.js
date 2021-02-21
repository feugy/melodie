'use strict'

const {
  difference,
  uniq,
  differenceRef,
  uniqRef,
  parseRawRef,
  parseRawRefArray
} = require('./collections')

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

  describe('parseRawRef', () => {
    it('parses regular ref', () => {
      const ref = [123, 'foo']
      expect(parseRawRef(JSON.stringify(ref))).toEqual(ref)
    })

    it('parses null ref', () => {
      const ref = [123, null]
      expect(parseRawRef(JSON.stringify(ref))).toEqual(ref)
    })

    it('parses empty string', () => {
      const ref = [123, '']
      expect(parseRawRef(JSON.stringify(ref))).toEqual(ref)
    })

    it('parses text including commas and espaced delimiters', () => {
      const ref = [123, 'foo, "bar"']
      expect(parseRawRef(JSON.stringify(ref))).toEqual(ref)
    })

    it('handles null', () => {
      const ref = null
      expect(parseRawRef(JSON.stringify(ref))).toEqual(ref)
    })
  })

  describe('parseRawRefs', () => {
    it('parses regular refs array', () => {
      const refs = [
        [123, 'foo'],
        [432, 'bar'],
        [678, 'baz']
      ]
      expect(parseRawRefArray(JSON.stringify(refs))).toEqual(refs)
    })

    it('parses regular refs with commas', () => {
      const refs = [
        [123, 'foo, bar'],
        [432, 'baz'],
        [678, 'wee']
      ]
      expect(parseRawRefArray(JSON.stringify(refs))).toEqual(refs)
    })

    it('parses array with single ref', () => {
      const refs = [[123, 'foo']]
      expect(parseRawRefArray(JSON.stringify(refs))).toEqual(refs)
    })

    it('parses array with null ref', () => {
      const refs = [
        [123, null],
        [456, 'foo'],
        [879, null]
      ]
      expect(parseRawRefArray(JSON.stringify(refs))).toEqual(refs)
    })

    it('parses empty array', () => {
      const refs = []
      expect(parseRawRefArray(JSON.stringify(refs))).toEqual(refs)
    })

    it('handles null', () => {
      const refs = null
      expect(parseRawRefArray(JSON.stringify(refs))).toEqual(refs)
    })
  })
})
