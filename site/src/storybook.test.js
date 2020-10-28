'use strict'

import initStoryshots from '@storybook/addon-storyshots'

initStoryshots({
  asyncJest: true,
  configPath: 'site/.storybook',
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
    await new Promise(resolve => setTimeout(resolve, story.delay || 0))
    expect(result).toMatchSpecificSnapshot(snapshotFileName)
    done()
  }
})
