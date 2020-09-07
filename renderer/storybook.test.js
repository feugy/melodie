'use strict'

import initStoryshots from '@storybook/addon-storyshots'
import electron from 'electron'
import { sleep } from './tests'

let originalRandom

beforeAll(() => {
  originalRandom = Math.random
  Math.random = () => 0.1
  window.electron = electron
})

afterAll(() => {
  Math.random = originalRandom
})

initStoryshots({
  storyKindRegex: /^((?!Nav|Sheet|Media|Expandable|System).)*$/,
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
