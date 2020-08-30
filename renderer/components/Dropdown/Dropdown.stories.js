'use strict'

import { action } from '@storybook/addon-actions'
import { actionsData as buttonActionsData } from '../Button/Button.stories'
import Dropdown from './Dropdown.stories.svelte'
import CustomOption from './CustomOption.stories.svelte'

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

export const dropdownSimpleData = {
  options: ['one', 'two', 'three']
}

export const dropdownCustomData = {
  options: [
    { label: 'simple' },
    { label: 'simple with icon', icon: 'add' },
    {
      Component: CustomOption,
      props: {
        text: 'enter name:',
        onValueSet: action('on custom option action!')
      }
    }
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
  props: dropdownSimpleData,
  on: actionsData
})

export const CustomOptions = () => ({
  Component: Dropdown,
  props: dropdownCustomData,
  on: actionsData
})

export const IndependentTextAndIcon = () => ({
  Component: Dropdown,
  props: {
    valueAsText: false,
    text: 'options',
    icon: 'settings',
    ...dropdownData,
    align: 'text-left'
  },
  on: actionsData
})

export const IconOnlyWithRelativeParent = () => ({
  Component: Dropdown,
  props: {
    parentPosition: 'relative',
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
    options: [...dropdownData.options],
    align: 'text-right'
  },
  on: actionsData
})
