'use strict'

import { get } from 'svelte/store'
import { sleep } from '../tests'
import { screenSize, isTouchable, SM, MD, LG, XL } from './window'

describe('window store', () => {
  beforeEach(jest.resetAllMocks)

  async function resizeTo(width) {
    window.innerWidth = width
    window.dispatchEvent(new Event('resize'))
    await sleep(200)
  }

  describe('screenSize()', () => {
    it.each([
      [300, 'small', SM],
      [767, 'small', SM],
      [768, 'medium', MD],
      [1023, 'medium', MD],
      [1024, 'large', LG],
      [1279, 'large', LG],
      [1280, 'extra large', XL],
      [2400, 'extra large', XL]
    ])('consider width of %spx as %s display', async (width, unused, size) => {
      await resizeTo(width)
      expect(get(screenSize)).toEqual(size)
    })
  })

  describe('isTouchable()', () => {
    it('detects not touchable display', async () => {
      expect(get(isTouchable)).toBeFalse()
    })

    it('detects touchable display', async () => {
      navigator.maxTouchPoints = 4
      await resizeTo(1024)
      expect(get(isTouchable)).toBeTrue()
    })
  })
})
