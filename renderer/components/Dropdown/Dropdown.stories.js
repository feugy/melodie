'use strict'

import { action } from '@storybook/addon-actions'
import { actionsData as buttonActionsData } from '../Button/Button.stories'
import Dropdown from './Dropdown.stories.svelte'

export default {
  title: 'Components/Dropdown',
  excludeStories: /.*Data$/
}

export const dropdownData = {
  options: [
    { label: 'one' },
    { label: 'two' },
    { label: 'three', icon: 'add' },
    { label: 'four', icon: 'people' },
    { label: `this is a very long label that doesn't wrap`, icon: 'play_arrow' }
  ]
}

export const actionsData = {
  ...buttonActionsData,
  select: action('on dropdown option select')
}

export const Default = () => ({
  Component: Dropdown,
  props: dropdownData,
  on: actionsData
})

export const SimpleArray = () => ({
  Component: Dropdown,
  props: { options: ['one', 'two', 'three'] },
  on: actionsData
})

export const IndependentTextAndIcon = () => ({
  Component: Dropdown,
  props: {
    valueAsText: false,
    text: 'options',
    icon: 'settings',
    ...dropdownData
  },
  on: actionsData
})

export const IconOnly = () => ({
  Component: Dropdown,
  props: {
    icon: 'more_vert',
    withArrow: false,
    valueAsText: false,
    ...dropdownData
  },
  on: actionsData
})

export const CustomButtonOptions = () => ({
  Component: Dropdown,
  props: {
    text: 'Primary',
    primary: true,
    valueAsText: false,
    icon: 'person',
    options: [...dropdownData.options]
  },
  on: actionsData
})
