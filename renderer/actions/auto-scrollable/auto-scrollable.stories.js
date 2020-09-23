'use strict'

import { withKnobs, number, boolean } from '@storybook/addon-knobs'
import Scrollable from './auto-scrollable.stories.svelte'

export default {
  title: 'Actions/auto-scrollable',
  decorators: [withKnobs]
}

export const Default = () => ({
  Component: Scrollable,
  props: {
    enabled: boolean('Enabled', true),
    borderDetection: number('Border detection', 75),
    maxScroll: number('Max scroll', 50)
  }
})
