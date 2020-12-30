'use strict'

import { action } from '@storybook/addon-actions'
import BroadcastButton from './BroadcastButton.svelte'

export default {
  title: 'Components/Broadcast button',
  excludeStories: /.*Data$/,
  argTypes: {
    address: {
      control: { type: 'text' },
      defaultValue: 'http://192.168.0.10:8080'
    },
    isBroadcasting: { control: { type: 'boolean' }, defaultValue: false }
  }
}

export const Default = args => ({
  Component: BroadcastButton,
  props: {
    isBroadcasting: false,
    ...args
  },
  on: { click: action('on button click') }
})
