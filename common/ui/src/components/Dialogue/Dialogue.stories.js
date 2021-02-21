'use strict'

import { action } from '@storybook/addon-actions'
import Dialogue from './Dialogue.stories.svelte'

export default {
  title: 'Components/Dialogue',
  excludeStories: /.*Data$/,
  argTypes: {
    title: { control: { type: 'text' }, defaultValue: 'This is a title' },
    open: { control: { type: 'boolean' }, defaultValue: true },
    noClose: { control: { type: 'boolean' }, defaultValue: false }
  }
}

export const actionsData = {
  close: action('on dialogue close'),
  open: action('on dialogue open')
}

export const Default = args => ({
  Component: Dialogue,
  props: args,
  on: actionsData
})
