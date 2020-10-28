'use strict'

import { withKnobs, boolean, text } from '@storybook/addon-knobs'
import Trapezium from './Trapezium.stories.svelte'

export default {
  title: 'Site components/Trapezium',
  decorators: [withKnobs]
}

export const Default = () => ({
  Component: Trapezium,
  props: {
    color: text('color', '#353849'),
    inverted: boolean('Inverted', false)
  }
})
