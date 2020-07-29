'use strict'

import initStoryshots, {
  multiSnapshotWithOptions
} from '@storybook/addon-storyshots'

initStoryshots({
  storyKindRegex: /^((?!Nav|Sheet).)*$/,
  test: multiSnapshotWithOptions()
})
