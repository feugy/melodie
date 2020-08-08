'use strict'

import initStoryshots, {
  multiSnapshotWithOptions
} from '@storybook/addon-storyshots'

let originalRandom

beforeAll(() => {
  originalRandom = Math.random
  Math.random = () => 0.1
})

afterAll(() => {
  Math.random = originalRandom
})

initStoryshots({
  storyKindRegex: /^((?!Nav|Sheet|Media).)*$/,
  test: multiSnapshotWithOptions()
})
