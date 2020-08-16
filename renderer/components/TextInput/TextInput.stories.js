'use strict'

import { action } from '@storybook/addon-actions'
import TextInput from './TextInput.stories.svelte'

export default {
  title: 'Components/TextInput',
  excludeStories: /.*Data$/
}

export const actionsData = {
  iconClick: action('on icon click')
}

export const Default = () => ({
  Component: TextInput,
  props: {},
  on: actionsData
})

export const WithIcon = () => ({
  Component: TextInput,
  props: { icon: 'search', type: 'search' },
  on: actionsData
})

export const WithValue = () => ({
  Component: TextInput,
  props: { icon: 'person', value: 'hej!' },
  on: actionsData
})
