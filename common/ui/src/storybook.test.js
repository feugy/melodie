'use strict'

import initStoryshots from '@storybook/addon-storyshots'
import electron from 'electron'
import { sleep } from './tests'

jest.mock('../.storybook/loaders', () => {
  const { invoke } = require('./utils')
  return {
    websocketResponse(mock) {
      invoke.mockImplementation(async (...args) => mock(...args))
    }
  }
})

let originalRandom

beforeAll(() => {
  originalRandom = Math.random
  Math.random = () => 0.1
  window.electron = electron

  // JSDom does not support scrollIntoView as it doesn't do layout
  Element.prototype.scrollIntoView = jest.fn()
})

beforeEach(jest.clearAllMocks)

afterAll(() => {
  Math.random = originalRandom
})

initStoryshots({
  // Dialogue because portal display is always deffered
  // Sticky & Nav because jsdom does not support IntersectionObserver API
  // System Notifier because it does not support MediaMetadata
  // ExpandableList because it mocks getBoundingClientRect
  // MediaSelector & Sheet because the story imlies user action
  storyKindRegex: /^((?!Dialogue|Nav|Sticky|System|Expandable|Sheet|Media).)*$/i,
  asyncJest: true,
  test: async ({
    done,
    story,
    context,
    renderTree,
    stories2snapsConverter
  }) => {
    // store snapshot in different files
    const snapshotFileName = stories2snapsConverter.getSnapshotFileName(context)
    const result = renderTree(story, context)

    // give it some time, for async stories
    await sleep(story.delay || 0)
    expect(result).toMatchSpecificSnapshot(snapshotFileName)
    done()
  }
})
