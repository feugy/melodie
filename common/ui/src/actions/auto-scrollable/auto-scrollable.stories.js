'use strict'

import Scrollable from './auto-scrollable.stories.svelte'

export default {
  title: 'Actions/auto-scrollable',
  argTypes: {
    borderDetection: { control: { type: 'number' } },
    maxScroll: { control: { type: 'number' } }
  },
  parameters: { layout: null }
}

export const Default = args => ({
  Component: Scrollable,
  props: args
})
Default.args = {
  borderDetection: 75,
  maxScroll: 30
}
