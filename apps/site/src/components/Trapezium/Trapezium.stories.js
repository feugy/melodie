'use strict'

import Trapezium from './Trapezium.stories.svelte'

export default {
  title: 'Site components/Trapezium',
  args: {
    color: '#353849',
    inverted: false
  },
  argTypes: {
    color: { control: { type: 'color' } }
  }
}

export const Default = args => ({
  Component: Trapezium,
  props: args
})
