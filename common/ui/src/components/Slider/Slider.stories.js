'use strict'

import { action } from '@storybook/addon-actions'
import Slider from './Slider.svelte'

export default {
  title: 'Components/Slider',
  excludeStories: /.*Data$/,
  parameters: { layout: 'padded' }
}

export const actionsData = {
  input: action('on slider input')
}

export const Default = () => ({
  Component: Slider,
  props: { current: 10, max: 100, class: 'w-1/2' },
  on: actionsData
})
