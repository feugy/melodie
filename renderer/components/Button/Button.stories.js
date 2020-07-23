'use strict'

import { action } from '@storybook/addon-actions'
import Button from './Button.svelte'

export default {
  title: 'Components/Button',
  excludeStories: /.*Data$/
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
