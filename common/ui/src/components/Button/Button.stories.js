'use strict'

import { action } from '@storybook/addon-actions'
import Button from './Button.svelte'

export default {
  title: 'Components/Button',
  excludeStories: /.*Data$/,
  argTypes: {
    badge: { control: { type: 'number' } }
  }
}

export const actionsData = {
  click: action('on button click')
}

export const Default = () => ({
  Component: Button,
  props: { text: 'Default' },
  on: actionsData
})

export const Primary = () => ({
  Component: Button,
  props: { text: 'Primary', primary: true },
  on: actionsData
})

export const LargeTextAndIcon = () => ({
  Component: Button,
  props: { text: 'Hey!', icon: 'person', large: true },
  on: actionsData
})

export const TextAndIcon = () => ({
  Component: Button,
  props: { text: 'Hello', icon: 'face' },
  on: actionsData
})

export const PrimaryIcon = () => ({
  Component: Button,
  props: { icon: 'volume_up', primary: true },
  on: actionsData
})

export const LargeIcon = () => ({
  Component: Button,
  props: { icon: 'play_arrow', large: true },
  on: actionsData
})

export const WithBadge = args => ({
  Component: Button,
  props: { text: 'Hello', icon: 'face', ...args },
  on: actionsData
})
WithBadge.args = {
  badge: 23
}

export const WithBadgeLimit = args => ({
  Component: Button,
  props: {
    text: 'Just too much',
    icon: 'warning',
    badge: 1000,
    ...args
  },
  on: actionsData
})
WithBadgeLimit.args = {
  badge: 1000
}

export const PrimaryWithBadge = args => ({
  Component: Button,
  props: {
    text: 'Hello',
    icon: 'face',
    primary: true,
    ...args
  },
  on: actionsData
})
PrimaryWithBadge.args = {
  badge: 5
}
