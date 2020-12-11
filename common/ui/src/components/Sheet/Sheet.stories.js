'use strict'

import Sheet from './Sheet.stories.svelte'

export default {
  title: 'Components/Sheet',
  excludeStories: /.*Data$/
}

export const Default = () => ({
  Component: Sheet,
  props: {
    content: '<p>Here is some content for the Sheet</p>'
  }
})
