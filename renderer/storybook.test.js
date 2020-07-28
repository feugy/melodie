'use strict'

import initStoryshots, {
  multiSnapshotWithOptions
} from '@storybook/addon-storyshots'

initStoryshots({
  storyKindRegex: /^((?!Nav).)*$/,
  test: multiSnapshotWithOptions()
})
