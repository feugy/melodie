'use strict'

import { withKnobs, number } from '@storybook/addon-knobs'
import Scrollable from './auto-scrollable.stories.svelte'

export default {
  title: 'Actions/auto-scrollable',
  decorators: [withKnobs]
}

export const Default = () => ({
  Component: Scrollable,
  props: {
    borderDetection: number('Border detection', 75),
    maxScroll: number('Max scroll', 30)
  }
})
