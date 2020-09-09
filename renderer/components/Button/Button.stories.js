'use strict'

import { action } from '@storybook/addon-actions'
import { withKnobs, number } from '@storybook/addon-knobs'
import Button from './Button.svelte'

export default {
  title: 'Components/Button',
  excludeStories: /.*Data$/,
  decorators: [withKnobs]
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

export const WithBadge = () => ({
  Component: Button,
  props: { text: 'Hello', icon: 'face', badge: number('badge', 23) },
  on: actionsData
})

export const WithBadgeLimit = () => ({
  Component: Button,
  props: {
    text: 'Just too much',
    icon: 'warning',
    badge: number('badge', 1000)
  },
  on: actionsData
})

export const PrimaryWithBadge = () => ({
  Component: Button,
  props: {
    text: 'Hello',
    icon: 'face',
    primary: true,
    badge: number('badge', 5)
  },
  on: actionsData
})
