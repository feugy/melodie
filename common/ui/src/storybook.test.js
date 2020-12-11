'use strict'

import initStoryshots from '@storybook/addon-storyshots'
import electron from 'electron'
import { sleep } from './tests'

let originalRandom

beforeAll(() => {
  originalRandom = Math.random
  Math.random = () => 0.1
  window.electron = electron

  // JSDom does not support scrollIntoView as it doesn't do layout
  Element.prototype.scrollIntoView = jest.fn()
})

afterAll(() => {
  Math.random = originalRandom
})

initStoryshots({
  // Sticky & Nav because jsdom does not support IntersectionObserver API
  // System Notifier because it does not support MediaMetadata
  // ExpandableList because it mocks getBoundingClientRect
  // MediaSelector & Sheet because the story imlies user action
  storyKindRegex: /^((?!Nav|Sticky|System|Expandable|Sheet|Media).)*$/,
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
